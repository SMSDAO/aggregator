"use client";

import { useState, useEffect } from "react";
import type { AdminStats } from "@/lib";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSignOut() {
    setStats(null);
    setToken("");
    sessionStorage.removeItem("admin_token");
  }

  async function fetchStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to fetch stats");
        setStats(null);
      } else {
        setStats((await res.json()) as AdminStats);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("admin_token", token);
    fetchStats();
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8">Admin Dashboard</h1>

        {!stats && (
          <form
            onSubmit={handleLogin}
            className="max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 space-y-4"
          >
            <label htmlFor="admin-token" className="font-semibold text-lg">Authenticate</label>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? "Loading…" : "View Stats"}
            </button>
          </form>
        )}

        {stats && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Users", value: stats.totalUsers.toLocaleString() },
                { label: "Total Requests", value: stats.totalRequests.toLocaleString() },
                { label: "Total Volume", value: stats.totalVolume },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6"
                >
                  <p className="text-gray-400 text-sm mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Active aggregators */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Active Aggregators</h2>
              <div className="flex flex-wrap gap-3">
                {stats.activeAggregators.map((agg) => (
                  <span
                    key={agg}
                    className="px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-sm"
                  >
                    {agg}
                  </span>
                ))}
              </div>
            </div>

            {/* Top pairs */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 overflow-x-auto">
              <h2 className="font-semibold text-lg mb-4">Top Trading Pairs</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Pair</th>
                    <th className="text-right py-2 pr-4">Volume</th>
                    <th className="text-right py-2">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topPairs.map((p) => (
                    <tr
                      key={p.pair}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="py-2 pr-4 font-medium">{p.pair}</td>
                      <td className="py-2 pr-4 text-right text-green-400">
                        {p.volume}
                      </td>
                      <td className="py-2 text-right text-gray-300">
                        {p.requests.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent registrations */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-x-auto">
              <h2 className="font-semibold text-lg mb-4">
                Recent Registrations
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Project</th>
                    <th className="text-left py-2 pr-4">Plan</th>
                    <th className="text-right py-2">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentRegistrations.map((r) => (
                    <tr
                      key={r.key}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="py-2 pr-4">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-gray-500 text-xs">{r.email}</p>
                      </td>
                      <td className="py-2 pr-4 text-gray-300">
                        {r.projectName}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.plan === "pro"
                              ? "bg-indigo-900/50 text-indigo-300"
                              : r.plan === "enterprise"
                              ? "bg-purple-900/50 text-purple-300"
                              : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {r.plan}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-300">
                        {r.requests.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 text-sm text-gray-500 hover:text-gray-300"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
