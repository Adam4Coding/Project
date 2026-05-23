import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedVendorsTable = pgTable("saved_vendors", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedVendorSchema = createInsertSchema(savedVendorsTable).omit({ id: true, createdAt: true });
export type InsertSavedVendor = z.infer<typeof insertSavedVendorSchema>;
export type SavedVendor = typeof savedVendorsTable.$inferSelect;

