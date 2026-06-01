import { Router, type Request, type Response, type IRouter } from "express";
import Stripe from "stripe";
import { db, usersTable, vendorProfilesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireVendorAuth, type AuthenticatedRequest } from "../lib/auth";
import { getAppUrl, getStripe, getStripePriceId } from "../lib/stripe";
import { VENDOR_FREE_TRIAL_DAYS } from "../lib/vendor-subscription";

const router: IRouter = Router();

function getSubscriptionStatus(subscription: Stripe.Subscription) {
  return subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trialing" : "inactive";
}

function getStripeId(value: string | { id?: string } | null) {
  return typeof value === "string" ? value : value?.id ?? "";
}

async function syncVendorFromSubscription(subscription: Stripe.Subscription, fallbackVendorProfileId?: number) {
  const vendorProfileId = Number(subscription.metadata?.vendorProfileId || fallbackVendorProfileId);
  const customerId = getStripeId(subscription.customer);
  const subscriptionStatus = getSubscriptionStatus(subscription);
  const trialStartedAt = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  const update = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus,
    isActive: subscriptionStatus !== "inactive",
    trialStartedAt,
    trialEndsAt,
  };

  if (vendorProfileId) {
    await db.update(vendorProfilesTable).set(update).where(eq(vendorProfilesTable.id, vendorProfileId));
    return;
  }

  await db.update(vendorProfilesTable).set(update).where(eq(vendorProfilesTable.stripeSubscriptionId, subscription.id));
}

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
    client_reference_id: String(vendorProfile.id),
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/vendor?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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
  }, {
    idempotencyKey: `vendor-checkout-${vendorProfile.id}-${priceId}`,
  });

  res.json({ url: session.url });
});

router.post("/subscription/reconcile", requireVendorAuth, async (req, res): Promise<void> => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ message: "Stripe is not connected yet." });
    return;
  }

  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  if (!sessionId.startsWith("cs_")) {
    res.status(400).json({ message: "Missing checkout session." });
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.status !== "complete") {
    res.status(400).json({ message: "Stripe Checkout is not complete yet." });
    return;
  }

  if (session.metadata?.userId !== String(authReq.user!.userId)) {
    res.status(403).json({ message: "This checkout session does not belong to your account." });
    return;
  }

  const subscription = session.subscription;
  if (!subscription || typeof subscription === "string") {
    res.status(400).json({ message: "Stripe did not return a subscription for this checkout." });
    return;
  }

  await syncVendorFromSubscription(subscription, Number(session.metadata?.vendorProfileId));
  res.json({ status: "synced" });
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
    if (vendorProfileId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncVendorFromSubscription(subscription, vendorProfileId);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const vendorProfileId = Number(subscription.metadata?.vendorProfileId);
    const subscriptionStatus = getSubscriptionStatus(subscription);
    const trialStartedAt = subscription.trial_start ? new Date(subscription.trial_start * 1000) : null;
    const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const customerId = getStripeId(subscription.customer);

    const subscriptionWhere = vendorProfileId
      ? or(eq(vendorProfilesTable.stripeSubscriptionId, subscription.id), eq(vendorProfilesTable.id, vendorProfileId))
      : eq(vendorProfilesTable.stripeSubscriptionId, subscription.id);

    await db
      .update(vendorProfilesTable)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus,
        isActive: subscriptionStatus !== "inactive",
        trialStartedAt,
        trialEndsAt,
      })
      .where(subscriptionWhere);
  }

  res.json({ received: true });
}

export default router;
