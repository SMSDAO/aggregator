"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK_ACTIVITY = [
  { action: "API Quote Request", endpoint: "/api/quote", time: "2 min ago", status: "success" },
  { action: "API Quote Request", endpoint: "/api/quote", time: "15 min ago", status: "success" },
  { action: "Swap Executed", endpoint: "/api/swap", time: "1 hr ago", status: "success" },
  { action: "Flash Loan Query", endpoint: "/api/flashloan", time: "3 hr ago", status: "success" },
  { action: "Cross-chain Quote", endpoint: "/api/cross-chain-quote", time: "5 hr ago", status: "error" },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "info", message: "Your API key usage is at 75% of the free tier limit.", time: "1 hr ago" },
  { id: 2, type: "success", message: "Pro plan upgrade is available. Get 100x more requests.", time: "1 day ago" },
  { id: 3, type: "warning", message: "New rate limits will apply starting April 1st.", time: "2 days ago" },
];

const MOCK_USAGE = [
  { label: "Today", used: 42, limit: 100 },
  { label: "This week", used: 287, limit: 700 },
  { label: "This month", used: 753, limit: 1000 },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "notifications" | "settings">("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "activity" as const, label: "Activity" },
    { id: "notifications" as const, label: "Notifications", badge: MOCK_NOTIFICATIONS.length },
    { id: "settings" as const, label: "Account Settings" },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              User Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Welcome back. Here&apos;s your account overview.</p>
          </div>
          <Link
            href="/register"
            className="self-start sm:self-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto gap-1 mb-8 border-b border-gray-800 pb-px" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t-md ${
                activeTab === tab.id
                  ? "text-indigo-300 border-b-2 border-indigo-500 -mb-px"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.badge != null && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div id="panel-overview" role="tabpanel">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "API Requests (month)", value: "753", sub: "of 1,000 free", color: "text-indigo-400" },
                { label: "Active Plan", value: "Free", sub: "Upgrade available", color: "text-gray-300" },
                { label: "Avg Response Time", value: "142ms", sub: "Last 7 days", color: "text-green-400" },
                { label: "Success Rate", value: "98.7%", sub: "Last 30 days", color: "text-green-400" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-indigo-500/30 transition-colors"
                >
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Metered usage */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 mb-6">
              <h2 className="font-semibold text-lg mb-4">Metered Usage</h2>
              <div className="space-y-4">
                {MOCK_USAGE.map((item) => {
                  const pct = Math.round((item.used / item.limit) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-300">{item.label}</span>
                        <span className="text-gray-400">
                          {item.used.toLocaleString()} / {item.limit.toLocaleString()} requests
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${item.label}: ${pct}% used`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity preview */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent Activity</h2>
                <button
                  onClick={() => setActiveTab("activity")}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_ACTIVITY.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.endpoint}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === "success"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-red-900/40 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div id="panel-activity" role="tabpanel">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="font-semibold text-lg mb-4">API Activity Log</h2>
              <div className="space-y-2">
                {MOCK_ACTIVITY.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-800/50 last:border-0 gap-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.endpoint}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === "success"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-red-900/40 text-red-400"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div id="panel-notifications" role="tabpanel">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="font-semibold text-lg mb-4">Notifications</h2>
              <div className="space-y-3">
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-4 rounded-lg border ${
                      n.type === "warning"
                        ? "border-yellow-500/30 bg-yellow-900/10"
                        : n.type === "success"
                        ? "border-green-500/30 bg-green-900/10"
                        : "border-indigo-500/30 bg-indigo-900/10"
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">
                      {n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "ℹ️"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div id="panel-settings" role="tabpanel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account info */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
                <h2 className="font-semibold text-lg">Account Information</h2>
                {[
                  { label: "Display Name", value: "Developer", type: "text" },
                  { label: "Email Address", value: "dev@example.com", type: "email" },
                  { label: "API Key", value: "dex_xxxxxxxxxxxxxxxx", type: "password" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      readOnly={field.label === "API Key"}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 read-only:opacity-60"
                    />
                  </div>
                ))}
                <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors">
                  Save Changes
                </button>
              </div>

              {/* Plan & billing */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
                <h2 className="font-semibold text-lg">Plan & Billing</h2>
                <div className="rounded-lg bg-indigo-900/20 border border-indigo-500/30 p-4">
                  <p className="text-sm text-gray-300 mb-1">Current Plan</p>
                  <p className="text-2xl font-bold text-indigo-300">Free</p>
                  <p className="text-xs text-gray-500 mt-1">1,000 requests / month</p>
                </div>
                <div className="space-y-2">
                  <Link
                    href="/register"
                    className="block text-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
                  >
                    Upgrade to Pro — $49/mo
                  </Link>
                  <Link
                    href="/register"
                    className="block text-center py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-sm font-semibold transition-colors"
                  >
                    Contact for Enterprise
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
