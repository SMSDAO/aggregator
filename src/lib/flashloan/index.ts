import type {
  FlashLoanRequest,
  FlashLoanResult,
  BestFlashLoan,
  SwapTransaction,
} from "../types";

interface FlashLoanProvider {
  name: string;
  feePercent: number;
  maxLiquidity: Record<string, string>;
  chainIds: number[];
}

const FLASH_LOAN_PROVIDERS: FlashLoanProvider[] = [
  {
    name: "Aave V3",
    feePercent: 0.05,
    chainIds: [1, 10, 137, 42161, 43114, 8453],
    maxLiquidity: {
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "500000000000000",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7": "300000000000000",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F": "200000000000000",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "100000000000000000000000",
    },
  },
  {
    name: "dYdX",
    feePercent: 0.0,
    chainIds: [1],
    maxLiquidity: {
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "100000000000000",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "50000000000000000000000",
    },
  },
  {
    name: "Uniswap V3",
    feePercent: 0.05,
    chainIds: [1, 10, 137, 42161, 8453],
    maxLiquidity: {},
  },
  {
    name: "Balancer",
    feePercent: 0.0,
    chainIds: [1, 137, 42161],
    maxLiquidity: {
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "80000000000000",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F": "50000000000000",
    },
  },
];

const FLASH_LOAN_CONTRACT_ADDRESSES: Record<number, Record<string, string>> = {
  // Ethereum mainnet
  1: {
    "Aave V3": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    dYdX: "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e",
    "Uniswap V3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    Balancer: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  },
  // Additional chain IDs can be added here as needed, e.g.:
  // 10: { "Aave V3": "0x...", "Uniswap V3": "0x..." },
  // 137: { "Aave V3": "0x...", "Uniswap V3": "0x..." },
};

function buildFlashLoanTransaction(
  provider: FlashLoanProvider,
  chainId?: number
): SwapTransaction {
  const effectiveChainId =
    chainId ?? provider.chainIds[0] ?? 1;

  const addressesForChain =
    FLASH_LOAN_CONTRACT_ADDRESSES[effectiveChainId] ?? {};

  const to =
    addressesForChain[provider.name] ??
    "0x0000000000000000000000000000000000000000";

  return {
    to,
    // NOTE: Transaction data is a placeholder for simulation purposes.
    // In production, encode this using ABI encoding (e.g., ethers.js or viem)
    // to match the target contract's function selector and parameter layout.
    data: "0x",
    value: "0",
    gasLimit: "300000",
  };
}

export async function getFlashLoanQuotes(
  request: FlashLoanRequest
): Promise<BestFlashLoan> {
  const availableProviders = FLASH_LOAN_PROVIDERS.filter((p) =>
    p.chainIds.includes(request.chainId)
  );

  if (availableProviders.length === 0) {
    throw new Error(
      `No flash loan providers available on chain ${request.chainId}`
    );
  }

  const results: FlashLoanResult[] = availableProviders.map((provider) => {
    const amountBig = BigInt(request.amount);
    const feeBig =
      provider.feePercent > 0
        ? (amountBig * BigInt(Math.round(provider.feePercent * 1000))) /
          BigInt(100000)
        : BigInt(0);

    const maxLiq = provider.maxLiquidity[request.asset];
    const available = maxLiq ? BigInt(request.amount) <= BigInt(maxLiq) : true;

    return {
      provider: provider.name,
      asset: request.asset,
      amount: request.amount,
      fee: feeBig.toString(),
      feePercent: provider.feePercent,
      transaction: buildFlashLoanTransaction(provider),
      available,
    };
  });

  const available = results.filter((r) => r.available);
  const sorted = available.sort((a, b) => {
    const aFee = BigInt(a.fee);
    const bFee = BigInt(b.fee);
    return aFee < bFee ? -1 : aFee > bFee ? 1 : 0;
  });

  const best = sorted[0] ?? results[0];

  return { best, all: results };
}

export { FLASH_LOAN_PROVIDERS };
