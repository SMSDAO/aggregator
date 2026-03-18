# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] – 2026-03-15

### Added

#### CI/CD
- GitHub Actions CI workflow (`ci.yml`): lint + typecheck, Next.js build, Jest tests, dependency audit
- GitHub Actions Release workflow (`release.yml`): triggered on version tags, creates a GitHub Release

#### UI & Navigation
- Full responsive tab navigation bar: **Home, Dashboard, Users, Admin, Developer, Settings, Docs**
- Active-route highlighting and keyboard navigation on all NavBar links
- Mobile-friendly hamburger menu with Escape-to-close support
- "Get API Key" CTA button in desktop and mobile nav

#### Dashboards
- **User Dashboard** (`/dashboard`): account overview, metered-usage progress bars, activity log, notifications, and account settings tab
- **Users Page** (`/users`): searchable/filterable table of registered API key holders with role and plan badges
- **Developer Dashboard** (`/developer`): API endpoint monitoring, structured log viewer with level filter, environment variable status, and deployment diagnostics
- **Settings Page** (`/settings`): profile editing, API key management, notification toggles, danger zone

#### Security & Middleware
- Edge middleware (`src/middleware.ts`) applying security headers on all responses:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security` with preload
  - `Content-Security-Policy`
  - `Permissions-Policy`
- In-edge rate limiting: 60 API requests per minute per IP with `429 Too Many Requests` response and `Retry-After` header

#### Testing
- Jest test suite with `ts-jest` transformer
- 18 unit tests covering `config`, `platform-fee`, and `retry` modules
- `npm test` and `npm run test:coverage` scripts added to `package.json`

#### Documentation
- `docs/DEPLOYMENT.md`: step-by-step Vercel and self-hosted deployment guide
- `docs/ENVIRONMENT.md`: complete environment variable reference
- `docs/ARCHITECTURE.md`: system architecture overview
- `docs/USER_GUIDE.md`: end-user guide (registration, API usage, dashboard)
- `docs/ADMIN_GUIDE.md`: admin authentication, stats API, user management
- `docs/DEVELOPER_GUIDE.md`: SDK integration, API reference, local dev setup
- UI screenshots embedded in `README.md` under "UI Preview"

#### Release Preparation
- `CHANGELOG.md` created (this file)
- `.env.example` reviewed and kept in sync with all used environment variables

### Changed
- NavBar extended from 4 links to 7 tabs with active-state highlighting
- `package.json` version bumped to `1.0.0`
- README updated with architecture overview, UI Preview section, and badges

### Fixed
- No breaking changes to existing API routes (`/api/quote`, `/api/swap`, `/api/flashloan`, `/api/register`, `/api/health`, `/api/admin/stats`, `/api/cross-chain-quote`)
- Preserved all existing lib modules (`aggregators`, `flashloan`, `platform-fee`, `retry`, `store`, `store-pg`, `config`, `types`)

### Security
- Security headers added via Edge middleware (mitigates clickjacking, MIME sniffing, XSS)
- In-edge rate limiting prevents API abuse
- Dependency audit step added to CI

---

## [0.1.0] – 2026-03-06

### Added
- Initial Next.js 16 app skeleton with App Router
- DEX aggregator core: quote, swap, flash loan, cross-chain quote endpoints
- Developer registration + API key issuance backed by Neon Postgres or in-memory fallback
- Admin stats dashboard (token-gated)
- Docs page with API reference
- `platform-fee` module: configurable basis-point fee with BigInt arithmetic
- `config` module: typed env-var reader with validation warnings
- `retry` utility: exponential backoff for external API calls
- Tailwind CSS + Geist font setup
- SQL schema migration (`scripts/migrate.sql`)
- `.env.example` template

[1.0.0]: https://github.com/SMSDAO/aggregator/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/SMSDAO/aggregator/releases/tag/v0.1.0
