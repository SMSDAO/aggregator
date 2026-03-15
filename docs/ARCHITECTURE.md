# Architecture Overview

## System Design

The Meta DEX Aggregator is a Next.js 16 (App Router) application that aggregates swap quotes, flash loan options, and cross-chain routes from multiple DeFi protocols.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Home    │ │ Dashboard │ │  Admin   │ │  Developer   │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST
┌──────────────────────────▼──────────────────────────────────┐
│                  Next.js Edge Middleware                      │
│  Security headers · Rate limiting (60 req/min/IP)            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Next.js API Routes                          │
│  /api/quote  /api/swap  /api/flashloan  /api/register        │
│  /api/health /api/admin/stats /api/cross-chain-quote         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Core Libraries                           │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐  │
│  │aggregators│ │flashloan │ │platform   │ │   config /  │  │
│  │(1inch,0x, │ │(aave,uni,│ │  -fee     │ │   retry /   │  │
│  │paraswap)  │ │dydx,bal) │ │           │ │   types     │  │
│  └───────────┘ └──────────┘ └───────────┘ └─────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Storage Layer                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ PostgresRegistration│  │  InMemoryRegistrationStore   │  │
│  │ Store (Neon/Supabase│  │  (local dev, no DATABASE_URL)│  │
│  │ DATABASE_URL set)   │  │                              │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Environment-first configuration
All config is read at call time via `getConfig()` so Vercel dashboard changes take effect without redeployment.

### Dual storage backend
`registrationStore` automatically selects Postgres (when `DATABASE_URL` is set) or in-memory (local dev). No code changes required.

### Platform fee as BPS
The platform fee is configured in basis points (`PLATFORM_FEE_BPS`, default `10` = 0.1%) and calculated with BigInt arithmetic to avoid floating-point precision errors on large amounts.

### Retry with exponential backoff
All external API calls go through `fetchWithRetry` which retries on `429`, `500`, `502`, `503`, `504` with configurable exponential backoff.

### Edge middleware for security
Security headers and rate limiting are applied at the edge (before the application code runs) via `src/middleware.ts`.

## Module Map

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/components/NavBar.tsx` | Responsive tab navigation |
| `src/lib/aggregators/` | DEX quote aggregation (1inch, 0x, ParaSwap, Uniswap) |
| `src/lib/flashloan/` | Flash loan comparison (Aave, dYdX, Uniswap, Balancer) |
| `src/lib/config.ts` | Typed env-var reader + validation |
| `src/lib/platform-fee.ts` | BPS fee calculation |
| `src/lib/retry.ts` | Fetch with exponential backoff |
| `src/lib/store.ts` | Storage interface + backend selector |
| `src/lib/store-pg.ts` | Neon Postgres implementation |
| `src/lib/types.ts` | Shared TypeScript interfaces |
| `src/middleware.ts` | Edge security headers + rate limiting |
| `scripts/migrate.sql` | Database schema migration |
