import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hostRequestsTable = pgTable("host_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull(),
  eventDate: text("event_date").notNull(),
  eventType: text("event_type").notNull(),
  cartType: text("cart_type").notNull(),
  guestCount: integer("guest_count").notNull(),
  budget: text("budget").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  source: text("source").notNull().default("website"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHostRequestSchema = createInsertSchema(hostRequestsTable).omit({
  id: true,
  status: true,
  source: true,
  createdAt: true,
});

export type InsertHostRequest = z.infer<typeof insertHostRequestSchema>;
export type HostRequest = typeof hostRequestsTable.$inferSelect;
