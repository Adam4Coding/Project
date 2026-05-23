# Vended (Replit-Free Deployment)

This repository has been prepared to run on standard hosting providers (Render, Railway, Fly.io, VPS, etc.) without Replit-specific runtime requirements.

## Tech Stack

- Monorepo: pnpm workspaces
- Frontend: React + Vite (`artifacts/cartly`)
- API: Express (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)

## 1) Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required values:

- `DATABASE_URL`
- `SESSION_SECRET`
- `PORT` (defaults to `3000` if omitted)

Optional:

- `CORS_ORIGIN` (comma-separated origins)
- `STATIC_DIR` (override frontend dist location)
- `BASE_PATH` (frontend base path; defaults to `/`)

## 2) Install Dependencies

```bash
corepack enable
pnpm install --frozen-lockfile
```

## 3) Run Locally (API + Frontend)

Run each app in separate terminals:

```bash
# Terminal 1: API
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend
pnpm --filter @workspace/cartly run dev
```

## 4) Production Build + Start

This builds the frontend and API, then serves both from the API process:

```bash
pnpm run build:app
pnpm run start:app
```

Health endpoint:

```text
GET /api/health
```

Optional DB setup:

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

## 5) Docker Deployment

Build and run:

```bash
docker build -t vended-app .
docker run --env-file .env -p 3000:3000 vended-app
```

Or run app + Postgres together:

```bash
docker compose up --build
```

## 6) Custom Domain Setup

1. Deploy the app and get the provider URL/IP (for example: `my-app.onrender.com`).
2. In your domain registrar DNS panel:
   - Root domain (`@`): add `A`/`ALIAS`/`ANAME` record (provider-specific).
   - Subdomain (`www`): add `CNAME` to provider target.
3. In your hosting provider, add both domains (`example.com`, `www.example.com`).
4. Enable TLS/SSL certificate in provider dashboard.
5. Update `CORS_ORIGIN` to your final domain(s), for example:
   - `https://example.com,https://www.example.com`
6. Update `artifacts/cartly/public/robots.txt` sitemap URL to your real domain.

After DNS propagates, the app is fully detached from Replit.
