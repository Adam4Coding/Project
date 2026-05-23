import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedVendorsTable, vendorProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCustomerAuth, type AuthenticatedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/saved", requireCustomerAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const saved = await db
    .select()
    .from(savedVendorsTable)
    .where(eq(savedVendorsTable.customerId, authReq.user!.userId));

  const vendors = await Promise.all(
    saved.map(async (s) => {
      const [vp] = await db
        .select()
        .from(vendorProfilesTable)
        .where(eq(vendorProfilesTable.id, s.vendorId))
        .limit(1);
      if (!vp) return null;
      return {
        id: vp.id,
        cartName: vp.cartName,
        category: vp.category,
        city: vp.city,
        coverPhoto: vp.coverPhoto,
        startingPrice: vp.startingPrice,
        avgRating: vp.avgRating,
        isActive: vp.isActive,
        subscriptionStatus: vp.subscriptionStatus,
        onboardingComplete: vp.onboardingComplete,
      };
    })
  );

  res.json({ vendors: vendors.filter(Boolean) });
});

router.post("/saved/:vendorId", requireCustomerAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const raw = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const vendorId = parseInt(raw, 10);
  if (isNaN(vendorId)) {
    res.status(400).json({ message: "Invalid vendor id" });
    return;
  }

  const existing = await db
    .select()
    .from(savedVendorsTable)
    .where(and(
      eq(savedVendorsTable.customerId, authReq.user!.userId),
      eq(savedVendorsTable.vendorId, vendorId),
    ))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(savedVendorsTable)
      .where(and(
        eq(savedVendorsTable.customerId, authReq.user!.userId),
        eq(savedVendorsTable.vendorId, vendorId),
      ));
    res.json({ saved: false });
  } else {
    await db
      .insert(savedVendorsTable)
      .values({ customerId: authReq.user!.userId, vendorId });
    res.json({ saved: true });
  }
});

export default router;

