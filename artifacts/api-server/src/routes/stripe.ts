import { Router, type Request, type Response, type IRouter } from "express";
import { db, usersTable, vendorProfilesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { requireVendorAuth, type AuthenticatedRequest } from "../lib/auth";
import { getAppUrl, getStripe, getStripePriceId } from "../lib/stripe";
import { getFreeTrialEndDate, VENDOR_FREE_TRIAL_DAYS } from "../lib/vendor-subscription";

const router: IRouter = Router();

router.post("/subscription/checkout", requireVendorAuth, async (req, res): Promise<void> => {
  const stripe = getStripe();
  const priceId = getStripePriceId();
  if (!stripe || !priceId) {
    res.status(503).json({ message: "Stripe is not connected yet. Add the Stripe secret key and Vended Pro price ID in Render." });
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const [vendorProfile] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!vendorProfile) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  if (vendorProfile.stripeSubscriptionId) {
    res.status(400).json({ message: "A Stripe subscription already exists for this vendor." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user!.userId)).limit(1);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/vendor?checkout=success`,
    cancel_url: `${appUrl}/dashboard/vendor?checkout=cancelled`,
    subscription_data: {
      trial_period_days: VENDOR_FREE_TRIAL_DAYS,
      metadata: {
        userId: String(user.id),
        vendorProfileId: String(vendorProfile.id),
      },
    },
    metadata: {
      userId: String(user.id),
      vendorProfileId: String(vendorProfile.id),
    },
  });

  res.json({ url: session.url });
});

router.post("/subscription/portal", requireVendorAuth, async (req, res): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ message: "Stripe is not connected yet." });
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const [vendorProfile] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!vendorProfile?.stripeCustomerId) {
    res.status(400).json({ message: "No Stripe customer exists yet." });
    return;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: vendorProfile.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/vendor`,
  });

  res.json({ url: session.url });
});

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    res.status(503).json({ message: "Stripe webhook is not configured." });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    res.status(400).json({ message: "Missing Stripe signature." });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : "Invalid Stripe webhook." });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const vendorProfileId = Number(session.metadata?.vendorProfileId);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (vendorProfileId && subscriptionId && customerId) {
      const now = new Date();
      await db
        .update(vendorProfilesTable)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: "trialing",
          isActive: true,
          trialStartedAt: now,
          trialEndsAt: getFreeTrialEndDate(now),
        })
        .where(eq(vendorProfilesTable.id, vendorProfileId));
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const subscriptionStatus =
      subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trialing" : "inactive";
    const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

    await db
      .update(vendorProfilesTable)
      .set({
        subscriptionStatus,
        isActive: subscriptionStatus !== "inactive",
        trialEndsAt,
      })
      .where(eq(vendorProfilesTable.stripeSubscriptionId, subscription.id));
  }

  res.json({ received: true });
}

export default router;
