# Developer Guide

## Local Development Setup

```bash
git clone https://github.com/SMSDAO/aggregator.git
cd aggregator
npm install
cp .env.example .env.local
# Fill in .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Developer Dashboard

Visit [/developer](/developer) for:

| Tab | Contents |
|-----|---------|
| **API Monitoring** | Request counts, latencies, error rates per endpoint |
| **Log Viewer** | Structured application logs with level filter (INFO/WARN/ERROR/DEBUG) |
| **Environment** | Status of all environment variables |
| **Deployment Diagnostics** | Build, lint, type-check, and dependency health |

## Available Scripts

```bash
npm run dev          # Start Next.js development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm test             # Run Jest test suite
npm run test:coverage# Jest with coverage report
```

## API Reference

All endpoints return JSON. No API key is required unless noted.

### GET/POST `/api/quote`

Returns the best swap quote across all enabled aggregators.

**Query params / body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromToken` | string | Yes | Source token address |
| `toToken` | string | Yes | Destination token address |
| `amount` | string | Yes | Amount in source token base units |
| `chainId` | number | Yes | EVM chain ID |
| `slippage` | number | No | Max slippage % (default: 0.5) |
| `aggregators` | string[] | No | Restrict to specific aggregators |

### POST `/api/swap`

Returns an unsigned transaction ready for wallet signing.

Accepts the same fields as `/api/quote` plus:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromAddress` | string | Yes | Sender wallet address |
| `receiver` | string | No | Recipient (defaults to fromAddress) |

### POST `/api/flashloan`

Compares flash loan providers and returns the cheapest option.

| Field | Type | Required |
|-------|------|----------|
| `asset` | string | Yes |
| `amount` | string | Yes |
| `chainId` | number | Yes |
| `targetContract` | string | Yes |
| `params` | string | Yes |
| `provider` | string | No |

### POST `/api/cross-chain-quote`

Routes a cross-chain swap through the best bridge + DEX combination.

| Field | Type | Required |
|-------|------|----------|
| `fromChainId` | number | Yes |
| `toChainId` | number | Yes |
| `fromToken` | string | Yes |
| `toToken` | string | Yes |
| `amount` | string | Yes |
| `fromAddress` | string | Yes |

### POST `/api/register`

Registers a new developer and issues an API key.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | string | Yes |
| `projectName` | string | Yes |
| `useCase` | string | Yes |

### GET `/api/health`

Returns application health and configuration warnings. No auth required.

### GET `/api/admin/stats`

Requires `Authorization: Bearer <ADMIN_TOKEN>` header.

## TypeScript SDK

```typescript
import { getQuotes } from "@dex-aggregator/sdk";

const best = await getQuotes({
  fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  toToken:   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  amount:    "1000000000000000000", // 1 ETH in wei
  chainId:   1,
});

console.log(`Best: ${best.aggregator}`);
console.log(`You receive: ${best.toAmount} USDC`);
console.log(`Savings vs worst: ${best.savingsPercent.toFixed(2)}%`);
```

## Testing

```bash
npm test
```

Tests live in `src/__tests__/`. The test framework is [Jest](https://jestjs.io/) with [ts-jest](https://github.com/kulshekhar/ts-jest).

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests.
4. Run `npm run lint && npx tsc --noEmit && npm test`
5. Open a pull request into `main`.
