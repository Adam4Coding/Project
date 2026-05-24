import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vendorProfilesTable = pgTable("vendor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cartName: text("cart_name").notNull(),
  category: text("category").notNull().default(""),
  bio: text("bio").notNull().default(""),
  city: text("city").notNull().default(""),
  coverPhoto: text("cover_photo").notNull().default(""),
  galleryPhotos: text("gallery_photos").notNull().default("[]"),
  startingPrice: real("starting_price").notNull().default(0),
  packages: text("packages").notNull().default("[]"),
  isActive: boolean("is_active").notNull().default(false),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  avgRating: real("avg_rating").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVendorProfileSchema = createInsertSchema(vendorProfilesTable).omit({ id: true, createdAt: true });
export type InsertVendorProfile = z.infer<typeof insertVendorProfileSchema>;
export type VendorProfile = typeof vendorProfilesTable.$inferSelect;
