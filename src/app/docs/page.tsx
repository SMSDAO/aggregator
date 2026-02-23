import Link from "next/link";

const sections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "quote", label: "GET /api/quote" },
  { id: "swap", label: "POST /api/swap" },
  { id: "flashloan", label: "POST /api/flashloan" },
  { id: "register", label: "POST /api/register" },
  { id: "sdk", label: "TypeScript SDK" },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto my-4">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 flex-shrink-0 border-r border-gray-800 py-12 px-4 sticky top-0 h-screen overflow-y-auto">
        <p className="text-xs font-semibold uppercase text-gray-500 mb-4 tracking-widest">
          Contents
        </p>
        <nav className="space-y-1">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block text-sm text-gray-400 hover:text-white py-1 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 space-y-16">
        <div>
          <h1 className="text-4xl font-extrabold mb-3">Documentation</h1>
          <p className="text-gray-400">
            Everything you need to integrate the Meta DEX Aggregator into your
            project.
          </p>
        </div>

        {/* Getting started */}
        <section id="getting-started">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            Getting Started
          </h2>
          <p className="text-gray-400 mb-4">
            The Meta DEX Aggregator exposes a simple REST API and a TypeScript
            SDK. Register for a free API key, then start querying best swap
            quotes across 1inch, 0x Protocol, Paraswap, and Uniswap.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>
              <Link href="/register" className="text-indigo-400 underline">
                Register
              </Link>{" "}
              to get a free API key.
            </li>
            <li>Include your key in the <code className="bg-gray-800 px-1 rounded">X-API-Key</code> header.</li>
            <li>Call <code className="bg-gray-800 px-1 rounded">/api/quote</code> to get the best price.</li>
            <li>Use the returned transaction to execute the swap.</li>
          </ol>
        </section>

        {/* Quote */}
        <section id="quote">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            GET /api/quote
          </h2>
          <p className="text-gray-400 mb-2">
            Fetch the best swap quote across all supported aggregators.
          </p>
          <h3 className="font-semibold text-gray-200 mb-2">Query Parameters</h3>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-1 pr-4">Param</th>
                <th className="text-left py-1 pr-4">Type</th>
                <th className="text-left py-1">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {[
                ["fromToken", "string", "Source token address"],
                ["toToken", "string", "Destination token address"],
                ["amount", "string", "Amount in wei (base units)"],
                ["chainId", "number", "EVM chain ID (e.g. 1 for Ethereum)"],
                ["slippage", "number?", "Slippage tolerance % (default 0.5)"],
              ].map(([p, t, d]) => (
                <tr key={p} className="border-b border-gray-800/50">
                  <td className="py-1.5 pr-4 font-mono text-indigo-300">{p}</td>
                  <td className="py-1.5 pr-4 text-gray-500">{t}</td>
                  <td className="py-1.5">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Code>{`GET /api/quote?fromToken=0xEeee...EEeE&toToken=0xA0b8...eB48&amount=1000000000000000000&chainId=1

// Response
{
  "aggregator": "1inch",
  "fromToken": { "symbol": "ETH", "decimals": 18, ... },
  "toToken": { "symbol": "USDC", "decimals": 6, ... },
  "fromAmount": "1000000000000000000",
  "toAmount": "1845230000",
  "estimatedGas": "150000",
  "priceImpact": 0.02,
  "savingsPercent": 0.3,
  "allQuotes": [ ... ]
}`}</Code>
        </section>

        {/* Swap */}
        <section id="swap">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            POST /api/swap
          </h2>
          <p className="text-gray-400 mb-4">
            Get an unsigned swap transaction ready to send with your wallet.
          </p>
          <Code>{`POST /api/swap
Content-Type: application/json

{
  "fromToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "toToken":   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amount":    "1000000000000000000",
  "chainId":   1,
  "fromAddress": "0xYourWalletAddress"
}

// Response
{
  "quote": { ... },
  "transaction": {
    "to": "0x1111111254EEB25477B68fb85Ed929f73A960582",
    "data": "0x12aa3caf...",
    "value": "0",
    "gasLimit": "150000"
  }
}`}</Code>
        </section>

        {/* Flash loan */}
        <section id="flashloan">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            POST /api/flashloan
          </h2>
          <p className="text-gray-400 mb-4">
            Compare flash loan offers from Aave V3, dYdX, Uniswap V3, and
            Balancer. Returns the cheapest available option.
          </p>
          <Code>{`POST /api/flashloan
Content-Type: application/json

{
  "asset":          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amount":         "1000000000000",
  "chainId":        1,
  "targetContract": "0xYourFlashLoanReceiverContract",
  "params":         "0x"
}

// Response
{
  "best": {
    "provider": "dYdX",
    "fee": "0",
    "feePercent": 0,
    "available": true,
    "transaction": { ... }
  },
  "all": [ ... ]
}`}</Code>
        </section>

        {/* Register */}
        <section id="register">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            POST /api/register
          </h2>
          <p className="text-gray-400 mb-4">
            Register as a developer to receive an API key.
          </p>
          <Code>{`POST /api/register
Content-Type: application/json

{
  "name":        "Alice Chen",
  "email":       "alice@defi.io",
  "projectName": "YieldFarm Pro",
  "useCase":     "Yield optimization"
}

// Response
{
  "apiKey": "agg_...",
  "plan": "free",
  "message": "Registration successful! ..."
}`}</Code>
        </section>

        {/* SDK */}
        <section id="sdk">
          <h2 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">
            TypeScript SDK
          </h2>
          <p className="text-gray-400 mb-4">
            Import the library directly for server-side or Node.js usage.
          </p>
          <Code>{`import { getQuotes, getFlashLoanQuotes } from "@/lib";

// Best swap quote
const best = await getQuotes({
  fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  toToken:   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  amount:    "1000000000000000000",
  chainId:   1,
});

// Flash loan quotes
const flash = await getFlashLoanQuotes({
  asset:          "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  amount:         "1000000000000",
  chainId:        1,
  targetContract: "0xYourContract",
  params:         "0x",
});

console.log(flash.best.provider, flash.best.feePercent);`}</Code>

          <h3 className="font-semibold text-gray-200 mt-6 mb-2">
            Supported Chains
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 1, name: "Ethereum" },
              { id: 10, name: "Optimism" },
              { id: 56, name: "BNB Chain" },
              { id: 137, name: "Polygon" },
              { id: 8453, name: "Base" },
              { id: 42161, name: "Arbitrum" },
              { id: 43114, name: "Avalanche" },
            ].map((c) => (
              <span
                key={c.id}
                className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300"
              >
                {c.name} ({c.id})
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
