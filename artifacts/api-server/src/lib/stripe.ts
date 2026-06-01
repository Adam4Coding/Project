import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia",
  });

  return stripeClient;
}

export function getStripePriceId() {
  return process.env.STRIPE_VENDOR_PRO_PRICE_ID || process.env.STRIPE_PRICE_ID || "";
}

export function getAppUrl() {
  return (process.env.APP_URL || process.env.PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
