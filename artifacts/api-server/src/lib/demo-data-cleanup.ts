import { bookingsTable, db, reviewsTable, savedVendorsTable, usersTable, vendorProfilesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

export const seededDemoVendorEmails = [
  "cart@demo.com",
  "matchabell@vendor.com",
  "mocktailmaven@vendor.com",
  "sobercraft@vendor.com",
  "churrotime@vendor.com",
  "goldenchurro@vendor.com",
  "dosepresso@vendor.com",
  "roamingbean@vendor.com",
  "creperie@vendor.com",
  "crepewave@vendor.com",
  "donutspin@vendor.com",
  "glaze@vendor.com",
];

export const seededDemoVendorNames = [
  "Matcha by Ren",
  "The Matcha Bell",
  "Mocktail Maven",
  "Sober Craft Bar",
  "Churro Time",
  "Golden Churro Co.",
  "The Dose Espresso",
  "Roaming Bean",
  "La Petite Crêperie",
  "Crêpe Wave",
  "Donut Spin",
  "Glaze Mini Donuts",
];

const seededDemoCustomerEmails = ["hello@demo.com"];

export async function removeSeededDemoData() {
  const demoUsers = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.email, [...seededDemoVendorEmails, ...seededDemoCustomerEmails]));

  if (demoUsers.length === 0) {
    return { removedUsers: 0, removedVendors: 0 };
  }

  const demoUserIds = demoUsers.map((user) => user.id);
  const demoVendorProfiles = await db
    .select()
    .from(vendorProfilesTable)
    .where(inArray(vendorProfilesTable.userId, demoUserIds));
  const demoVendorIds = demoVendorProfiles.map((vendor) => vendor.id);

  if (demoVendorIds.length > 0) {
    await db.delete(savedVendorsTable).where(inArray(savedVendorsTable.vendorId, demoVendorIds));
    await db.delete(reviewsTable).where(inArray(reviewsTable.vendorId, demoVendorIds));
    await db.delete(bookingsTable).where(inArray(bookingsTable.vendorId, demoVendorIds));
    await db.delete(vendorProfilesTable).where(inArray(vendorProfilesTable.id, demoVendorIds));
  }

  await db.delete(reviewsTable).where(inArray(reviewsTable.customerId, demoUserIds));
  for (const userId of demoUserIds) {
    await db.delete(bookingsTable).where(eq(bookingsTable.customerId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
  }

  return { removedUsers: demoUsers.length, removedVendors: demoVendorIds.length };
}
