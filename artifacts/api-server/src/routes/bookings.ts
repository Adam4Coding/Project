import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookingsTable, vendorProfilesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireVendorAuth, requireCustomerAuth, type AuthenticatedRequest } from "../lib/auth";
import { CreateBookingBody, RespondToBookingBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [vendor] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.id, booking.vendorId))
    .limit(1);

  const [customer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, booking.customerId))
    .limit(1);

  const { reviewsTable } = await import("@workspace/db");
  const existingReview = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.bookingId, booking.id))
    .limit(1);

  return {
    id: booking.id,
    customerId: booking.customerId,
    vendorId: booking.vendorId,
    eventDate: booking.eventDate,
    eventType: booking.eventType,
    guestCount: booking.guestCount,
    location: booking.location,
    message: booking.message,
    status: booking.status,
    vendorNote: booking.vendorNote,
    createdAt: booking.createdAt.toISOString(),
    customerName: customer?.name ?? "Unknown",
    vendorCartName: vendor?.cartName ?? "Unknown",
    hasReview: existingReview.length > 0,
  };
}

router.post("/bookings", requireCustomerAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { vendorId, eventDate, eventType, guestCount, location, message } = parsed.data;

  const [vendor] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.id, vendorId))
    .limit(1);

  if (!vendor || !vendor.isActive) {
    res.status(404).json({ message: "Vendor not found or not available" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      customerId: authReq.user!.userId,
      vendorId,
      eventDate,
      eventType,
      guestCount,
      location,
      message: message ?? "",
      status: "pending",
      vendorNote: "",
    })
    .returning();

  res.status(201).json({ booking: await enrichBooking(booking) });
});

router.get("/bookings/mine", requireCustomerAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.customerId, authReq.user!.userId))
    .orderBy(bookingsTable.createdAt);

  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json({ bookings: enriched.reverse() });
});

router.get("/bookings/requests", requireVendorAuth, async (req, res): Promise<void> => {
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

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.vendorId, vp.id))
    .orderBy(bookingsTable.createdAt);

  const enriched = await Promise.all(bookings.map(enrichBooking));
  res.json({ bookings: enriched.reverse() });
});

router.put("/bookings/:id/respond", requireVendorAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid booking id" });
    return;
  }

  const parsed = RespondToBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { status, vendorNote } = parsed.data;

  const [vp] = await db
    .select()
    .from(vendorProfilesTable)
    .where(eq(vendorProfilesTable.userId, authReq.user!.userId))
    .limit(1);

  if (!vp) {
    res.status(404).json({ message: "Vendor profile not found" });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status, vendorNote: vendorNote ?? "" })
    .where(and(eq(bookingsTable.id, id), eq(bookingsTable.vendorId, vp.id)))
    .returning();

  if (!booking) {
    res.status(404).json({ message: "Booking not found" });
    return;
  }

  res.json({ booking: await enrichBooking(booking) });
});

export default router;

