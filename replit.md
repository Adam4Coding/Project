# Vended — Vendor Marketplace

## Overview

Full-stack vendor marketplace where specialty cart vendors (matcha bars, mocktail carts, churro carts, espresso carts, crepe carts, lemonade carts, mini donut carts, elote carts) pay a monthly subscription to list their business, while customers browse and book them for free.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 (artifacts/cartly)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT in-memory (React Context only, never localStorage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (for api-server)

## Structure

```text
artifacts/
├── api-server/         # Express API server
├── cartly/             # React + Vite frontend (served at /)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas from OpenAPI
└── db/                 # Drizzle ORM schema + DB connection
scripts/
└── src/seed.ts         # Removes old seeded demo data
```

## Accounts

- Create customer accounts from the signup page
- **Vendor**: create a new vendor account from the signup page and start the free month from onboarding

## Pages

- `/` — Landing page with hero, categories, trending vendors
- `/explore` — Browse vendors with filters (category, city, price, rating)
- `/vendor/:id` — Vendor profile with booking modal and reviews
- `/login` — Login page
- `/signup` — Signup with role toggle (customer vs vendor)
- `/dashboard/customer` — Customer bookings and saved vendors
- `/dashboard/vendor` — Vendor stats, booking requests, profile editor
- `/onboarding` — 4-step vendor onboarding wizard

## API Routes

All routes are under `/api` prefix.

- `POST /api/auth/signup` — Create account (customer or vendor)
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `GET /api/vendors` — List vendors with filters
- `GET /api/vendors/trending` — Get top-rated vendors
- `GET /api/vendors/:id` — Get vendor by ID
- `GET /api/vendors/me` — Get authenticated vendor's profile
- `PUT /api/vendors/me` — Update vendor profile
- `POST /api/bookings` — Create booking (customer)
- `GET /api/bookings/mine` — Get customer's bookings
- `GET /api/bookings/requests` — Get vendor's incoming requests
- `PUT /api/bookings/:id/respond` — Accept or decline a booking
- `POST /api/reviews` — Leave a review
- `GET /api/reviews/vendor/:vendorId` — Get vendor reviews
- `GET /api/saved` — Get saved vendors
- `POST /api/saved/:vendorId` — Toggle save/unsave
- `POST /api/subscription/activate` — Start vendor free month before Stripe billing is connected
- `POST /api/subscription/social-promo` — Submit proof for one social promotion bonus month
- `GET /api/vendor-stats` — Vendor dashboard stats
- `POST /api/onboarding` — Complete vendor onboarding

## Database Schema

- `users` — id, email, password_hash, role, name, created_at
- `vendor_profiles` — id, user_id, cart_name, category, bio, city, cover_photo, gallery_photos (JSON), starting_price, packages (JSON), is_active, subscription_status, avg_rating, profile_views, onboarding_complete
- `bookings` — id, customer_id, vendor_id, event_date, event_type, guest_count, location, message, status, vendor_note
- `reviews` — id, booking_id, customer_id, vendor_id, rating, body
- `saved_vendors` — id, customer_id, vendor_id

## Seeded Demo Data

The app no longer creates fake public vendors. Startup and the seed script remove the old demo accounts and generated demo reviews/bookings if they exist.

## Design System

- **Fonts**: Fraunces (headings), Satoshi (body)
- **Primary**: Matcha green #2d6a4f
- **Secondary**: Terracotta #c1440e
- **Background**: Warm off-white #f9f6f1
- **Dark mode**: Deep charcoal #141410

## Running

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/cartly run dev

# Remove old seeded demo data
pnpm --filter @workspace/scripts run seed

# Run codegen after OpenAPI changes
pnpm --filter @workspace/api-spec run codegen
```
