# Environment Variables Reference

All variables are read at **call time** (not module initialization) so Vercel dashboard changes take effect without redeployment.

---

## Database

### `DATABASE_URL`
| | |
|-|-|
| **Required** | In production |
| **Default** | *(unset — uses in-memory store)* |
| **Format** | `postgres://user:pass@host:5432/dbname` |

PostgreSQL connection string. When set, the app uses `PostgresRegistrationStore` (Neon / Supabase / any standard Postgres). When unset, an in-memory `Map` is used (local dev only — data is lost on restart and not shared across serverless instances).

---

## Admin

### `ADMIN_TOKEN`
| | |
|-|-|
| **Required** | Yes (to enable admin dashboard) |
| **Default** | *(unset — admin disabled)* |
| **Example** | `openssl rand -hex 32` |

Bearer token required for `GET /api/admin/stats`. Set a long, random value. Never commit this to source control.

---

## Platform Fee

### `PLATFORM_FEE_BPS`
| | |
|-|-|
| **Required** | No |
| **Default** | `10` (= 0.1%) |
| **Range** | `0` – `10000` |

Fee charged on swaps and flash loans, expressed in **basis points** (1 bp = 0.01%). Set to `0` to disable the fee entirely.

### `PLATFORM_FEE_RECIPIENT`
| | |
|-|-|
| **Required** | No |
| **Default** | *(unset)* |
| **Format** | EVM wallet address, e.g. `0xABC…123` |

The wallet address that receives the platform fee. If unset the fee is calculated and disclosed in API responses, but no on-chain transfer is constructed.

---

## Aggregator API Keys

### `ONEINCH_API_KEY`
| | |
|-|-|
| **Required** | No |
| **Default** | *(unset — 1inch quotes skipped)* |
| **Obtain** | [portal.1inch.dev](https://portal.1inch.dev/) |

When unset, 1inch quotes are omitted from aggregation. Other aggregators continue to work.

### `ZEROX_API_KEY`
| | |
|-|-|
| **Required** | No |
| **Default** | *(unset — 0x quotes skipped)* |
| **Obtain** | [dashboard.0x.org](https://dashboard.0x.org/) |

When unset, 0x Protocol quotes are omitted from aggregation.

---

## Example `.env.local`

```env
DATABASE_URL=postgres://user:pass@ep-example.neon.tech/neondb

ADMIN_TOKEN=<run: openssl rand -hex 32>

PLATFORM_FEE_BPS=10
PLATFORM_FEE_RECIPIENT=0xYourWalletAddress

ONEINCH_API_KEY=your_1inch_key
ZEROX_API_KEY=your_0x_key
```
