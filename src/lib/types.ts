export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name?: string;
  logoURI?: string;
}

export interface QuoteRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  chainId: number;
  slippage?: number;
  aggregators?: string[];
}

export interface QuoteResult {
  aggregator: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  priceImpact: number;
  route: RouteStep[];
  protocols: string[];
  fee?: number;
}

export interface RouteStep {
  protocol: string;
  poolAddress: string;
  fromToken: string;
  toToken: string;
  share: number;
}

export interface BestQuote extends QuoteResult {
  savings: string;
  savingsPercent: number;
  allQuotes: QuoteResult[];
}

export interface SwapRequest extends QuoteRequest {
  fromAddress: string;
  receiver?: string;
}

export interface SwapTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice?: string;
}

export interface SwapResult {
  quote: QuoteResult;
  transaction: SwapTransaction;
  simulationResult?: SimulationResult;
}

/**
 * Reserved for future onchain simulation support.
 * To implement: integrate with Tenderly simulation API or use eth_call
 * against a forked chain state (e.g. via Hardhat/Anvil) and populate
 * this from the response. Set `simulationResult` on `SwapResult` to expose it.
 */
export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  revertReason?: string;
  outputAmount: string;
}

export interface FlashLoanRequest {
  asset: string;
  amount: string;
  chainId: number;
  targetContract: string;
  params: string;
  provider?: string;
}

export interface FlashLoanResult {
  provider: string;
  asset: string;
  amount: string;
  fee: string;
  feePercent: number;
  transaction: SwapTransaction;
  available: boolean;
}

export interface BestFlashLoan {
  best: FlashLoanResult;
  all: FlashLoanResult[];
}

export interface AggregatorConfig {
  apiKey?: string;
  chainId?: number;
  timeout?: number;
  simulateOnchain?: boolean;
}

export interface DeveloperRegistration {
  name: string;
  email: string;
  projectName: string;
  useCase: string;
}

export interface ApiKey {
  key: string;
  name: string;
  email: string;
  projectName: string;
  useCase: string;
  createdAt: string;
  requests: number;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  totalVolume: string;
  activeAggregators: string[];
  topPairs: Array<{ pair: string; volume: string; requests: number }>;
  recentRegistrations: ApiKey[];
}

/** A request to swap tokens across two different chains. */
export interface CrossChainQuoteRequest {
  /** Source chain ID (e.g. 1 for Ethereum). */
  fromChainId: number;
  /** Destination chain ID (e.g. 137 for Polygon). */
  toChainId: number;
  /** Token address on the source chain. */
  fromToken: string;
  /** Token address on the destination chain. */
  toToken: string;
  /** Amount in the smallest unit of the source token. */
  amount: string;
  /** Sender wallet address. */
  fromAddress: string;
  /** Recipient wallet address (defaults to fromAddress). */
  toAddress?: string;
  /** Maximum acceptable slippage in percent (e.g. 0.5 = 0.5%). */
  slippage?: number;
  /** Optionally restrict which cross-chain aggregators to query. */
  aggregators?: string[];
}

/** A single cross-chain quote from one aggregator/bridge. */
export interface CrossChainQuoteResult {
  /** Name of the cross-chain aggregator (e.g. "Li.Fi", "Socket", "Squid"). */
  aggregator: string;
  fromChainId: number;
  toChainId: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  /** Expected output amount on the destination chain. */
  toAmount: string;
  /** Bridge / protocol used for the cross-chain transfer leg. */
  bridgeUsed: string;
  /** DEX protocol used for any on-chain swap leg. */
  dexUsed?: string;
  /** Estimated time for the full cross-chain transfer, in seconds. */
  estimatedTimeSeconds: number;
  /** Total gas estimate across all chains (source + bridge). */
  estimatedGas: string;
  /** Total fee in USD charged by the bridge/aggregator. */
  feesUsd: string;
  /** Transaction calldata to execute the swap/bridge on the source chain. */
  transaction: SwapTransaction;
}

/** The best cross-chain quote plus all alternatives for comparison. */
export interface BestCrossChainQuote extends CrossChainQuoteResult {
  /** Savings vs the worst quote, in destination-token base units. */
  savings: string;
  /** Savings as a percentage over the worst quote. */
  savingsPercent: number;
  allQuotes: CrossChainQuoteResult[];
}

