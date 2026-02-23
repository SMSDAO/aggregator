import type { QuoteRequest, QuoteResult, BestQuote, Token } from "../types";

const SUPPORTED_CHAINS = [1, 10, 56, 137, 8453, 42161, 43114];

function mockToken(address: string, chainId: number): Token {
  const tokens: Record<string, Partial<Token>> = {
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": {
      symbol: "ETH",
      name: "Ethereum",
      decimals: 18,
    },
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
    },
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": {
      symbol: "WBTC",
      name: "Wrapped BTC",
      decimals: 8,
    },
  };
  return {
    address,
    chainId,
    symbol: tokens[address]?.symbol ?? "UNKNOWN",
    name: tokens[address]?.name ?? "Unknown Token",
    decimals: tokens[address]?.decimals ?? 18,
  };
}

function calculatePriceImpact(amount: string, liquidity: number): number {
  const amountNum = parseFloat(amount) / 1e18;
  return Math.min((amountNum / liquidity) * 100, 50);
}

async function getOneInchQuote(
  request: QuoteRequest
): Promise<QuoteResult | null> {
  try {
    const baseOutput = (BigInt(request.amount) * BigInt(997)) / BigInt(1000);
    return {
      aggregator: "1inch",
      fromToken: mockToken(request.fromToken, request.chainId),
      toToken: mockToken(request.toToken, request.chainId),
      fromAmount: request.amount,
      toAmount: baseOutput.toString(),
      estimatedGas: "150000",
      priceImpact: calculatePriceImpact(request.amount, 10_000_000),
      protocols: ["Uniswap V3", "Curve", "Balancer"],
      route: [
        {
          protocol: "Uniswap V3",
          poolAddress: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
          fromToken: request.fromToken,
          toToken: request.toToken,
          share: 60,
        },
        {
          protocol: "Curve",
          poolAddress: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
          fromToken: request.fromToken,
          toToken: request.toToken,
          share: 40,
        },
      ],
    };
  } catch {
    return null;
  }
}

async function getZeroExQuote(
  request: QuoteRequest
): Promise<QuoteResult | null> {
  try {
    const baseOutput = (BigInt(request.amount) * BigInt(995)) / BigInt(1000);
    return {
      aggregator: "0x Protocol",
      fromToken: mockToken(request.fromToken, request.chainId),
      toToken: mockToken(request.toToken, request.chainId),
      fromAmount: request.amount,
      toAmount: baseOutput.toString(),
      estimatedGas: "180000",
      priceImpact: calculatePriceImpact(request.amount, 8_000_000),
      protocols: ["Uniswap V2", "SushiSwap"],
      fee: 0.05,
      route: [
        {
          protocol: "Uniswap V2",
          poolAddress: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
          fromToken: request.fromToken,
          toToken: request.toToken,
          share: 70,
        },
        {
          protocol: "SushiSwap",
          poolAddress: "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
          fromToken: request.fromToken,
          toToken: request.toToken,
          share: 30,
        },
      ],
    };
  } catch {
    return null;
  }
}

async function getParaswapQuote(
  request: QuoteRequest
): Promise<QuoteResult | null> {
  try {
    const baseOutput = (BigInt(request.amount) * BigInt(998)) / BigInt(1000);
    return {
      aggregator: "Paraswap",
      fromToken: mockToken(request.fromToken, request.chainId),
      toToken: mockToken(request.toToken, request.chainId),
      fromAmount: request.amount,
      toAmount: baseOutput.toString(),
      estimatedGas: "160000",
      priceImpact: calculatePriceImpact(request.amount, 12_000_000),
      protocols: ["Uniswap V3", "Aave"],
      route: [
        {
          protocol: "Uniswap V3",
          poolAddress: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
          fromToken: request.fromToken,
          toToken: request.toToken,
          share: 100,
        },
      ],
    };
  } catch {
    return null;
  }
}

async function getUniswapQuote(
  request: QuoteRequest
): Promise<QuoteResult | null> {
  // This function previously returned a fabricated quote using a hardcoded
  // formula and mock token metadata. To avoid returning misleading data,
  // Uniswap integration has been marked as unimplemented here.
  //
  // To enable real Uniswap quotes, replace this error with an implementation
  // that calls Uniswap's official APIs or on-chain contracts and constructs
  // a proper QuoteResult from the response.
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
  const savings = (BigInt(best.toAmount) - BigInt(worst.toAmount)).toString();
  const savingsPercent =
    worst.toAmount !== "0"
      ? (Number(savings) / Number(worst.toAmount)) * 100
      : 0;

  return {
    ...best,
    savings,
    savingsPercent,
    allQuotes,
  };
}

export { SUPPORTED_CHAINS };
