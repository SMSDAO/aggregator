# Architecture Audit Report — SMSDAO/aggregator

> **Generated:** 2026-03-06  
> **Auditor:** Copilot Coding Agent  
> **Repository:** [SMSDAO/aggregator](https://github.com/SMSDAO/aggregator)  
> **Purpose of audit:** Assess the current DeFi DEX aggregator codebase and identify the work required to transform it into an AI/Web3 content-feed aggregator platform.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Existing File Structure](#2-existing-file-structure)
3. [Current Module Inventory](#3-current-module-inventory)
4. [Missing Modules for AI/Web3 Feed Aggregator](#4-missing-modules-for-aiweb3-feed-aggregator)
5. [Broken Imports & Dependency Gaps](#5-broken-imports--dependency-gaps)
6. [Potential Build Failures](#6-potential-build-failures)
7. [Dependency Issues](#7-dependency-issues)
8. [Deployment Blockers](#8-deployment-blockers)
9. [What to Remove or Repurpose](#9-what-to-remove-or-repurpose)
10. [Recommended Target Architecture](#10-recommended-target-architecture)
11. [Migration Roadmap](#11-migration-roadmap)

---

## 1. Executive Summary

The repository is a **production-ready DeFi DEX aggregator** built on Next.js 16 (App Router) and TypeScript. It aggregates swap quotes from 1inch, 0x, and ParaSwap, handles cross-chain bridge routing, and provides flash-loan comparisons — all behind a developer-registration API-key layer backed by Neon/Supabase PostgreSQL.

The stated new purpose is an **AI/Web3 content-feed aggregator**: a platform that ingests signals from GitHub, RSS feeds, Web3 on-chain events, and social networks; processes them through AI ranking/summarisation; and exposes a unified, personalised feed to consumers.

**The two purposes share very little overlap.** The core DeFi swap logic (aggregators, flash loans, cross-chain routing, platform-fee math) is not reusable for content aggregation and should be retired or archived. What *can* be retained is:

- The Next.js application shell and routing infrastructure  
- The API-key / developer-registration system  
- The retry utility  
- The PostgreSQL storage layer (schema must be extended)  
- The `getConfig()` / `validateConfig()` environment-config helpers  
- The `fetchWithRetry` HTTP wrapper  

**Risk level of the transformation: HIGH.** All DeFi-specific business logic must be replaced; seven new functional modules are needed from scratch; and several production dependencies (`openai`, `redis`, `viem`/`ethers`, a social SDK, an RSS parser, an Octokit GitHub client) are entirely absent from `package.json`.

---

## 2. Existing File Structure

```
aggregator/
├── .env.example                          # Environment variable template
├── .eslintrc.json                        # ESLint: next/core-web-vitals + TS
├── .gitignore
├── LICENSE                               # MIT
├── README.md
├── next.config.mjs                       # Empty Next.js config (defaults only)
├── package.json                          # 4 runtime deps, 8 dev deps
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json                         # strict, paths: @/* → ./src/*
├── vercel.json                           # Vercel deployment config
├── scripts/
│   └── migrate.sql                       # api_keys table DDL
└── src/
    ├── app/
    │   ├── layout.tsx                    # Root layout + NavBar
    │   ├── page.tsx                      # Landing page (DeFi)
    │   ├── admin/page.tsx                # Admin dashboard (demo data)
    │   ├── docs/page.tsx                 # API docs (DeFi-specific)
    │   ├── register/page.tsx             # Developer registration
    │   └── api/
    │       ├── health/route.ts           # Health + config check
    │       ├── quote/route.ts            # Best swap quote
    │       ├── swap/route.ts             # Unsigned swap transaction
    │       ├── flashloan/route.ts        # Flash loan comparison
    │       ├── register/route.ts         # API key issuance
    │       ├── cross-chain-quote/route.ts# Cross-chain routing
    │       └── admin/stats/route.ts      # Admin stats (hardcoded)
    ├── components/
    │   └── NavBar.tsx                    # Responsive navigation
    └── lib/
        ├── index.ts                      # Barrel export
        ├── types.ts                      # All TypeScript interfaces
        ├── config.ts                     # Env-var reading, validation
        ├── retry.ts                      # fetchWithRetry with backoff
        ├── platform-fee.ts               # BPS fee calculation
        ├── store.ts                      # In-memory + factory
        ├── store-pg.ts                   # Neon/Supabase PostgreSQL store
        └── aggregators/
            ├── index.ts                  # Quote fan-out (1inch, 0x, ParaSwap, Uniswap stub)
            └── cross-chain.ts            # Bridge stubs (Li.Fi, Socket, Squid)
        └── flashloan/
            └── index.ts                  # Flash loan provider comparison
```

**Total source files (pre-audit):** 23  
**Test files (pre-audit):** 0 (no test framework configured)  
**Documentation files (pre-audit):** 1 (README.md); no `docs/` directory existed prior to this report

---

## 3. Current Module Inventory

| Module | File(s) | Status | Keep / Replace |
|--------|---------|--------|----------------|
| Next.js app shell | `src/app/layout.tsx`, `next.config.mjs` | ✅ Working | **Keep** |
| Navigation | `src/components/NavBar.tsx` | ✅ Working | **Repurpose** |
| Landing page | `src/app/page.tsx` | ✅ Working (DeFi content) | **Replace** |
| Docs page | `src/app/docs/page.tsx` | ✅ Working (DeFi docs) | **Replace** |
| Admin page | `src/app/admin/page.tsx` | ⚠️ Hardcoded demo data | **Repurpose** |
| Register page | `src/app/register/page.tsx` | ✅ Working | **Keep** |
| Health endpoint | `src/app/api/health/route.ts` | ✅ Working | **Keep / Extend** |
| Quote endpoint | `src/app/api/quote/route.ts` | ✅ Working (DeFi) | **Remove** |
| Swap endpoint | `src/app/api/swap/route.ts` | ⚠️ Stub calldata (0x) | **Remove** |
| Flash loan endpoint | `src/app/api/flashloan/route.ts` | ✅ Working (DeFi) | **Remove** |
| Cross-chain endpoint | `src/app/api/cross-chain-quote/route.ts` | ⚠️ All stubs, simulated | **Remove** |
| Register endpoint | `src/app/api/register/route.ts` | ✅ Working | **Keep** |
| Admin stats endpoint | `src/app/api/admin/stats/route.ts` | ⚠️ Hardcoded demo | **Repurpose** |
| Config helpers | `src/lib/config.ts` | ✅ Working | **Keep / Extend** |
| Retry utility | `src/lib/retry.ts` | ✅ Working | **Keep** |
| Platform fee math | `src/lib/platform-fee.ts` | ✅ Working (DeFi) | **Remove** |
| TypeScript types | `src/lib/types.ts` | ✅ Working (DeFi types) | **Replace** |
| In-memory store | `src/lib/store.ts` | ✅ Working | **Keep / Extend** |
| PostgreSQL store | `src/lib/store-pg.ts` | ✅ Working | **Keep / Extend** |
| Library barrel | `src/lib/index.ts` | ✅ Working | **Rewrite exports** |
| DEX aggregators | `src/lib/aggregators/index.ts` | ✅ Working (DeFi) | **Remove** |
| Cross-chain bridges | `src/lib/aggregators/cross-chain.ts` | ⚠️ Stubs only | **Remove** |
| Flash loan lib | `src/lib/flashloan/index.ts` | ✅ Working (DeFi) | **Remove** |
| DB migration | `scripts/migrate.sql` | ✅ Working | **Extend** |

---

## 4. Missing Modules for AI/Web3 Feed Aggregator

The following functional modules are **entirely absent** from the codebase and must be created from scratch.

### 4.1 AI Processing Module

**Purpose:** Summarise ingested content, extract entities, classify topics, rank relevance, and generate embeddings for semantic search.

**Missing files:**
```
src/lib/ai/
├── client.ts          # OpenAI / LLM client initialisation
├── summarise.ts       # Text summarisation pipeline
├── classify.ts        # Topic / sentiment classification
├── embed.ts           # Vector embedding generation
└── rank.ts            # Relevance scoring using AI signals
```

**Missing dependencies:**
- `openai` — OpenAI SDK (GPT-4o, embeddings)  
- `@ai-sdk/openai` or `ai` (Vercel AI SDK) — streaming support  
- PostgreSQL database extension `pgvector` — enable vector similarity search in PostgreSQL

**Missing environment variables:**
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_EMBED_MODEL` (default: `text-embedding-3-small`)

---

### 4.2 GitHub Connector

**Purpose:** Ingest repository events (stars, forks, issues, PRs, releases, discussions) and developer activity signals from the GitHub REST/GraphQL API.

**Missing files:**
```
src/lib/connectors/github/
├── client.ts          # Octokit REST + GraphQL client
├── feed.ts            # Fetch trending repos, events, notifications
└── types.ts           # GitHub-specific response types
```

**Missing dependencies:**
- `@octokit/rest` — GitHub REST API client  
- `@octokit/graphql` — GitHub GraphQL client  

**Missing environment variables:**
- `GITHUB_TOKEN` — Personal access token or GitHub App token  
- `GITHUB_APP_ID` (optional, for GitHub App auth)  
- `GITHUB_APP_PRIVATE_KEY` (optional)

---

### 4.3 RSS / Atom Feed Connector

**Purpose:** Consume standard RSS 2.0 and Atom 1.0 feeds from developer blogs, news sites, protocol announcements, and podcast feeds.

**Missing files:**
```
src/lib/connectors/rss/
├── parser.ts          # RSS/Atom fetch + parse
├── normalise.ts       # Map feed items to canonical FeedItem type
└── sources.ts         # Curated list of default feed sources
```

**Missing dependencies:**
- `rss-parser` — RSS/Atom parser  
- or `fast-xml-parser` — lightweight XML parser alternative

---

### 4.4 Web3 On-Chain Connector

**Purpose:** Monitor smart contract events, decode on-chain transactions, read protocol state (TVL, prices, governance proposals), and integrate ENS/IPFS resolution.

**Missing files:**
```
src/lib/connectors/web3/
├── client.ts          # viem public client factory per chain
├── events.ts          # Event log subscription and decoding
├── ens.ts             # ENS name resolution
├── ipfs.ts            # IPFS/IPNS content fetching
└── types.ts           # On-chain event types
```

**Missing dependencies:**
- `viem` — Type-safe Ethereum client (preferred over `ethers` for new code)  
- or `ethers` v6 — Alternative Ethereum library  

**Missing environment variables:**
- `ETH_RPC_URL` — Ethereum mainnet RPC (Alchemy, Infura, etc.)  
- `BASE_RPC_URL` — Base chain RPC  
- `ARB_RPC_URL` — Arbitrum RPC  
- `POLYGON_RPC_URL` — Polygon RPC  
- `ALCHEMY_API_KEY` or `INFURA_API_KEY`

---

### 4.5 Social Media Connectors

**Purpose:** Ingest posts, casts, and profiles from Web3-native social networks (Farcaster, Lens) and optionally Twitter/X.

**Missing files:**
```
src/lib/connectors/social/
├── farcaster.ts       # Farcaster Hub API / Neynar client
├── lens.ts            # Lens Protocol GraphQL API
├── twitter.ts         # Twitter/X API v2 (optional)
└── types.ts           # Normalised social post type
```

**Missing dependencies:**
- `@neynar/nodejs-sdk` — Farcaster (via Neynar)  
- `@lens-protocol/client` — Lens Protocol  
- `twitter-api-v2` — Twitter/X API v2 (if required)

**Missing environment variables:**
- `NEYNAR_API_KEY` — Farcaster API access  
- `LENS_API_URL` — Lens API endpoint  
- `TWITTER_BEARER_TOKEN` (optional)

---

### 4.6 Ranking Engine

**Purpose:** Score and order feed items using a combination of recency, engagement signals, AI-derived relevance, source authority, and user preferences.

**Missing files:**
```
src/lib/ranking/
├── score.ts           # Multi-factor scoring algorithm
├── weights.ts         # Configurable weight constants
└── personalise.ts     # Per-user preference adjustments
```

No external dependencies strictly required (pure TypeScript), but may integrate with the AI module for semantic similarity scoring.

---

### 4.7 Caching Layer (Redis)

**Purpose:** Cache feed items, AI responses, and aggregated feeds to reduce latency and API costs. Implement rate-limit counters and session state.

**Missing files:**
```
src/lib/cache/
├── client.ts          # Redis client (ioredis)
├── feed-cache.ts      # Feed item TTL caching
└── rate-limit.ts      # Sliding-window rate limiter using Redis
```

**Missing dependencies:**
- `ioredis` — Redis client with TypeScript support  
- or `@upstash/redis` — Serverless Redis (recommended for Vercel)

**Missing environment variables:**
- `REDIS_URL` — Redis connection string  
- `UPSTASH_REDIS_REST_URL` (if using Upstash)  
- `UPSTASH_REDIS_REST_TOKEN` (if using Upstash)

---

### 4.8 Feed Aggregation Core

**Purpose:** Unified pipeline that orchestrates all connectors, deduplicates items, applies the ranking engine, and exposes a paginated, filterable feed API.

**Missing files:**
```
src/lib/feed/
├── types.ts           # Canonical FeedItem, FeedSource, FeedQuery types
├── aggregate.ts       # Fan-out to all connectors in parallel
├── dedup.ts           # Content-hash deduplication
├── pipeline.ts        # Ingest → normalise → rank → cache pipeline
└── index.ts           # Barrel export
```

**Missing API endpoints:**
```
src/app/api/
├── feed/route.ts           # GET /api/feed  — paginated unified feed
├── feed/[source]/route.ts  # GET /api/feed/github|rss|web3|social
├── sources/route.ts        # GET/POST /api/sources — manage feed sources
└── search/route.ts         # GET /api/search — semantic search via embeddings
```

---

## 5. Broken Imports & Dependency Gaps

### 5.1 Stub Implementations That Will Silently Fail

| Location | Issue |
|----------|-------|
| `src/lib/aggregators/index.ts` — `getUniswapQuote()` | Throws `Error("Uniswap integration is not yet implemented")` at runtime; when invoked via `getQuotes()` the call is wrapped in `Promise.allSettled`, rejected results are filtered out, and the original Uniswap diagnostic is not propagated, typically surfacing only as the generic “No quotes available…” message |
| `src/lib/aggregators/cross-chain.ts` — `getLifiQuote()`, `getSocketQuote()`, `getSquidQuote()` | Return **hardcoded simulated data** (not real API calls); no user-visible error |
| `src/app/api/swap/route.ts` | Returns `data: "0x"` (empty calldata); any attempt to broadcast this transaction will fail on-chain |
| `src/app/api/admin/stats/route.ts` | Returns completely hardcoded statistics; `_demo: true` flag is present but not exposed to the UI |

### 5.2 Missing Runtime Dependencies

The following packages are **imported or required by the proposed AI/Web3 modules** but are absent from `package.json`:

| Package | Purpose | Required by |
|---------|---------|-------------|
| `openai` | AI completions & embeddings | AI processing module |
| `@ai-sdk/openai` | Vercel AI SDK streaming | AI processing module |
| `ioredis` / `@upstash/redis` | Cache layer | Caching module |
| `viem` | Ethereum client | Web3 connector |
| `@octokit/rest` | GitHub API | GitHub connector |
| `rss-parser` | RSS/Atom feed parsing | RSS connector |
| `@neynar/nodejs-sdk` | Farcaster API | Social connector |
| `@lens-protocol/client` | Lens Protocol | Social connector |
| `twitter-api-v2` | Twitter/X API | Social connector (optional) |

### 5.3 Peer-Dependency Warning

In this repository, `package-lock.json` shows `eslint-config-next@16.1.6` declaring a peer dependency of `eslint: >=9.0.0`, which is compatible with the configured `eslint@9.39.3`. There is therefore **no inherent peer-dependency mismatch** between these two packages in the current setup.

ESLint 9 introduced the flat config system, and some combinations of Next.js / `eslint-config-next` / project config can still surface configuration or runtime issues when running `npm run lint` or `npm run build`. If you observe ESLint-related errors (e.g., config parsing failures, missing config, or plugin resolution issues), consider:

- Aligning `eslint` and `eslint-config-next` with the version matrix recommended by your Next.js version, **or**  
- Adopting a flat config (`eslint.config.mjs`) and migrating away from `.eslintrc.*` where appropriate, **or**  
- Adjusting or replacing third-party ESLint presets/plugins that are not compatible with ESLint 9.

---

## 6. Potential Build Failures

### 6.1 ESLint / Lint-on-Build

Next.js runs ESLint during `npm run build` by default. The current `eslint@9.39.3` and `eslint-config-next@16.1.6` are **version-compatible** (`eslint-config-next` peers on `eslint: >=9.0.0`), so there is no inherent peer-dependency mismatch in this repository.

However, ESLint 9 introduced a flat config system, and mixing the legacy `.eslintrc.json` style with new plugins or configs added during the AI/Web3 migration could surface configuration errors. Run the linter before and after each migration phase to catch issues early:

```bash
npm run lint
# Observe and record any ESLint configuration, plugin, or peer-dependency errors.
```

If ESLint errors appear after adding new packages, consider adopting a flat config (`eslint.config.mjs`) and removing `.eslintrc.json`.

### 6.2 TypeScript Strict-Mode Type Errors When Adding New Modules

`tsconfig.json` enables `"strict": true`. Any new AI/Web3 module that:
- uses untyped third-party SDKs without `@types/*` packages  
- returns `any` from `fetch()` without narrowing  
- passes `null` where `string` is expected  

…will cause `tsc` errors and break `next build`.

**Affected risk areas:**
- `openai` SDK response shapes (use `openai` v4+ which ships its own types)  
- `rss-parser` (ships `@types` internally)  
- `viem` (ships its own types)  
- `@octokit/rest` (ships its own types)

### 6.3 Server-Only Dependencies in Client Components

All interactive pages use `"use client"` directives. If any new AI/Web3 connector module is accidentally imported into a client component, Next.js will attempt to bundle Node.js-only packages (`ioredis`, `@octokit/rest`, `viem` node transport) for the browser and the build will fail with:

```
Error: The edge runtime does not support Node.js 'net' module
```

**Prevention:** Keep all connector and cache code under `src/lib/` (server-only) and never import it directly from `"use client"` components. Use Next.js Server Actions or API routes as the boundary.

### 6.4 Missing `flashloan/` Directory Type Export

`src/lib/index.ts` exports `getFlashLoanQuotes` and `FLASH_LOAN_PROVIDERS` from `./flashloan`. If the `flashloan/` directory is deleted during cleanup without updating `src/lib/index.ts`, the barrel export will break and all downstream imports of `@/lib` will fail at build time.

---

## 7. Dependency Issues

### 7.1 Current `package.json` — Runtime Dependencies

```json
"dependencies": {
  "@neondatabase/serverless": "^1.0.2",
  "next": "16.1.6",
  "react": "^18",
  "react-dom": "^18"
}
```

**Issues:**
- `next@16.1.6` — Pinned to an exact minor version. Consider using `^16.1.6` or `~16.1.6` to receive patch-level security fixes automatically.
- No AI, caching, Web3, or social dependencies are present.

### 7.2 Missing Production Dependencies to Add

```jsonc
// AI
"openai": "^4.x",
"ai": "^3.x",                       // Vercel AI SDK (optional)

// Caching
"@upstash/redis": "^1.x",           // or "ioredis": "^5.x" for self-hosted

// Web3
"viem": "^2.x",

// GitHub
"@octokit/rest": "^21.x",
"@octokit/graphql": "^8.x",

// RSS
"rss-parser": "^3.x",

// Social (Farcaster)
"@neynar/nodejs-sdk": "^1.x",

// Social (Lens)
"@lens-protocol/client": "^2.x"
```

### 7.3 Missing Dev Dependencies to Add

```jsonc
// Testing
"jest": "^29.x",
"@types/jest": "^29.x",
"jest-environment-jsdom": "^29.x",
"@testing-library/react": "^16.x",
"@testing-library/jest-dom": "^6.x",
"ts-jest": "^29.x",

// ESLint (ensure version stays peer-compatible with eslint-config-next; current eslint@9.39.3 is acceptable)
```

### 7.4 Database Schema Gaps

The current schema (`scripts/migrate.sql`) only contains the `api_keys` table. The AI/Web3 aggregator requires additional tables:

```sql
-- Feed items (ingested content)
CREATE TABLE feed_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,          -- 'github' | 'rss' | 'web3' | 'social'
  external_id TEXT NOT NULL,
  title       TEXT,
  body        TEXT,
  url         TEXT,
  author      TEXT,
  published_at TIMESTAMPTZ,
  ingested_at  TIMESTAMPTZ DEFAULT now(),
  score       FLOAT,
  embedding   VECTOR(1536),           -- requires pgvector extension
  metadata    JSONB,
  UNIQUE (source, external_id)
);

-- Feed sources (user-configured)
CREATE TABLE feed_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key     TEXT REFERENCES api_keys(key),
  type        TEXT NOT NULL,
  config      JSONB NOT NULL,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- User feed preferences
CREATE TABLE feed_preferences (
  api_key     TEXT PRIMARY KEY REFERENCES api_keys(key),
  weights     JSONB NOT NULL DEFAULT '{}',
  filters     JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

> **Note:** The `embedding VECTOR(1536)` column requires the `pgvector` extension. Enable it on Neon/Supabase with: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## 8. Deployment Blockers

### 8.1 Missing Environment Variables

The following environment variables must be set before the platform can function in production. Variables marked **🚨 BLOCKING** will cause startup errors or complete feature unavailability.

| Variable | Status | Impact if Missing |
|----------|--------|-------------------|
| `DATABASE_URL` | Optional (falls back to in-memory) | 🚨 All registrations lost on restart; not suitable for production |
| `ADMIN_TOKEN` | Optional | Admin endpoints are disabled |
| `OPENAI_API_KEY` | **Not yet in `.env.example`** | 🚨 All AI features (summarisation, ranking, embeddings) fail |
| `REDIS_URL` / `UPSTASH_REDIS_REST_URL` | **Not yet in `.env.example`** | 🚨 Caching disabled; high latency, high API costs |
| `GITHUB_TOKEN` | **Not yet in `.env.example`** | 🚨 GitHub connector unauthenticated (60 req/hr limit; effectively unusable) |
| `NEYNAR_API_KEY` | **Not yet in `.env.example`** | 🚨 Farcaster connector disabled |
| `ETH_RPC_URL` | **Not yet in `.env.example`** | 🚨 Web3 on-chain connector disabled |
| `ONEINCH_API_KEY` | Present | Only relevant to DEX module (to be removed) |
| `ZEROX_API_KEY` | Present | Only relevant to DEX module (to be removed) |
| `PLATFORM_FEE_BPS` | Present | Only relevant to DEX module (to be removed) |
| `PLATFORM_FEE_RECIPIENT` | Present | Only relevant to DEX module (to be removed) |

### 8.2 `vercel.json` Configuration Issues

The current `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "ADMIN_TOKEN": "@admin-token"
  }
}
```

The file already declares `outputDirectory` and an `env` section that maps `ADMIN_TOKEN` to a Vercel secret. However, it is incomplete for the new AI/Web3 platform:

1. **Incomplete `env` section** — Only `ADMIN_TOKEN` is declared. New required variables (`OPENAI_API_KEY`, `REDIS_URL`, `GITHUB_TOKEN`, `NEYNAR_API_KEY`, `ETH_RPC_URL`, etc.) must be added to this section (referencing Vercel secrets) so the deployment pipeline is self-documenting and operators know exactly which secrets to provision.
2. **No `functions` section** — AI inference routes may exceed the default 10-second serverless function timeout. Routes that call OpenAI should declare `maxDuration: 30` (or 60 on Pro plans):
   ```json
   "functions": {
     "src/app/api/feed/route.ts": { "maxDuration": 30 },
     "src/app/api/search/route.ts": { "maxDuration": 30 }
   }
   ```
3. **No `headers`** — Missing `Cache-Control` headers for the feed API endpoint will result in no edge caching.

### 8.3 No Rate Limiting on API Endpoints

The current registration system tracks API keys but does **not enforce rate limits** at the HTTP layer. All endpoints are open to abuse. Without Redis-backed rate limiting, the following are exposed:

- Unlimited calls to AI inference endpoints (unbounded OpenAI costs)  
- Unlimited RSS feed refreshes (violates upstream ToS)  
- Unlimited GitHub API proxy calls (blows through token quota)

### 8.4 No Authentication Middleware

API routes that should be key-gated (`/api/feed`, `/api/sources`, `/api/search`) have no authentication middleware. Any caller without a valid `agg_*` key can access them freely.

---

## 9. What to Remove or Repurpose

### 9.1 Files to Delete (DeFi-Specific, No Reuse Value)

| File | Reason |
|------|--------|
| `src/lib/aggregators/index.ts` | 1inch / 0x / ParaSwap DEX aggregation logic |
| `src/lib/aggregators/cross-chain.ts` | Li.Fi / Socket / Squid bridge stubs |
| `src/lib/flashloan/index.ts` | Aave / dYdX / Uniswap V3 / Balancer flash loan logic |
| `src/lib/platform-fee.ts` | BPS fee calculation for swap/flash loan |
| `src/app/api/quote/route.ts` | Swap quote endpoint |
| `src/app/api/swap/route.ts` | Swap transaction endpoint |
| `src/app/api/flashloan/route.ts` | Flash loan comparison endpoint |
| `src/app/api/cross-chain-quote/route.ts` | Cross-chain routing endpoint |

### 9.2 Files to Repurpose (Partially Reusable)

| File | Repurpose Action |
|------|-----------------|
| `src/lib/types.ts` | Delete DeFi types; add `FeedItem`, `FeedSource`, `FeedQuery`, `RankingWeights`, `AIResult` interfaces |
| `src/lib/index.ts` | Remove DEX/flashloan exports; export new feed, AI, connector, cache modules |
| `src/lib/config.ts` | Add new env-var reads: `OPENAI_API_KEY`, `REDIS_URL`, `GITHUB_TOKEN`, `NEYNAR_API_KEY`, `ETH_RPC_URL` |
| `src/app/api/health/route.ts` | Update config summary to reflect new modules (AI, cache, connectors) |
| `src/app/api/admin/stats/route.ts` | Replace hardcoded demo data with real queries for feed volume, source counts, AI usage |
| `src/app/page.tsx` | Replace DeFi landing page with AI/Web3 aggregator value proposition |
| `src/app/docs/page.tsx` | Replace DeFi API docs with feed aggregator API docs |
| `src/components/NavBar.tsx` | Update navigation links (Home, Feed, Sources, Docs, Admin) |
| `.env.example` | Remove DEX-specific vars; add AI, cache, Web3, social vars |
| `scripts/migrate.sql` | Extend with `feed_items`, `feed_sources`, `feed_preferences` tables |
| `vercel.json` | Add `functions` timeouts for AI routes; declare env variable contract |

### 9.3 Files to Keep As-Is

| File | Reason |
|------|--------|
| `src/lib/retry.ts` | Generic HTTP retry — directly reusable for all connectors |
| `src/lib/store.ts` | In-memory / factory pattern reusable with new store types |
| `src/lib/store-pg.ts` | PostgreSQL client reusable; only schema changes needed |
| `src/app/api/register/route.ts` | API key issuance — unchanged |
| `src/app/register/page.tsx` | Developer registration UI — unchanged |
| `tsconfig.json` | No changes needed |
| `tailwind.config.ts` | No changes needed |
| `next.config.mjs` | Minor additions only (e.g., `serverExternalPackages`) |
| `.gitignore` | No changes needed |
| `LICENSE` | No changes needed |

---

## 10. Recommended Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ /feed    │  │ /sources │  │ /search  │  │ /register     │  │
│  │ API route│  │ API route│  │ API route│  │ API route     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │              │                            │
│  ┌────▼──────────────▼──────────────▼──────┐                    │
│  │              Feed Pipeline               │                    │
│  │  aggregate → dedup → rank → cache       │                    │
│  └────┬──────────────────────────┬─────────┘                    │
│       │                          │                               │
│  ┌────▼──────────────┐   ┌───────▼──────────────┐               │
│  │   Connectors       │   │   AI Processing      │               │
│  │  ┌─────────────┐  │   │  ┌────────────────┐  │               │
│  │  │  GitHub     │  │   │  │ Summarise      │  │               │
│  │  │  RSS/Atom   │  │   │  │ Classify       │  │               │
│  │  │  Web3       │  │   │  │ Embed          │  │               │
│  │  │  Farcaster  │  │   │  │ Rank (AI)      │  │               │
│  │  │  Lens       │  │   │  └────────────────┘  │               │
│  │  └─────────────┘  │   │    OpenAI API         │               │
│  └────────────────────┘   └──────────────────────┘               │
│                                                                   │
│  ┌──────────────────┐  ┌───────────────────────────────────┐    │
│  │   Cache (Redis)  │  │   Storage (PostgreSQL + pgvector) │    │
│  │  Feed items      │  │  api_keys, feed_items,            │    │
│  │  AI responses    │  │  feed_sources, feed_preferences   │    │
│  │  Rate limits     │  │  + vector embeddings              │    │
│  └──────────────────┘  └───────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Migration Roadmap

### Phase 1 — Clean Up (1–2 days)

- [ ] Delete DeFi-specific modules: `aggregators/`, `flashloan/`, `platform-fee.ts`
- [ ] Delete DeFi API routes: `quote/`, `swap/`, `flashloan/`, `cross-chain-quote/`
- [ ] Update `src/lib/types.ts` — remove DeFi types, add feed types
- [ ] Update `src/lib/index.ts` — remove DeFi exports
- [ ] Update `src/lib/config.ts` — add new env-var declarations
- [ ] Update `.env.example` — remove DEX vars, add AI/Web3/social vars
- [ ] Verify ESLint 9 configuration (`eslint@9.39.3` + `eslint-config-next@16.1.6`); add ESLint 9 legacy-config bridge or adjust config only if linting errors occur
- [ ] Extend `scripts/migrate.sql` with new tables

### Phase 2 — Core Infrastructure (3–5 days)

- [ ] Implement `src/lib/feed/types.ts` — canonical `FeedItem` type
- [ ] Implement `src/lib/cache/client.ts` — Redis / Upstash client
- [ ] Implement `src/lib/cache/rate-limit.ts` — per-key rate limiter
- [ ] Add authentication middleware for feed endpoints
- [ ] Update `vercel.json` — add function timeouts and env declarations

### Phase 3 — Connectors (5–7 days)

- [ ] Implement `src/lib/connectors/rss/` — RSS/Atom parser
- [ ] Implement `src/lib/connectors/github/` — GitHub events feed
- [ ] Implement `src/lib/connectors/web3/` — on-chain event monitor
- [ ] Implement `src/lib/connectors/social/farcaster.ts`
- [ ] Implement `src/lib/connectors/social/lens.ts`

### Phase 4 — AI Layer (3–5 days)

- [ ] Implement `src/lib/ai/client.ts` — OpenAI client
- [ ] Implement `src/lib/ai/summarise.ts`
- [ ] Implement `src/lib/ai/classify.ts`
- [ ] Implement `src/lib/ai/embed.ts`
- [ ] Implement `src/lib/ai/rank.ts`
- [ ] Enable `pgvector` in database and add embedding column to `feed_items`

### Phase 5 — Feed Pipeline & API (3–4 days)

- [ ] Implement `src/lib/feed/aggregate.ts`
- [ ] Implement `src/lib/feed/dedup.ts`
- [ ] Implement `src/lib/feed/pipeline.ts`
- [ ] Add `/api/feed/route.ts`
- [ ] Add `/api/feed/[source]/route.ts`
- [ ] Add `/api/sources/route.ts`
- [ ] Add `/api/search/route.ts`

### Phase 6 — UI & Docs (2–3 days)

- [ ] Replace landing page with AI/Web3 aggregator content
- [ ] Replace docs page with new API reference
- [ ] Update NavBar links
- [ ] Update admin dashboard with real feed statistics

### Phase 7 — Testing & Observability (2–3 days)

- [ ] Add Jest + Testing Library configuration
- [ ] Write unit tests for connectors, ranking engine, and feed pipeline
- [ ] Add structured logging (e.g., `pino` or Vercel's `@vercel/logger`)
- [ ] Add error alerting (e.g., Sentry)

---

*Total estimated effort: **19–29 engineering days** for a single developer, or **1–2 weeks** for a small team (2–3 engineers).*

---

*This report was generated by automated analysis of the repository source tree. It reflects the state of the codebase as of 2026-03-06.*
