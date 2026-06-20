import { Router, type IRouter } from "express";
import { db, hostRequestsTable } from "@workspace/db";
import { z } from "zod/v4";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const requestAttempts = new Map<string, number[]>();

const HostRequestBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().min(2).max(120),
  eventDate: z.string().trim().min(1).max(40),
  eventType: z.string().trim().min(2).max(80),
  cartType: z.string().trim().min(2).max(100),
  guestCount: z.coerce.number().int().min(1).max(100_000),
  budget: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(2_000).optional().default(""),
  website: z.string().max(0).optional().default(""),
  source: z.string().trim().max(100).optional().default("website"),
});

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1_000;
  const recentAttempts = (requestAttempts.get(ip) ?? []).filter((time) => time > windowStart);
  if (recentAttempts.length >= 5) {
    requestAttempts.set(ip, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  requestAttempts.set(ip, recentAttempts);
  return false;
}

async function sendNotification(request: typeof hostRequestsTable.$inferSelect) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HOST_REQUEST_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.HOST_REQUEST_FROM_EMAIL ?? "Vended <requests@tryvended.com>",
      to: [to],
      reply_to: request.email,
      subject: `New Vended request: ${request.cartType} in ${request.city}`,
      text: [
        `Name: ${request.name}`,
        `Email: ${request.email}`,
        `Phone: ${request.phone || "Not provided"}`,
        `City: ${request.city}`,
        `Date: ${request.eventDate}`,
        `Event: ${request.eventType}`,
        `Cart: ${request.cartType}`,
        `Guests: ${request.guestCount}`,
        `Budget: ${request.budget || "Not provided"}`,
        `Message: ${request.message || "None"}`,
        `Source: ${request.source}`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Notification provider returned ${response.status}`);
  }
}

router.post("/host-requests", async (req, res): Promise<void> => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ message: "Too many requests. Please try again later." });
    return;
  }

  const parsed = HostRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please check the event details and try again." });
    return;
  }

  if (parsed.data.website) {
    res.status(201).json({ message: "Request received." });
    return;
  }

  const { website: _website, ...requestData } = parsed.data;
  const [request] = await db
    .insert(hostRequestsTable)
    .values({
      ...requestData,
      status: "new",
    })
    .returning();

  void sendNotification(request).catch((error) => {
    logger.error(
      { err: error, hostRequestId: request.id },
      "Failed to send host-request notification",
    );
  });

  res.status(201).json({
    requestId: request.id,
    message: "Request received. Vended will start looking for matching carts.",
  });
});

export default router;
