# Admin Guide

## Authentication

The admin dashboard is protected by a Bearer token. Set `ADMIN_TOKEN` to a long random value:

```bash
openssl rand -hex 32
```

Add this value to your Vercel project's environment variables.

## Accessing the Admin Dashboard

1. Navigate to [/admin](/admin).
2. Enter your `ADMIN_TOKEN` value and click **View Stats**.

The session token is stored in `sessionStorage` for the duration of the browser session.

## Admin Stats API

```http
GET /api/admin/stats
Authorization: Bearer <ADMIN_TOKEN>
```

**Response:**

```json
{
  "totalUsers": 42,
  "totalRequests": 128000,
  "totalVolume": "$4.2M",
  "activeAggregators": ["1inch", "0x", "ParaSwap", "Uniswap"],
  "topPairs": [
    { "pair": "ETH/USDC", "volume": "$2.1M", "requests": 4200 }
  ],
  "recentRegistrations": [
    {
      "key": "dex_xxx",
      "name": "Alice Chen",
      "email": "alice@defi.io",
      "projectName": "YieldBot",
      "useCase": "Arbitrage trading",
      "createdAt": "2026-03-15T00:00:00Z",
      "requests": 24531,
      "plan": "pro"
    }
  ]
}
```

## User Management

The [/users](/users) page provides a searchable, filterable view of all registered API key holders. Filter by:
- **Name or email** (text search)
- **Role** (Admin / Developer / User / Auditor)

## RBAC Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access, can manage users, billing, and configuration |
| **Developer** | API access, developer dashboard, log viewer |
| **User** | Standard API usage, user dashboard |
| **Auditor** | Read-only access to audit logs and activity |

## Database Management

Run the migration to create or update the schema:

```bash
psql $DATABASE_URL -f scripts/migrate.sql
```

## Health Check

Monitor application health at:

```bash
curl https://your-deployment.vercel.app/api/health
```

This endpoint returns configuration warnings (missing API keys, no database URL, etc.) without requiring authentication.
