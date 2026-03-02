import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-gray-950 text-white min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-gray-950 to-purple-900/20 pointer-events-none" />
        <span className="relative z-10 mb-4 inline-block rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1 text-sm text-indigo-400">
          Open Source · Multi-Chain · Trustless
        </span>
        <h1 className="relative z-10 text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Meta DEX{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Aggregator
          </span>
        </h1>
        <p className="relative z-10 max-w-2xl text-lg md:text-xl text-gray-400 mb-10">
          Compare quotes from 1inch, 0x Protocol, ParaSwap, and Uniswap in a
          single API call. Get the best price every time — with flash loan
          support built in.
        </p>
        <div className="relative z-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors"
          >
            Get API Key
          </Link>
          <Link
            href="/docs"
            className="px-8 py-3 rounded-lg border border-gray-700 hover:border-gray-500 font-semibold transition-colors"
          >
            Read the Docs
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to build on DeFi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "💰",
              title: "Better Prices",
              desc: "Aggregates liquidity from 4+ DEX protocols to guarantee the best output amount.",
            },
            {
              icon: "📉",
              title: "Reduced Slippage",
              desc: "Smart order splitting across multiple pools minimizes price impact on large trades.",
            },
            {
              icon: "⚡",
              title: "Flash Loans",
              desc: "Access flash loans from Aave V3, dYdX, Uniswap V3, and Balancer — lowest fee wins.",
            },
            {
              icon: "🔓",
              title: "Open Source",
              desc: "Fully auditable TypeScript library. Fork it, embed it, extend it.",
            },
            {
              icon: "🚫",
              title: "No Middlemen",
              desc: "Your wallet. Your keys. Transactions go directly to DEX contracts.",
            },
            {
              icon: "🔬",
              title: "Onchain Simulation",
              desc: "Simulate swaps before broadcasting to catch reverts and estimate exact gas.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-900/40 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <ol className="space-y-8">
            {[
              {
                step: "1",
                title: "Submit a quote request",
                desc: "Send fromToken, toToken, amount, and chainId to /api/quote.",
              },
              {
                step: "2",
                title: "Parallel aggregator queries",
                desc: "The library fans out requests to 1inch, 0x, ParaSwap, and Uniswap simultaneously.",
              },
              {
                step: "3",
                title: "Best quote returned",
                desc: "Results are ranked by output amount. The best quote plus full comparison is returned.",
              },
              {
                step: "4",
                title: "Execute the swap",
                desc: "Pass the returned transaction object directly to your wallet provider.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Quick start */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Quick Start</h2>
        <p className="text-center text-gray-400 mb-8">
          Integrate in minutes with our REST API or TypeScript SDK.
        </p>
        <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-950">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500">quote.ts</span>
          </div>
          <pre className="p-6 text-sm text-gray-300 overflow-x-auto">
            <code>{`import { getQuotes } from "@dex-aggregator/sdk";

const best = await getQuotes({
  fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  toToken:   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  amount:    "1000000000000000000", // 1 ETH
  chainId:   1,
});

console.log(\`Best aggregator: \${best.aggregator}\`);
console.log(\`You receive:    \${best.toAmount} USDC\`);
console.log(\`Savings vs worst: \${best.savingsPercent.toFixed(2)}%\`);`}</code>
          </pre>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-900/40 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "/month",
                requests: "1,000 requests",
                features: ["All aggregators", "Flash loan queries", "REST API access", "Community support"],
                cta: "Get Started",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$49",
                period: "/month",
                requests: "100,000 requests",
                features: ["Everything in Free", "Priority routing", "Webhook notifications", "Email support"],
                cta: "Start Pro",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                requests: "Unlimited requests",
                features: ["Everything in Pro", "Dedicated infrastructure", "SLA guarantee", "Slack support"],
                cta: "Contact Us",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-indigo-500 bg-indigo-900/20"
                    : "border-gray-800 bg-gray-900/50"
                }`}
              >
                {plan.highlight && (
                  <span className="self-start mb-3 text-xs font-semibold bg-indigo-600 rounded-full px-3 py-1">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-indigo-400 mb-4">{plan.requests}</p>
                <ul className="space-y-2 text-sm text-gray-400 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`text-center py-2 rounded-lg font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-indigo-600 hover:bg-indigo-500"
                      : "border border-gray-700 hover:border-gray-500"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
        <p className="text-gray-400 mb-8">
          Join hundreds of developers using the Meta DEX Aggregator.
        </p>
        <Link
          href="/register"
          className="inline-block px-10 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-lg transition-colors"
        >
          Get your free API key →
        </Link>
      </section>
    </main>
  );
}
