import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vendorProfilesTable, usersTable, savedVendorsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireVendorAuth, type AuthenticatedRequest } from "../lib/auth";
import { ListVendorsQueryParams, UpdateMyVendorProfileBody, CompleteOnboardingBody } from "@workspace/api-zod";
import {
  formatVendorSubscriptionFields,
  isVendorLive,
  normalizeVendorSubscription,
} from "../lib/vendor-subscription";
import { seededDemoVendorNames } from "../lib/demo-data-cleanup";

const router: IRouter = Router();
const hiddenSeededDemoCartNames = new Set(seededDemoVendorNames);
const supportedSocialPromoPlatforms = new Set(["instagram", "tiktok", "facebook", "linkedin", "twitter", "x"]);

function parseVendorProfile(vp: typeof vendorProfilesTable.$inferSelect) {
  return {
    id: vp.id,
    userId: vp.userId,
    cartName: vp.cartName,
    category: vp.category,
    bio: vp.bio,
    city: vp.city,
    coverPhoto: vp.coverPhoto,
    galleryPhotos: JSON.parse(vp.galleryPhotos || "[]"),
    startingPrice: vp.startingPrice,
    packages: JSON.parse(vp.packages || "[]"),
    avgRating: vp.avgRating,
    profileViews: vp.profileViews,
    onboardingComplete: vp.onboardingComplete,
    ...formatVendorSubscriptionFields(vp),
    totalReviews: 0,
    isSaved: false,
  };
}

function parseVendorSummary(vp: typeof vendorProfilesTable.$inferSelect) {
  return {
    id: vp.id,
    cartName: vp.cartName,
    category: vp.category,
    city: vp.city,
    coverPhoto: vp.coverPhoto,
    startingPrice: vp.startingPrice,
    avgRating: vp.avgRating,
    onboardingComplete: vp.onboardingComplete,
    ...formatVendorSubscriptionFields(vp),
  };
}

function isPublicVendor(vp: typeof vendorProfilesTable.$inferSelect) {
  return isVendorLive(vp) && !hiddenSeededDemoCartNames.has(vp.cartName);
}

router.get("/vendors/trending", async (_req, res): Promise<void> => {
  const vendors = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.isActive, true))
    .orderBy(sql`${vendorProfilesTable.avgRating} DESC`)
    .limit(24);

  const normalized = (await Promise.all(vendors.map(normalizeVendorSubscription)))
    .filter(isPublicVendor)
    .slice(0, 8);
  res.json({ vendors: normalized.map(parseVendorSummary), total: normalized.length });
});

router.get("/vendors/me", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const [vp] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!vp) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  res.json({ vendor: parseVendorProfile(await normalizeVendorSubscription(vp)) });
});

router.put("/vendors/me", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = UpdateMyVendorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { cartName, category, bio, city, coverPhoto, galleryPhotos, startingPrice, packages } = parsed.data;
  const updateData: Partial<typeof vendorProfilesTable.$inferInsert> = {};
  if (cartName !== undefined) updateData.cartName = cartName;
  if (category !== undefined) updateData.category = category;
  if (bio !== undefined) updateData.bio = bio;
  if (city !== undefined) updateData.city = city;
  if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
  if (galleryPhotos !== undefined) updateData.galleryPhotos = JSON.stringify(galleryPhotos);
  if (startingPrice !== undefined) updateData.startingPrice = startingPrice;
  if (packages !== undefined) updateData.packages = JSON.stringify(packages);

  const [vp] = await db
    .update(vendorProfilesTable)
    .set(updateData)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .returning();

  if (!vp) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  res.json({ vendor: parseVendorProfile(await normalizeVendorSubscription(vp)) });
});

router.get("/vendors", async (req, res): Promise<void> => {
  const parsed = ListVendorsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const { category, city, minPrice, maxPrice, rating, limit = 12, offset = 0 } = params as {
    category?: string; city?: string; minPrice?: number; maxPrice?: number;
    rating?: number; limit?: number; offset?: number;
  };

  const allVendors = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.isActive, true));

  let filtered = (await Promise.all(allVendors.map(normalizeVendorSubscription))).filter(isPublicVendor);
  if (category) {
    filtered = filtered.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }
  if (city) {
    filtered = filtered.filter(v => v.city.toLowerCase().includes(city.toLowerCase()));
  }
  if (minPrice !== undefined) {
    filtered = filtered.filter(v => v.startingPrice >= minPrice);
  }
  if (maxPrice !== undefined) {
    filtered = filtered.filter(v => v.startingPrice <= maxPrice);
  }
  if (rating !== undefined) {
    filtered = filtered.filter(v => v.avgRating >= rating);
  }

  const total = filtered.length;
  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ vendors: paginated.map(parseVendorSummary), total });
});

router.get("/vendors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid vendor id" });
    return;
  }

  const [vp] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.id, id))
    .limit(1);

  if (!vp) {
    res.status(404).json({ message: "Vendor not found" });
    return;
  }

  const normalizedVendor = await normalizeVendorSubscription(vp);
  if (!isPublicVendor(normalizedVendor)) {
    res.status(404).json({ message: "Vendor not found" });
    return;
  }

  // Increment profile views
  await db
    .update(vendorProfilesTable)
    .set({ profileViews: vp.profileViews + 1 })
    .where(eq(vendorProfilesTable.id, id));

  // Check if customer saved this vendor
  let isSaved = false;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const { verifyToken } = await import("../lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    if (payload && payload.role === "customer") {
      const saved = await db
        .select()
        .from(savedVendorsTable)
        .where(and(
          eq(savedVendorsTable.customerId, payload.userId),
          eq(savedVendorsTable.vendorId, id),
        ))
        .limit(1);
      isSaved = saved.length > 0;
    }
  }

  const { reviewsTable } = await import("@workspace/db");
  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.vendorId, id));

  const detail = parseVendorProfile(normalizedVendor);
  detail.profileViews = normalizedVendor.profileViews + 1;
  detail.totalReviews = reviews.length;
  detail.isSaved = isSaved;

  res.json({ vendor: detail });
});

router.post("/onboarding", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { cartName, category, bio, city, coverPhoto, galleryPhotos, startingPrice, packages } = parsed.data;

  const [existingProfile] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!existingProfile) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  const [vp] = await db
    .update(vendorProfilesTable)
    .set({
      cartName,
      category,
      bio,
      city,
      coverPhoto: coverPhoto ?? "",
      galleryPhotos: JSON.stringify(galleryPhotos ?? []),
      startingPrice,
      packages: JSON.stringify(packages ?? []),
      isActive: existingProfile.isActive,
      subscriptionStatus: existingProfile.subscriptionStatus,
      onboardingComplete: true,
    })
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .returning();

  if (!vp) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  res.status(201).json({ vendor: parseVendorProfile(vp) });
});

router.get("/vendor-stats", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  const [vp] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!vp) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  const { bookingsTable } = await import("@workspace/db");
  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.vendorId, vp.id));

  const totalBookings = allBookings.length;
  const pendingRequests = allBookings.filter(b => b.status === "pending").length;
  const confirmedBookings = allBookings.filter(b => b.status === "confirmed").length;
  const declinedBookings = allBookings.filter(b => b.status === "declined").length;

  res.json({
    totalBookings,
    pendingRequests,
    profileViews: vp.profileViews,
    avgRating: vp.avgRating,
    confirmedBookings,
    declinedBookings,
  });
});

router.post("/subscription/activate", requireVendorAuth, async (req, res): Promise<void> => {
  res.status(410).json({ message: "Use Stripe Checkout to start your free month." });
});

router.post("/subscription/social-promo", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { platform, handle, proofUrl } = req.body as {
    platform?: unknown;
    handle?: unknown;
    proofUrl?: unknown;
  };

  const cleanPlatform = typeof platform === "string" ? platform.trim().slice(0, 80) : "";
  const cleanHandle = typeof handle === "string" ? handle.trim().slice(0, 120) : "";
  const cleanProofUrl = typeof proofUrl === "string" ? proofUrl.trim().slice(0, 500) : "";
  const normalizedPlatform = cleanPlatform.toLowerCase();
  const proofUrlIsValid = (() => {
    try {
      const parsedUrl = new URL(cleanProofUrl);
      return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
    } catch {
      return false;
    }
  })();

  if (!cleanPlatform || !cleanHandle || !cleanProofUrl) {
    res.status(400).json({ message: "Platform, handle, and proof link are required." });
    return;
  }

  if (!supportedSocialPromoPlatforms.has(normalizedPlatform)) {
    res.status(400).json({ message: "Use Instagram, TikTok, Facebook, LinkedIn, Twitter, or X." });
    return;
  }

  if (!proofUrlIsValid) {
    res.status(400).json({ message: "Proof must be a valid link to your story, post, or uploaded screenshot." });
    return;
  }

  const [existing] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  if (existing.subscriptionStatus === "inactive") {
    res.status(400).json({ message: "Start your free month before submitting a bonus month request." });
    return;
  }

  if (existing.socialPromoStatus === "pending") {
    res.status(400).json({ message: "Your bonus month request is already under review." });
    return;
  }

  if (existing.socialPromoStatus === "approved" || existing.bonusTrialEndsAt) {
    res.status(400).json({ message: "Your bonus month has already been approved." });
    return;
  }

  const [vp] = await db
    .update(vendorProfilesTable)
    .set({
      socialPromoStatus: "pending",
      socialPromoPlatform: normalizedPlatform,
      socialPromoHandle: cleanHandle,
      socialPromoProofUrl: cleanProofUrl,
      socialPromoSubmittedAt: new Date(),
    })
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .returning();

  res.json({ vendor: parseVendorProfile(vp) });
});

export default router;
