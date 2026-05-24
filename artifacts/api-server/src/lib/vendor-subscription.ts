import { db, vendorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const VENDOR_PLAN_PRICE_MONTHLY = 29;
export const VENDOR_FREE_TRIAL_DAYS = 30;

export type VendorSubscriptionStatus = "active" | "inactive" | "trialing";
export type VendorProfileRecord = typeof vendorProfilesTable.$inferSelect;

export function getFreeTrialEndDate(startDate = new Date()) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + VENDOR_FREE_TRIAL_DAYS);
  return endDate;
}

export function isVendorLive(vp: Pick<VendorProfileRecord, "isActive">) {
  return vp.isActive;
}

export async function normalizeVendorSubscription(vp: VendorProfileRecord) {
  if (vp.subscriptionStatus !== "trialing" || !vp.trialEndsAt) {
    return vp;
  }

  if (vp.trialEndsAt.getTime() > Date.now()) {
    return vp;
  }

  // TODO: Replace this app-level expiration with Stripe subscription webhooks.
  // Without real billing, an expired trial should not be promoted to paid/active.
  const [updated] = await db
    .update(vendorProfilesTable)
    .set({
      subscriptionStatus: "inactive",
      isActive: true,
    })
    .where(eq(vendorProfilesTable.id, vp.id))
    .returning();

  return updated ?? vp;
}

export function formatVendorSubscriptionFields(vp: VendorProfileRecord) {
  return {
    isActive: vp.isActive,
    subscriptionStatus: vp.subscriptionStatus as VendorSubscriptionStatus,
    trialStartedAt: vp.trialStartedAt?.toISOString(),
    trialEndsAt: vp.trialEndsAt?.toISOString(),
    socialPromoStatus: vp.socialPromoStatus,
    socialPromoPlatform: vp.socialPromoPlatform,
    socialPromoHandle: vp.socialPromoHandle,
    socialPromoProofUrl: vp.socialPromoProofUrl,
    socialPromoSubmittedAt: vp.socialPromoSubmittedAt?.toISOString(),
    socialPromoApprovedAt: vp.socialPromoApprovedAt?.toISOString(),
    bonusTrialEndsAt: vp.bonusTrialEndsAt?.toISOString(),
  };
}
