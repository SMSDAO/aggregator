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
