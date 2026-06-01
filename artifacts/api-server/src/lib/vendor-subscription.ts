import { db, vendorProfilesTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { getStripe } from "./stripe";

export const VENDOR_PLAN_PRICE_MONTHLY = 29;
export const VENDOR_FREE_TRIAL_DAYS = 30;
export const SOCIAL_PROMO_REVIEW_HOURS = 24;

export type VendorSubscriptionStatus = "active" | "inactive" | "trialing";
export type VendorProfileRecord = typeof vendorProfilesTable.$inferSelect;

export async function ensureVendorSubscriptionSchema() {
  await db.execute(sql`
    ALTER TABLE vendor_profiles
      ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS social_promo_status text NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS social_promo_platform text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_promo_handle text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_promo_proof_url text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS social_promo_submitted_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS social_promo_approved_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS bonus_trial_ends_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS stripe_customer_id text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text NOT NULL DEFAULT ''
  `);
}

export function getFreeTrialEndDate(startDate = new Date()) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + VENDOR_FREE_TRIAL_DAYS);
  return endDate;
}

export function getBonusTrialEndDate(currentTrialEndsAt?: Date | null, now = new Date()) {
  const startDate =
    currentTrialEndsAt && currentTrialEndsAt.getTime() > now.getTime()
      ? currentTrialEndsAt
      : now;

  return getFreeTrialEndDate(startDate);
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

  const stripe = getStripe();
  if (stripe && vp.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(vp.stripeSubscriptionId);
    const subscriptionStatus =
      subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trialing" : "inactive";
    const trialStartedAt = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
    const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    const [updated] = await db
      .update(vendorProfilesTable)
      .set({
        subscriptionStatus,
        isActive: subscriptionStatus !== "inactive",
        trialStartedAt,
        trialEndsAt,
      })
      .where(eq(vendorProfilesTable.id, vp.id))
      .returning();

    return updated ?? vp;
  }

  // Legacy safeguard for vendors that somehow had a trial without Stripe.
  const [updated] = await db
    .update(vendorProfilesTable)
    .set({
      subscriptionStatus: "inactive",
      isActive: false,
    })
    .where(eq(vendorProfilesTable.id, vp.id))
    .returning();

  return updated ?? vp;
}

export async function processPendingSocialPromoBonuses(now = new Date()) {
  const reviewCutoff = new Date(now);
  reviewCutoff.setHours(reviewCutoff.getHours() - SOCIAL_PROMO_REVIEW_HOURS);

  const pendingPromos = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.socialPromoStatus, "pending"));

  const readyForApproval = pendingPromos.filter((vp) => {
    return (
      vp.onboardingComplete &&
      vp.socialPromoSubmittedAt &&
      vp.socialPromoSubmittedAt.getTime() <= reviewCutoff.getTime() &&
      vp.socialPromoProofUrl.trim().length > 0
    );
  });

  const approved = [];
  for (const vp of readyForApproval) {
    const bonusTrialEndsAt = getBonusTrialEndDate(vp.trialEndsAt, now);
    const [updated] = await db
      .update(vendorProfilesTable)
      .set({
        subscriptionStatus: "trialing",
        isActive: true,
        socialPromoStatus: "approved",
        socialPromoApprovedAt: now,
        trialEndsAt: bonusTrialEndsAt,
        bonusTrialEndsAt,
      })
      .where(
        and(
          eq(vendorProfilesTable.id, vp.id),
          eq(vendorProfilesTable.socialPromoStatus, "pending"),
          eq(vendorProfilesTable.onboardingComplete, true),
        ),
      )
      .returning();

    if (updated) {
      const stripe = getStripe();
      if (stripe && updated.stripeSubscriptionId) {
        await stripe.subscriptions.update(updated.stripeSubscriptionId, {
          trial_end: Math.floor(bonusTrialEndsAt.getTime() / 1000),
        });
      }
      approved.push(updated);
    }
  }

  return approved;
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
    stripeCustomerId: vp.stripeCustomerId,
    stripeSubscriptionId: vp.stripeSubscriptionId,
  };
}
