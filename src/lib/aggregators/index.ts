import type { QuoteRequest, QuoteResult, BestQuote, Token, RouteStep } from "../types";

const SUPPORTED_CHAINS = [1, 10, 56, 137, 8453, 42161, 43114];

/** Well-known token metadata used as a fallback when the API response omits it. */
const KNOWN_TOKENS: Record<string, Partial<Token>> = {
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": { symbol: "ETH",  name: "Ethereum",       decimals: 18 },
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": { symbol: "WETH", name: "Wrapped Ether",  decimals: 18 },
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": { symbol: "USDC", name: "USD Coin",        decimals: 6  },
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": { symbol: "USDT", name: "Tether USD",       decimals: 6  },
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": { symbol: "DAI",  name: "Dai Stablecoin",  decimals: 18 },
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { symbol: "WBTC", name: "Wrapped BTC",     decimals: 8  },
};

/** Build a Token object, preferring API-supplied fields over local fallbacks. */
function resolveToken(
  address: string,
  chainId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiFields?: Record<string, any>
): Token {
  const known = KNOWN_TOKENS[address] ?? {};
  return {
    address,
    chainId,
    symbol:   apiFields?.symbol   ?? known.symbol   ?? "UNKNOWN",
    name:     apiFields?.name     ?? known.name     ?? "Unknown Token",
    decimals: apiFields?.decimals ?? known.decimals ?? 18,
    logoURI:  apiFields?.logoURI  ?? apiFields?.logoUri,
  };
}

function calculatePriceImpact(
  amount: string,
  liquidity: number,
  decimals: number = 18
): number {
  const amountNum = parseFloat(amount) / Math.pow(10, decimals);
  return Math.min((amountNum / liquidity) * 100, 50);
}

/**
 * Calls the real 1inch Swap API v6.0.
 * Endpoint: GET https://api.1inch.dev/swap/v6.0/{chainId}/quote
 * Auth: Authorization: Bearer {ONEINCH_API_KEY}  (get key at https://portal.1inch.dev/)
 * Returns null when ONEINCH_API_KEY is not set or the request fails.
 */
async function getOneInchQuote(request: QuoteRequest): Promise<QuoteResult | null> {
  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`https://api.1inch.dev/swap/v6.0/${request.chainId}/quote`);
    url.searchParams.set("src", request.fromToken);
    url.searchParams.set("dst", request.toToken);
    url.searchParams.set("amount", request.amount);
    if (request.slippage != null) url.searchParams.set("slippage", String(request.slippage));

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await resp.json();
    const fromToken = resolveToken(request.fromToken, request.chainId, data.srcToken);
    const toToken   = resolveToken(request.toToken,   request.chainId, data.dstToken);

    // Flatten the 3-D protocols array: [[[{name, part, fromTokenAddress, toTokenAddress}]]]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route: RouteStep[] = (data.protocols as any[][][])?.flat(2).map((p: any) => ({
      protocol:    p.name ?? "Unknown",
      poolAddress: p.toTokenAddress ?? request.toToken,
      fromToken:   p.fromTokenAddress ?? request.fromToken,
      toToken:     p.toTokenAddress   ?? request.toToken,
      share:       p.part ?? 100,
    })) ?? [];

    return {
      aggregator: "1inch",
      fromToken,
      toToken,
      fromAmount: request.amount,
      toAmount:   String(data.dstAmount ?? data.toAmount ?? "0"),
      estimatedGas: String(data.gas ?? "0"),
      priceImpact: calculatePriceImpact(request.amount, 10_000_000, fromToken.decimals),
      protocols: [...new Set(route.map((r) => r.protocol))],
      route,
    };
  } catch {
    return null;
  }
}

/**
 * Calls the real 0x Swap API v2 (Permit2).
 * Endpoint: GET https://api.0x.org/swap/permit2/quote
 * Auth: 0x-api-key: {ZEROX_API_KEY}  (get key at https://0x.org/docs/introduction/getting-started)
 * Returns null when ZEROX_API_KEY is not set or the request fails.
 */
async function getZeroExQuote(request: QuoteRequest): Promise<QuoteResult | null> {
  const apiKey = process.env.ZEROX_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://api.0x.org/swap/permit2/quote");
    url.searchParams.set("chainId",     String(request.chainId));
    url.searchParams.set("sellToken",   request.fromToken);
    url.searchParams.set("buyToken",    request.toToken);
    url.searchParams.set("sellAmount",  request.amount);
    if (request.slippage != null) url.searchParams.set("slippageBps", String(Math.round(request.slippage * 100)));

    const resp = await fetch(url.toString(), {
      headers: { "0x-api-key": apiKey },
    });
    if (!resp.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await resp.json();
    const fromToken = resolveToken(request.fromToken, request.chainId);
    const toToken   = resolveToken(request.toToken,   request.chainId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route: RouteStep[] = (data.route?.fills as any[])?.map((fill: any) => ({
      protocol:    fill.source ?? "Unknown",
      poolAddress: fill.sourceAddress ?? request.toToken,
      fromToken:   fill.from ?? request.fromToken,
      toToken:     fill.to   ?? request.toToken,
      share:       fill.proportionBps ? fill.proportionBps / 100 : 100,
    })) ?? [];

    return {
      aggregator: "0x Protocol",
      fromToken,
      toToken,
      fromAmount: request.amount,
      toAmount:   String(data.buyAmount ?? "0"),
      estimatedGas: String(data.transaction?.gas ?? data.estimatedGas ?? "0"),
      priceImpact: calculatePriceImpact(request.amount, 8_000_000, fromToken.decimals),
      protocols: [...new Set(route.map((r) => r.protocol))],
      route,
    };
  } catch {
    return null;
  }
}

/**
 * Calls the real ParaSwap API v5.
 * Endpoint: GET https://apiv5.paraswap.io/prices
 * No API key required for price queries; see https://developers.paraswap.network/
 * Returns null if the request fails.
 */
async function getParaswapQuote(request: QuoteRequest): Promise<QuoteResult | null> {
  try {
    const fromToken = resolveToken(request.fromToken, request.chainId);
    const toToken   = resolveToken(request.toToken,   request.chainId);

    const url = new URL("https://apiv5.paraswap.io/prices");
    url.searchParams.set("srcToken",     request.fromToken);
    url.searchParams.set("destToken",    request.toToken);
    url.searchParams.set("amount",       request.amount);
    url.searchParams.set("network",      String(request.chainId));
    url.searchParams.set("srcDecimals",  String(fromToken.decimals));
    url.searchParams.set("destDecimals", String(toToken.decimals));
    url.searchParams.set("side",         "SELL");

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await resp.json();
    const priceRoute = data.priceRoute;
    if (!priceRoute) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route: RouteStep[] = (priceRoute.bestRoute as any[])?.flatMap((leg: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (leg.swaps as any[])?.flatMap((swap: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (swap.swapExchanges as any[])?.map((ex: any) => ({
          protocol:    ex.exchange ?? "Unknown",
          poolAddress: ex.poolAddresses?.[0] ?? request.toToken,
          fromToken:   swap.srcToken  ?? request.fromToken,
          toToken:     swap.destToken ?? request.toToken,
          share:       ex.percent ?? 100,
        })) ?? []
      ) ?? []
    ) ?? [];

    return {
      aggregator: "Paraswap",
      fromToken:  resolveToken(request.fromToken, request.chainId, { decimals: priceRoute.srcDecimals }),
      toToken:    resolveToken(request.toToken,   request.chainId, { decimals: priceRoute.destDecimals }),
      fromAmount: request.amount,
      toAmount:   String(priceRoute.destAmount ?? "0"),
      estimatedGas: String(priceRoute.gasCost ?? "0"),
      priceImpact: calculatePriceImpact(request.amount, 12_000_000, fromToken.decimals),
      protocols: [...new Set(route.map((r) => r.protocol))],
      route,
    };
  } catch {
    return null;
  }
}

async function getUniswapQuote(
  request: QuoteRequest
): Promise<QuoteResult | null> {
  // To enable real Uniswap quotes, replace this error with an implementation
  // that calls the Uniswap Auto Router API or the on-chain Quoter V2 contract
  // and constructs a proper QuoteResult from the response.
  void request;
  throw new Error(
    "Uniswap quote integration is not implemented. This stub must be replaced with a real integration before use in production."
  );
}

export async function getQuotes(request: QuoteRequest): Promise<BestQuote> {
  if (!SUPPORTED_CHAINS.includes(request.chainId)) {
    throw new Error(`Chain ${request.chainId} is not supported`);
  }

  const aggregatorFns = [
    getOneInchQuote,
    getZeroExQuote,
    getParaswapQuote,
    getUniswapQuote,
  ];

  const selectedFns = request.aggregators
    ? aggregatorFns.filter((fn) => {
        const names = ["1inch", "0x Protocol", "Paraswap", "Uniswap"];
        const idx = aggregatorFns.indexOf(fn);
        return request.aggregators!.includes(names[idx]);
      })
    : aggregatorFns;

  const results = await Promise.allSettled(selectedFns.map((fn) => fn(request)));
  const allQuotes: QuoteResult[] = results
    .filter(
      (r): r is PromiseFulfilledResult<QuoteResult> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  if (allQuotes.length === 0) {
    throw new Error("No quotes available from any aggregator");
  }

  if (allQuotes.every((q) => q.toAmount === "0")) {
    throw new Error(
      "All aggregators returned zero output; the token pair may not be supported"
    );
  }

  allQuotes.sort((a, b) => {
    const aOut = BigInt(a.toAmount);
    const bOut = BigInt(b.toAmount);
    return bOut > aOut ? 1 : bOut < aOut ? -1 : 0;
  });

  const best = allQuotes[0];
  const worst = allQuotes[allQuotes.length - 1];
  const savingsBig = BigInt(best.toAmount) - BigInt(worst.toAmount);
  const savings = savingsBig.toString();
  let savingsPercent = 0;
  if (worst.toAmount !== "0") {
    // Use integer basis-point math to avoid Number precision loss on large amounts.
    const scaledBps = (savingsBig * BigInt(10000)) / BigInt(worst.toAmount);
    savingsPercent = Number(scaledBps) / 100;
  }

  return {
    ...best,
    savings,
    savingsPercent,
    allQuotes,
  };
}

export { SUPPORTED_CHAINS };
