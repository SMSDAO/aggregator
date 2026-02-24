/**
 * Cross-chain aggregator routing.
 *
 * This module queries multiple cross-chain aggregators in parallel and selects
 * the best route based on the highest destination-chain output amount.
 *
 * Each aggregator function is a STUB that documents the real API call required.
 * Replace the stub body with a real HTTP fetch once API keys are provisioned.
 */

import type {
  CrossChainQuoteRequest,
  CrossChainQuoteResult,
  BestCrossChainQuote,
  SwapTransaction,
  Token,
} from "../types";

/** Chain IDs that are supported on at least one cross-chain aggregator. */
const CROSS_CHAIN_SUPPORTED_CHAINS = [
  1,     // Ethereum
  10,    // Optimism
  56,    // BNB Chain
  137,   // Polygon
  250,   // Fantom
  8453,  // Base
  42161, // Arbitrum One
  43114, // Avalanche
];

/** Li.Fi router addresses per chain (used as the `to` field in the transaction). */
const LIFI_ROUTER_ADDRESSES: Record<number, string> = {
  1:     "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  10:    "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  56:    "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  137:   "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  250:   "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  8453:  "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  42161: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  43114: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
};

/** Socket (Bungee) gateway addresses per chain. */
const SOCKET_GATEWAY_ADDRESSES: Record<number, string> = {
  1:     "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  10:    "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  56:    "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  137:   "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  8453:  "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  42161: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  43114: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
};

/** Squid router addresses per chain. */
const SQUID_ROUTER_ADDRESSES: Record<number, string> = {
  1:     "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  10:    "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  137:   "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  8453:  "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  42161: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  43114: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
};

function buildPlaceholderTransaction(
  routerAddress: string
): SwapTransaction {
  return {
    to: routerAddress,
    // Replace "0x" with the ABI-encoded calldata returned by the aggregator's
    // /quote or /build-tx endpoint once real API integration is wired up.
    data: "0x",
    value: "0",
    gasLimit: "500000",
  };
}

function mockCrossChainToken(address: string, chainId: number): Token {
  return {
    address,
    chainId,
    symbol: "UNKNOWN",
    name: "Unknown Token",
    decimals: 18,
  };
}

// ─── Li.Fi ────────────────────────────────────────────────────────────────────
// STUB: returns simulated data. Replace with a real Li.Fi API v3 call:
//
//   POST https://li.quest/v1/quote
//   Body: { fromChain, toChain, fromToken, toToken, fromAmount, fromAddress,
//           toAddress, slippage }
//   Headers: { "x-lifi-api-key": "<your key from https://li.fi/sdk/>" }
//
// The response includes `transactionRequest` which maps directly to SwapTransaction.
async function getLifiQuote(
  request: CrossChainQuoteRequest
): Promise<CrossChainQuoteResult | null> {
  try {
    const slippage = request.slippage ?? 0.5;
    // Simulate: output ≈ 99.4% of input (bridge + DEX fees ≈ 0.6%)
    const toAmount = (BigInt(request.amount) * BigInt(9940)) / BigInt(10000);
    return {
      aggregator: "Li.Fi",
      fromChainId: request.fromChainId,
      toChainId: request.toChainId,
      fromToken: mockCrossChainToken(request.fromToken, request.fromChainId),
      toToken: mockCrossChainToken(request.toToken, request.toChainId),
      fromAmount: request.amount,
      toAmount: toAmount.toString(),
      bridgeUsed: "Stargate",
      dexUsed: "Uniswap V3",
      estimatedTimeSeconds: 120,
      estimatedGas: "250000",
      // Stubbed fee display; avoid parseFloat/toFixed on potentially large base-unit amounts.
      feesUsd: "0.0000",
      transaction: buildPlaceholderTransaction(
        LIFI_ROUTER_ADDRESSES[request.fromChainId] ??
          "0x0000000000000000000000000000000000000000"
      ),
    };
    void slippage;
  } catch {
    return null;
  }
}

// ─── Socket (Bungee) ──────────────────────────────────────────────────────────
// STUB: returns simulated data. Replace with a real Socket API v2 call:
//
//   GET https://api.socket.tech/v2/quote
//     ?fromChainId={fromChainId}&toChainId={toChainId}
//     &fromTokenAddress={fromToken}&toTokenAddress={toToken}
//     &fromAmount={amount}&userAddress={fromAddress}
//     &sort=output&singleTxOnly=true
//   Headers: { "API-KEY": "<your key from https://docs.socket.tech/>" }
//
//   Then POST https://api.socket.tech/v2/build-tx with the chosen route to get
//   calldata. Set `transaction.data` to `result.result.txData`.
async function getSocketQuote(
  request: CrossChainQuoteRequest
): Promise<CrossChainQuoteResult | null> {
  try {
    // Simulate: output ≈ 99.2% of input
    const toAmount = (BigInt(request.amount) * BigInt(9920)) / BigInt(10000);
    return {
      aggregator: "Socket",
      fromChainId: request.fromChainId,
      toChainId: request.toChainId,
      fromToken: mockCrossChainToken(request.fromToken, request.fromChainId),
      toToken: mockCrossChainToken(request.toToken, request.toChainId),
      fromAmount: request.amount,
      toAmount: toAmount.toString(),
      bridgeUsed: "Hop Protocol",
      dexUsed: "SushiSwap",
      estimatedTimeSeconds: 180,
      estimatedGas: "280000",
      feesUsd: (parseFloat(request.amount) * 0.004 / 1e18).toFixed(4),
      transaction: buildPlaceholderTransaction(
        SOCKET_GATEWAY_ADDRESSES[request.fromChainId] ??
          "0x0000000000000000000000000000000000000000"
      ),
    };
  } catch {
    return null;
  }
}

// ─── Squid (Axelar) ───────────────────────────────────────────────────────────
// STUB: returns simulated data. Replace with a real Squid v2 API call:
//
//   POST https://apiplus.squidrouter.com/v2/route
//   Body: { fromChain: fromChainId.toString(), toChain: toChainId.toString(),
//           fromToken, toToken, fromAmount, fromAddress,
//           toAddress: toAddress ?? fromAddress,
//           slippage: (slippage ?? 0.5).toString(),
//           enableBoost: true }
//   Headers: { "x-integrator-id": "<your ID from https://docs.squidrouter.com/>" }
//
//   Use `route.transactionRequest` from the response as `transaction`.
async function getSquidQuote(
  request: CrossChainQuoteRequest
): Promise<CrossChainQuoteResult | null> {
  try {
    // Simulate: output ≈ 99.5% of input (Axelar GMP fees ≈ 0.5%)
    const toAmount = (BigInt(request.amount) * BigInt(9950)) / BigInt(10000);
    return {
      aggregator: "Squid",
      fromChainId: request.fromChainId,
      toChainId: request.toChainId,
      fromToken: mockCrossChainToken(request.fromToken, request.fromChainId),
      toToken: mockCrossChainToken(request.toToken, request.toChainId),
      fromAmount: request.amount,
      toAmount: toAmount.toString(),
      bridgeUsed: "Axelar",
      dexUsed: "Uniswap V3",
      estimatedTimeSeconds: 60,
      estimatedGas: "220000",
      feesUsd: (parseFloat(request.amount) * 0.002 / 1e18).toFixed(4),
      transaction: buildPlaceholderTransaction(
        SQUID_ROUTER_ADDRESSES[request.fromChainId] ??
          "0x0000000000000000000000000000000000000000"
      ),
    };
  } catch {
    return null;
  }
}

// ─── Router registry ──────────────────────────────────────────────────────────

/** All registered cross-chain aggregator functions keyed by name. */
const CROSS_CHAIN_AGGREGATORS: Record<
  string,
  (req: CrossChainQuoteRequest) => Promise<CrossChainQuoteResult | null>
> = {
  "Li.Fi": getLifiQuote,
  Socket: getSocketQuote,
  Squid: getSquidQuote,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Query all supported cross-chain aggregators in parallel and return the best
 * route (highest `toAmount`) along with all alternatives for comparison.
 *
 * Pass `request.aggregators` to restrict which aggregators are queried.
 */
export async function getCrossChainQuotes(
  request: CrossChainQuoteRequest
): Promise<BestCrossChainQuote> {
  if (!CROSS_CHAIN_SUPPORTED_CHAINS.includes(request.fromChainId)) {
    throw new Error(
      `Source chain ${request.fromChainId} is not supported for cross-chain swaps`
    );
  }
  if (!CROSS_CHAIN_SUPPORTED_CHAINS.includes(request.toChainId)) {
    throw new Error(
      `Destination chain ${request.toChainId} is not supported for cross-chain swaps`
    );
  }
  if (request.fromChainId === request.toChainId) {
    throw new Error(
      "fromChainId and toChainId must differ; use /api/quote for single-chain swaps"
    );
  }

  const selectedAggregators = request.aggregators
    ? Object.entries(CROSS_CHAIN_AGGREGATORS).filter(([name]) =>
        request.aggregators!.includes(name)
      )
    : Object.entries(CROSS_CHAIN_AGGREGATORS);

  const results = await Promise.allSettled(
    selectedAggregators.map(([, fn]) => fn(request))
  );

  const allQuotes: CrossChainQuoteResult[] = results
    .filter(
      (r): r is PromiseFulfilledResult<CrossChainQuoteResult> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  if (allQuotes.length === 0) {
    throw new Error("No cross-chain quotes available");
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
    const worstBig = BigInt(worst.toAmount);
    // Compute percentage with 2 decimal places using integer math:
    // scaledPercentTimes100 = (savings / worst) * 100, scaled by an extra 100x.
    const scaledPercentTimes100 = (savingsBig * 10000n) / worstBig;
    savingsPercent = Number(scaledPercentTimes100) / 100;
  }
  return { ...best, savings, savingsPercent, allQuotes };
}

export { CROSS_CHAIN_SUPPORTED_CHAINS, CROSS_CHAIN_AGGREGATORS };
