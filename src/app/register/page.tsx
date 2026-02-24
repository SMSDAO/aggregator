"use client";

import { useState } from "react";

const USE_CASES = [
  "Arbitrage trading",
  "Yield optimization",
  "Portfolio rebalancing",
  "Wallet integration",
  "DeFi analytics",
  "Bot / automation",
  "Other",
];

interface RegistrationResponse {
  apiKey?: string;
  plan?: string;
  message?: string;
  error?: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectName: "",
    useCase: USE_CASES[0],
  });
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as RegistrationResponse;
      setResult(data);
    } catch {
      setResult({ error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-extrabold mb-2 text-center">
          Get your API Key
        </h1>
        <p className="text-gray-400 text-center mb-10">
          Free tier includes 1,000 requests/month. No credit card required.
        </p>

        {result?.apiKey ? (
          <div className="rounded-xl border border-green-500/40 bg-green-900/20 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re registered!</h2>
            <p className="text-gray-400 mb-6">{result.message}</p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-indigo-300 text-sm break-all mb-4">
              {result.apiKey}
            </div>
            <p className="text-xs text-yellow-400">
              ⚠ Save this key now — it won&apos;t be shown again.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-5"
          >
            {result?.error && (
              <div className="rounded-lg bg-red-900/30 border border-red-500/40 px-4 py-3 text-red-300 text-sm">
                {result.error}
              </div>
            )}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Alice Chen"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="alice@defi.io"
              />
            </div>
            <div>
              <label htmlFor="reg-project" className="block text-sm font-medium text-gray-300 mb-1">
                Project Name
              </label>
              <input
                id="reg-project"
                type="text"
                required
                value={form.projectName}
                onChange={(e) =>
                  setForm({ ...form, projectName: e.target.value })
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="YieldFarm Pro"
              />
            </div>
            <div>
              <label htmlFor="reg-usecase" className="block text-sm font-medium text-gray-300 mb-1">
                Use Case
              </label>
              <select
                id="reg-usecase"
                value={form.useCase}
                onChange={(e) => setForm({ ...form, useCase: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {USE_CASES.map((uc) => (
                  <option key={uc} value={uc}>
                    {uc}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? "Registering…" : "Register & Get API Key"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
