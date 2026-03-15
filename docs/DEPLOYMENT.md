# Deployment Guide

## Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)
- A PostgreSQL database (Neon or Supabase recommended)

---

## Vercel Deployment (Recommended)

### 1. Fork / Clone the Repository

```bash
git clone https://github.com/SMSDAO/aggregator.git
cd aggregator
```

### 2. Connect to Vercel

```bash
npx vercel
```

Follow the prompts to link to your Vercel account and project.

### 3. Provision a Database

**Option A — Neon (recommended)**

1. Go to the Vercel Marketplace and add the **Neon Postgres** integration.
2. Vercel automatically injects `DATABASE_URL` into your project.
3. Run the migration once:
   ```bash
   npx vercel env pull .env.local
   psql $DATABASE_URL -f scripts/migrate.sql
   ```

**Option B — Supabase**

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the connection string from **Project → Settings → Database → URI**.
3. Add it as `DATABASE_URL` in your Vercel project environment variables.
4. Run the migration: `psql $DATABASE_URL -f scripts/migrate.sql`

### 4. Set Environment Variables in Vercel

Go to your project's **Settings → Environment Variables** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (production) | Postgres connection string |
| `ADMIN_TOKEN` | Yes | Bearer token for the admin dashboard |
| `PLATFORM_FEE_BPS` | No | Fee in basis points (default: 10) |
| `PLATFORM_FEE_RECIPIENT` | No | EVM address to receive platform fees |
| `ONEINCH_API_KEY` | No | Required for 1inch quotes |
| `ZEROX_API_KEY` | No | Required for 0x quotes |

See [ENVIRONMENT.md](./ENVIRONMENT.md) for full details.

### 5. Deploy

```bash
npx vercel --prod
```

---

## Self-Hosted Deployment

### 1. Install Dependencies

```bash
npm ci
```

### 2. Create `.env.local`

```bash
cp .env.example .env.local
# Fill in the values
```

### 3. Run the Database Migration

```bash
psql $DATABASE_URL -f scripts/migrate.sql
```

### 4. Build

```bash
npm run build
```

### 5. Start

```bash
npm start
```

The app listens on port `3000` by default. Use a reverse proxy (nginx, Caddy) with TLS in production.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If `DATABASE_URL` is not set the app automatically falls back to an in-memory store. Data is lost on restart and is not shared across serverless function instances.

---

## Health Check

```bash
curl http://localhost:3000/api/health
```

Returns `200 OK` with a JSON body listing configuration warnings.

---

## Reproducible Builds

The project uses `package-lock.json` for deterministic installs. Always use `npm ci` (not `npm install`) in CI/CD and Docker to guarantee reproducibility.
