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
- `RESEND_API_KEY` (send an email when a host requests cart matching)
- `HOST_REQUEST_NOTIFICATION_EMAIL` (destination for new host requests)
- `HOST_REQUEST_FROM_EMAIL` (verified sender for host-request notifications)

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
pnpm --filter @workspace/db run push
pnpm run start:app
```

Health endpoint:

```text
GET /api/healthz
```

Optional DB setup:

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
```

Run the database push after pulling changes that add the `host_requests` table.

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

## 7) Render (Simplest Deployment Path)

This repo includes `render.yaml` so Render can create the web service from one Blueprint. Use an external Postgres database URL for `DATABASE_URL`.

### Free preview URL flow (no domain purchase required)

1. Push this branch to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect this GitHub repo and select the branch you want to deploy.
4. Render reads `render.yaml` and prepares the `vended-web` web service.
5. Provide the required env vars marked `sync: false`:
   - `DATABASE_URL=postgres://...`
   - `CORS_ORIGIN=https://<your-service-name>.onrender.com`
6. Click **Apply**.

Render generates `SESSION_SECRET` automatically.

After deploy succeeds, Render provides a free generated URL:

```text
https://<your-service-name>.onrender.com
```

### Required manual step you must complete

Only you can complete the Render account/deploy confirmation:

- In the Render Blueprint screen, review any free-tier limits or paid-plan prompts.
- Click **Apply** only if Render shows the resources and plan you want.
- After the first deploy, update `CORS_ORIGIN` if the generated Render URL differs from the placeholder you entered.
