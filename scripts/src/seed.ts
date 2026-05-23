import { db } from "@workspace/db";
import {
  usersTable,
  vendorProfilesTable,
  bookingsTable,
  reviewsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const vendorData = [
  {
    email: "cart@demo.com",
    name: "Ren Tanaka",
    cartName: "Matcha by Ren",
    category: "Matcha",
    bio: "Ceremonial-grade matcha lattes and hojicha drinks, served from a sleek white cart with tatami vibes. We bring calm focus to every event — from corporate activations to intimate birthday parties.",
    city: "Chicago",
    startingPrice: 450,
    coverPhoto: "https://picsum.photos/seed/matcha-ren/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/matcha-ren-1/600/400",
      "https://picsum.photos/seed/matcha-ren-2/600/400",
      "https://picsum.photos/seed/matcha-ren-3/600/400",
    ],
    avgRating: 4.9,
    profileViews: 342,
    isDemo: true,
  },
  {
    email: "matchabell@vendor.com",
    name: "Isabella Chen",
    cartName: "The Matcha Bell",
    category: "Matcha",
    bio: "Specializing in vibrant ceremonial matcha with lavender, rose, and seasonal syrups. Our aesthetic-forward cart is a crowd magnet at pop-ups and weddings.",
    city: "Los Angeles",
    startingPrice: 520,
    coverPhoto: "https://picsum.photos/seed/matchabell/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/matchabell-1/600/400",
      "https://picsum.photos/seed/matchabell-2/600/400",
    ],
    avgRating: 4.7,
    profileViews: 214,
  },
  {
    email: "mocktailmaven@vendor.com",
    name: "Jordan Rivers",
    cartName: "Mocktail Maven",
    category: "Mocktails",
    bio: "Zero-proof cocktail experience with 12+ rotating menu items. We make non-alcoholic the life of the party — with house-made shrubs, bitters, and beautiful garnishes.",
    city: "New York",
    startingPrice: 580,
    coverPhoto: "https://picsum.photos/seed/mocktail-maven/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/mocktail-maven-1/600/400",
      "https://picsum.photos/seed/mocktail-maven-2/600/400",
    ],
    avgRating: 4.8,
    profileViews: 289,
  },
  {
    email: "sobercraft@vendor.com",
    name: "Mia Torres",
    cartName: "Sober Craft Bar",
    category: "Mocktails",
    bio: "Craft mocktails inspired by the world's finest cocktail bars, minus the hangover. Full bartending experience, fully alcohol-free.",
    city: "Austin",
    startingPrice: 500,
    coverPhoto: "https://picsum.photos/seed/sobercraft/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/sobercraft-1/600/400",
    ],
    avgRating: 4.6,
    profileViews: 178,
  },
  {
    email: "churrotime@vendor.com",
    name: "Carlos Reyes",
    cartName: "Churro Time",
    category: "Churros",
    bio: "Fresh-fried churros dusted in cinnamon sugar, served with gourmet dipping sauces. From birthday parties to corporate picnics, we bring the fiesta.",
    city: "Los Angeles",
    startingPrice: 350,
    coverPhoto: "https://picsum.photos/seed/churrotime/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/churrotime-1/600/400",
      "https://picsum.photos/seed/churrotime-2/600/400",
    ],
    avgRating: 4.9,
    profileViews: 412,
  },
  {
    email: "goldenchurro@vendor.com",
    name: "Ana Diaz",
    cartName: "Golden Churro Co.",
    category: "Churros",
    bio: "Artisan churros with Valrhona chocolate dipping sauce, dulce de leche, and seasonal fruit coulis. Elevated Mexican street food for elevated events.",
    city: "Miami",
    startingPrice: 420,
    coverPhoto: "https://picsum.photos/seed/goldenchurro/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/goldenchurro-1/600/400",
    ],
    avgRating: 4.7,
    profileViews: 201,
  },
  {
    email: "dosepresso@vendor.com",
    name: "Luke Hammond",
    cartName: "The Dose Espresso",
    category: "Espresso",
    bio: "Specialty espresso service with a La Marzocco machine on wheels. Ethically sourced single-origin beans, trained baristas, and beautiful latte art.",
    city: "Chicago",
    startingPrice: 600,
    coverPhoto: "https://picsum.photos/seed/dosepresso/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/dosepresso-1/600/400",
      "https://picsum.photos/seed/dosepresso-2/600/400",
    ],
    avgRating: 5.0,
    profileViews: 523,
  },
  {
    email: "roamingbean@vendor.com",
    name: "Priya Patel",
    cartName: "Roaming Bean",
    category: "Espresso",
    bio: "Mobile espresso bar bringing cafe-quality lattes, macchiatos, and cold brews to your venue. Fully branded station available for corporate events.",
    city: "New York",
    startingPrice: 650,
    coverPhoto: "https://picsum.photos/seed/roamingbean/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/roamingbean-1/600/400",
    ],
    avgRating: 4.8,
    profileViews: 367,
  },
  {
    email: "creperie@vendor.com",
    name: "Sophie Laurent",
    cartName: "La Petite Crêperie",
    category: "Crepes",
    bio: "Authentic French crêpes made to order — sweet and savory. Nutella-banana, lemon-sugar, smoked salmon, and goat cheese options. Très magnifique for weddings and brunch events.",
    city: "New York",
    startingPrice: 480,
    coverPhoto: "https://picsum.photos/seed/lapetitecreperie/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/creperie-1/600/400",
      "https://picsum.photos/seed/creperie-2/600/400",
    ],
    avgRating: 4.8,
    profileViews: 298,
  },
  {
    email: "crepewave@vendor.com",
    name: "Kenji Mori",
    cartName: "Crêpe Wave",
    category: "Crepes",
    bio: "Fusion crêpes blending Japanese and French traditions. Matcha cream, red bean, and classic Nutella in a stunning cart setup.",
    city: "Los Angeles",
    startingPrice: 460,
    coverPhoto: "https://picsum.photos/seed/crepewave/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/crepewave-1/600/400",
    ],
    avgRating: 4.6,
    profileViews: 183,
  },
  {
    email: "donutspin@vendor.com",
    name: "Tyler Nash",
    cartName: "Donut Spin",
    category: "Mini Donuts",
    bio: "Hot mini donuts fried fresh on-site. Watch them roll off the machine and get dusted in cinnamon sugar right in front of your guests. The crowd favorite at every event.",
    city: "Austin",
    startingPrice: 380,
    coverPhoto: "https://picsum.photos/seed/donutspin/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/donutspin-1/600/400",
      "https://picsum.photos/seed/donutspin-2/600/400",
    ],
    avgRating: 4.9,
    profileViews: 445,
  },
  {
    email: "glaze@vendor.com",
    name: "Emma Watkins",
    cartName: "Glaze Mini Donuts",
    category: "Mini Donuts",
    bio: "Gourmet mini donuts with 8+ glaze varieties: maple bacon, lavender honey, matcha white chocolate, and seasonal specials. Perfect for baby showers and weddings.",
    city: "Miami",
    startingPrice: 420,
    coverPhoto: "https://picsum.photos/seed/glazedonuts/800/500",
    galleryPhotos: [
      "https://picsum.photos/seed/glaze-1/600/400",
    ],
    avgRating: 4.7,
    profileViews: 256,
  },
];

const reviewBodies = [
  "Absolutely incredible! Our guests were obsessed and wouldn't stop talking about it.",
  "Professional, punctual, and the food was outstanding. Would book again in a heartbeat.",
  "The cart was a showstopper at our wedding. Everyone asked for the contact info.",
  "Exceeded all our expectations. The setup was beautiful and the product was even better.",
  "Best vendor decision we made for our corporate event. The team was a pleasure to work with.",
  "Our guests formed a line that never seemed to end — in the best way possible!",
  "Such a unique touch for our event. The quality was restaurant-level.",
  "Friendly staff, gorgeous presentation, and delicious food. Five stars without question.",
];

const reviewerNames = [
  "Sarah M.", "James K.", "Olivia R.", "Noah C.", "Ava L.",
  "Ethan B.", "Isabella T.", "Marcus W.", "Chloe D.", "Ryan O.",
];

async function seed() {
  console.log("Seeding database...");

  // Create demo customer
  const existingCustomer = await db.select().from(usersTable).where(eq(usersTable.email, "hello@demo.com")).limit(1);
  let customerId: number;
  if (existingCustomer.length === 0) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const [customer] = await db.insert(usersTable).values({
      email: "hello@demo.com",
      passwordHash,
      name: "Alex Demo",
      role: "customer",
    }).returning();
    customerId = customer.id;
    console.log("Created demo customer:", customer.email);
  } else {
    customerId = existingCustomer[0].id;
    console.log("Demo customer already exists");
  }

  // Create vendors
  const vendorIds: number[] = [];
  for (const data of vendorData) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, data.email)).limit(1);
    let vendorUserId: number;
    let vendorProfileId: number;

    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash("demo1234", 10);
      const [user] = await db.insert(usersTable).values({
        email: data.email,
        passwordHash,
        name: data.name,
        role: "vendor",
      }).returning();
      vendorUserId = user.id;

      const packages = [
        { name: "Basic", price: data.startingPrice, description: "2 hours, up to 50 guests, standard menu" },
        { name: "Full Package", price: data.startingPrice * 1.7, description: "4 hours, up to 150 guests, full menu + setup/teardown" },
        { name: "Custom", price: data.startingPrice * 2.5, description: "Full customization — contact for details" },
      ];

      const [vp] = await db.insert(vendorProfilesTable).values({
        userId: vendorUserId,
        cartName: data.cartName,
        category: data.category,
        bio: data.bio,
        city: data.city,
        coverPhoto: data.coverPhoto,
        galleryPhotos: JSON.stringify(data.galleryPhotos),
        startingPrice: data.startingPrice,
        packages: JSON.stringify(packages),
        isActive: true,
        subscriptionStatus: "active",
        avgRating: data.avgRating,
        profileViews: data.profileViews,
        onboardingComplete: true,
      }).returning();
      vendorProfileId = vp.id;
      console.log("Created vendor:", data.cartName);
    } else {
      vendorUserId = existing[0].id;
      const existingVP = await db.select().from(vendorProfilesTable).where(eq(vendorProfilesTable.userId, vendorUserId)).limit(1);
      if (existingVP.length > 0) {
        vendorProfileId = existingVP[0].id;
        console.log("Vendor already exists:", data.cartName);
      } else {
        continue;
      }
    }
    vendorIds.push(vendorProfileId);
  }

  // Seed reviews for each vendor
  for (const vendorId of vendorIds) {
    const existingReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.vendorId, vendorId));
    if (existingReviews.length > 0) continue;

    const numReviews = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numReviews; i++) {
      const rating = 4 + Math.random();
      const roundedRating = Math.round(rating * 2) / 2;

      // Create a fake booking to attach the review to
      const [booking] = await db.insert(bookingsTable).values({
        customerId,
        vendorId,
        eventDate: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        eventType: ["Birthday", "Corporate", "Wedding", "Baby Shower"][Math.floor(Math.random() * 4)],
        guestCount: 50 + Math.floor(Math.random() * 100),
        location: "Event Venue",
        message: "Looking forward to it!",
        status: "confirmed",
        vendorNote: "",
      }).returning();

      await db.insert(reviewsTable).values({
        bookingId: booking.id,
        customerId,
        vendorId,
        rating: roundedRating,
        body: reviewBodies[Math.floor(Math.random() * reviewBodies.length)],
      });
    }
    console.log(`Seeded reviews for vendor ${vendorId}`);
  }

  // Seed a pending booking for demo customer
  if (vendorIds.length > 0) {
    const existingBooking = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.customerId, customerId))
      .limit(1);

    if (existingBooking.length === 0) {
      await db.insert(bookingsTable).values({
        customerId,
        vendorId: vendorIds[0],
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        eventType: "Birthday",
        guestCount: 80,
        location: "The Green Room, Chicago",
        message: "Super excited to have you at our party!",
        status: "pending",
        vendorNote: "",
      });
      console.log("Seeded demo customer booking");
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

