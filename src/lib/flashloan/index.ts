import type {
  FlashLoanRequest,
  FlashLoanResult,
  BestFlashLoan,
  SwapTransaction,
} from "../types";

interface FlashLoanProvider {
  name: string;
  /** Fee expressed in basis points (1 bp = 0.01%). E.g. 5 = 0.05%. */
  feeBasisPoints: number;
  maxLiquidity: Record<string, string>;
  chainIds: number[];
}

const FLASH_LOAN_PROVIDERS: FlashLoanProvider[] = [
  {
    name: "Aave V3",
    feeBasisPoints: 5,
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
    feeBasisPoints: 0,
    chainIds: [1],
    maxLiquidity: {
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "100000000000000",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "50000000000000000000000",
    },
  },
  {
    name: "Uniswap V3",
    feeBasisPoints: 5,
    chainIds: [1, 10, 137, 42161, 8453],
    maxLiquidity: {},
  },
  {
    name: "Balancer",
    feeBasisPoints: 0,
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
  10: {
    "Aave V3": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "Uniswap V3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  },
  137: {
    "Aave V3": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "Uniswap V3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    Balancer: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  },
  42161: {
    "Aave V3": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "Uniswap V3": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    Balancer: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
  },
  43114: {
    "Aave V3": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  },
  8453: {
    "Aave V3": "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    "Uniswap V3": "0x2626664c2603336E57B271c5C0b26F421741e481",
  },
};

function buildFlashLoanTransaction(
  provider: FlashLoanProvider,
  chainId: number,
  request: FlashLoanRequest
): SwapTransaction {
  const addressesForChain =
    FLASH_LOAN_CONTRACT_ADDRESSES[chainId] ?? {};

  const to =
    addressesForChain[provider.name] ??
    "0x0000000000000000000000000000000000000000";

  // Transaction data must be ABI-encoded using a library such as ethers.js or viem.
  // Each protocol uses a different function signature:
  //
  // Aave V3:
  //   flashLoan(address receiverAddress, address[] assets, uint256[] amounts,
  //             uint256[] interestRateModes, address onBehalfOf, bytes params, uint16 referralCode)
  //   e.g. interface.encodeFunctionData("flashLoan", [request.targetContract, [request.asset],
  //         [request.amount], [0], request.targetContract, request.params, 0])
  //
  // dYdX:
  //   operate(AccountInfo[] accounts, ActionArgs[] actions)  — wraps a Withdraw + Call + Deposit
  //
  // Uniswap V3:
  //   flash(address recipient, uint256 amount0, uint256 amount1, bytes data)
  //   e.g. interface.encodeFunctionData("flash", [request.targetContract, request.amount, 0, request.params])
  //
  // Balancer:
  //   flashLoan(address recipient, IERC20[] tokens, uint256[] amounts, bytes userData)
  //   e.g. interface.encodeFunctionData("flashLoan", [request.targetContract, [request.asset],
  //         [request.amount], request.params])
  const data = "0x"; // Replace with ABI-encoded calldata for the selected provider (see above).

  return {
    to,
    data,
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
    // Use integer basis-point arithmetic to avoid floating-point precision issues.
    const feeBig =
      provider.feeBasisPoints > 0
        ? (amountBig * BigInt(provider.feeBasisPoints)) / BigInt(10000)
        : BigInt(0);

    const maxLiq = provider.maxLiquidity[request.asset];
    const available =
      maxLiq !== undefined && maxLiq !== null
        ? BigInt(request.amount) <= BigInt(maxLiq)
        : false;

    return {
      provider: provider.name,
      asset: request.asset,
      amount: request.amount,
      fee: feeBig.toString(),
      feePercent: provider.feeBasisPoints / 100,
      transaction: buildFlashLoanTransaction(provider, request.chainId, request),
      available,
    };
  });

  const available = results.filter((r) => r.available);

  if (available.length === 0) {
    throw new Error(
      `No flash loan providers with sufficient liquidity for asset ${request.asset} on chain ${request.chainId}`
    );
  }

  const sorted = available.sort((a, b) => {
    const aFee = BigInt(a.fee);
    const bFee = BigInt(b.fee);
    return aFee < bFee ? -1 : aFee > bFee ? 1 : 0;
  });

  const best = sorted[0];

  return { best, all: results };
}

export { FLASH_LOAN_PROVIDERS };
