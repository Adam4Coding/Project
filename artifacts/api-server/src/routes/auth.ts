import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, vendorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { SignupBody, LoginBody } from "@workspace/api-zod";
import { formatVendorSubscriptionFields, normalizeVendorSubscription } from "../lib/vendor-subscription";

const router: IRouter = Router();

function toAuthVendorSummary(vp: typeof vendorProfilesTable.$inferSelect) {
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

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }
  const { email, password, name, role, cartName, category, city } = parsed.data;

  if (role === "vendor" && (!cartName?.trim() || !category?.trim() || !city?.trim())) {
    res.status(400).json({ message: "Cart name, category, and city are required for vendor accounts." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name, role }).returning();

  let vendorProfile = null;
  if (role === "vendor") {
    const [vp] = await db.insert(vendorProfilesTable).values({
      userId: user.id,
      cartName: cartName ?? name,
      category: category ?? "",
      city: city ?? "",
      bio: "",
      isActive: false,
      subscriptionStatus: "inactive",
      onboardingComplete: false,
    }).returning();
    vendorProfile = toAuthVendorSummary(vp);
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    vendorProfile,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  let vendorProfile = null;
  if (user.role === "vendor") {
    const [vp] = await db.select().from(vendorProfilesTable).where(eq(vendorProfilesTable.userId, user.id)).limit(1);
    if (vp) {
      vendorProfile = toAuthVendorSummary(await normalizeVendorSubscription(vp));
    }
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    vendorProfile,
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user!.userId)).limit(1);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  let vendorProfile = null;
  if (user.role === "vendor") {
    const [vp] = await db.select().from(vendorProfilesTable).where(eq(vendorProfilesTable.userId, user.id)).limit(1);
    if (vp) {
      vendorProfile = toAuthVendorSummary(await normalizeVendorSubscription(vp));
    }
  }

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    vendorProfile,
  });
});

export default router;
