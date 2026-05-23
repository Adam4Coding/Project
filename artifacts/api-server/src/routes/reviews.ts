import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviewsTable, bookingsTable, vendorProfilesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCustomerAuth, type AuthenticatedRequest } from "../lib/auth";
import { CreateReviewBody, GetVendorReviewsParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function updateVendorRating(vendorId: number) {
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.vendorId, vendorId));

  if (reviews.length === 0) return;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await db
    .update(vendorProfilesTable)
    .set({ avgRating: Math.round(avg * 10) / 10 })
    .where(eq(vendorProfilesTable.id, vendorId));
}

router.post("/reviews", requireCustomerAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { bookingId, rating, body } = parsed.data;

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(and(
      eq(bookingsTable.id, bookingId),
      eq(bookingsTable.customerId, authReq.user!.userId),
      eq(bookingsTable.status, "confirmed"),
    ))
    .limit(1);

  if (!booking) {
    res.status(400).json({ message: "No confirmed booking found" });
    return;
  }

  const existing = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.bookingId, bookingId))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ message: "Review already submitted for this booking" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      bookingId,
      customerId: authReq.user!.userId,
      vendorId: booking.vendorId,
      rating,
      body: body ?? "",
    })
    .returning();

  await updateVendorRating(booking.vendorId);

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user!.userId)).limit(1);

  res.status(201).json({
    review: {
      id: review.id,
      bookingId: review.bookingId,
      customerId: review.customerId,
      vendorId: review.vendorId,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      customerName: customer?.name ?? "Unknown",
    },
  });
});

router.get("/reviews/vendor/:vendorId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const vendorId = parseInt(raw, 10);
  if (isNaN(vendorId)) {
    res.status(400).json({ message: "Invalid vendor id" });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.vendorId, vendorId))
    .orderBy(reviewsTable.createdAt);

  const enriched = await Promise.all(
    reviews.map(async (r) => {
      const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, r.customerId)).limit(1);
      return {
        id: r.id,
        bookingId: r.bookingId,
        customerId: r.customerId,
        vendorId: r.vendorId,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        customerName: customer?.name ?? "Anonymous",
      };
    })
  );

  res.json({ reviews: enriched.reverse() });
});

export default router;

