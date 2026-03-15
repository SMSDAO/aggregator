# User Guide

## Getting Started

### 1. Register for an API Key

1. Navigate to [/register](/register) or click **Get API Key** in the top navigation.
2. Fill in your name, email address, project name, and use case.
3. Click **Register & Get API Key**.
4. **Save your API key immediately** — it is shown only once.

### 2. Your Dashboard

Visit [/dashboard](/dashboard) to access:

| Tab | Contents |
|-----|---------|
| **Overview** | API usage stats, metered-usage bars, recent activity |
| **Activity** | Full API call history with status codes |
| **Notifications** | Usage alerts, plan reminders, security notices |
| **Account Settings** | Edit profile, manage API key, upgrade plan |

### 3. Making API Calls

Include your API key as a Bearer token in the `Authorization` header:

```http
Authorization: Bearer dex_your_api_key_here
```

#### Get a Swap Quote

```bash
curl "https://your-deployment.vercel.app/api/quote?fromToken=0xEeee...&toToken=0xA0b8...&amount=1000000000000000000&chainId=1"
```

#### Execute a Swap

```bash
curl -X POST https://your-deployment.vercel.app/api/swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "toToken":   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "amount":    "1000000000000000000",
    "chainId":   1,
    "fromAddress": "0xYourWalletAddress"
  }'
```

### 4. Plan Limits

| Plan | Requests/month | Support |
|------|---------------|---------|
| Free | 1,000 | Community |
| Pro | 100,000 | Email |
| Enterprise | Unlimited | Slack + SLA |

Upgrade via the [Dashboard → Account Settings](/dashboard) tab or contact us for Enterprise.

### 5. Rate Limiting

The API enforces a limit of **60 requests per minute per IP**. If you exceed this, you will receive a `429 Too Many Requests` response with a `Retry-After: 60` header.
