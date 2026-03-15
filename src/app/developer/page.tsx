"use client";

import { useState } from "react";

const MOCK_ENDPOINTS = [
  { path: "/api/quote", method: "GET/POST", requests: 8432, latency: "142ms", errors: 12, status: "healthy" },
  { path: "/api/swap", method: "POST", requests: 2134, latency: "198ms", errors: 3, status: "healthy" },
  { path: "/api/flashloan", method: "POST", requests: 543, latency: "87ms", errors: 0, status: "healthy" },
  { path: "/api/register", method: "POST", requests: 312, latency: "234ms", errors: 1, status: "healthy" },
  { path: "/api/cross-chain-quote", method: "POST", requests: 89, latency: "410ms", errors: 8, status: "degraded" },
  { path: "/api/health", method: "GET", requests: 1203, latency: "12ms", errors: 0, status: "healthy" },
];

const MOCK_LOGS = [
  { level: "INFO", ts: "2026-03-15T02:41:00Z", msg: "GET /api/health → 200 (12ms)" },
  { level: "INFO", ts: "2026-03-15T02:40:50Z", msg: "POST /api/quote → 200 (156ms) aggregator=1inch" },
  { level: "WARN", ts: "2026-03-15T02:40:30Z", msg: "POST /api/cross-chain-quote → 504 (timeout) retrying..." },
  { level: "INFO", ts: "2026-03-15T02:40:10Z", msg: "POST /api/swap → 200 (192ms) fromToken=ETH toToken=USDC" },
  { level: "ERROR", ts: "2026-03-15T02:39:55Z", msg: "POST /api/cross-chain-quote → 500 external_api_error" },
  { level: "INFO", ts: "2026-03-15T02:39:40Z", msg: "POST /api/flashloan → 200 (82ms) provider=aave best_fee=0.09%" },
  { level: "INFO", ts: "2026-03-15T02:39:20Z", msg: "POST /api/register → 201 created email=dev@example.com" },
  { level: "DEBUG", ts: "2026-03-15T02:39:00Z", msg: "Config validated: 2 warnings (ONEINCH_API_KEY, ZEROX_API_KEY unset)" },
];

const ENV_VARS = [
  { key: "DATABASE_URL", set: false, required: true },
  { key: "ADMIN_TOKEN", set: true, required: true },
  { key: "PLATFORM_FEE_BPS", set: true, required: false },
  { key: "PLATFORM_FEE_RECIPIENT", set: false, required: false },
  { key: "ONEINCH_API_KEY", set: false, required: false },
  { key: "ZEROX_API_KEY", set: false, required: false },
];

const DEPLOY_CHECKS = [
  { check: "TypeScript compilation", status: "pass" },
  { check: "ESLint", status: "pass" },
  { check: "Next.js build", status: "pass" },
  { check: "Environment variables", status: "warn", detail: "DATABASE_URL not set" },
  { check: "Database connection", status: "warn", detail: "Using in-memory fallback" },
  { check: "External APIs (1inch)", status: "warn", detail: "ONEINCH_API_KEY not set" },
  { check: "External APIs (0x)", status: "warn", detail: "ZEROX_API_KEY not set" },
];

type Tab = "monitoring" | "logs" | "env" | "deploy";
type LogLevel = "ALL" | "INFO" | "WARN" | "ERROR" | "DEBUG";

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [logLevel, setLogLevel] = useState<LogLevel>("ALL");

  const tabs: { id: Tab; label: string }[] = [
    { id: "monitoring", label: "API Monitoring" },
    { id: "logs", label: "Log Viewer" },
    { id: "env", label: "Environment" },
    { id: "deploy", label: "Deployment Diagnostics" },
  ];

  const filteredLogs = logLevel === "ALL" ? MOCK_LOGS : MOCK_LOGS.filter((l) => l.level === logLevel);

  const logColors: Record<string, string> = {
    INFO: "text-blue-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    DEBUG: "text-gray-500",
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Developer Dashboard
          </h1>
          <p className="text-gray-400 mt-1">API monitoring, logs, environment, and deployment diagnostics.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto gap-1 mb-8 border-b border-gray-800 pb-px" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`dev-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t-md ${
                activeTab === tab.id
                  ? "text-blue-300 border-b-2 border-blue-500 -mb-px"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* API Monitoring */}
        {activeTab === "monitoring" && (
          <div id="dev-panel-monitoring" role="tabpanel">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Requests (24h)", value: MOCK_ENDPOINTS.reduce((a, e) => a + e.requests, 0).toLocaleString() },
                { label: "Total Errors (24h)", value: MOCK_ENDPOINTS.reduce((a, e) => a + e.errors, 0).toString() },
                { label: "Avg Latency", value: "197ms" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-blue-300">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Endpoint</th>
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-right px-4 py-3">Requests</th>
                    <th className="text-right px-4 py-3">Avg Latency</th>
                    <th className="text-right px-4 py-3">Errors</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ENDPOINTS.map((ep) => (
                    <tr key={ep.path} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20">
                      <td className="px-4 py-3 font-mono text-xs text-blue-300">{ep.path}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{ep.method}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{ep.requests.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{ep.latency}</td>
                      <td className={`px-4 py-3 text-right ${ep.errors > 0 ? "text-red-400" : "text-gray-500"}`}>
                        {ep.errors}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${
                          ep.status === "healthy" ? "text-green-400" : "text-yellow-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ep.status === "healthy" ? "bg-green-400" : "bg-yellow-400"
                          }`} />
                          {ep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Log Viewer */}
        {activeTab === "logs" && (
          <div id="dev-panel-logs" role="tabpanel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-lg">Application Logs</h2>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value as LogLevel)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Filter log level"
              >
                {(["ALL", "INFO", "WARN", "ERROR", "DEBUG"] as LogLevel[]).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/50 p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <p className="text-gray-500">No logs at this level.</p>
              ) : (
                filteredLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 py-1 border-b border-gray-900 last:border-0">
                    <span className="text-gray-600 flex-shrink-0">{log.ts.replace("T", " ").replace("Z", "")}</span>
                    <span className={`font-bold flex-shrink-0 w-12 ${logColors[log.level] ?? "text-gray-400"}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-300 break-all">{log.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Environment Management */}
        {activeTab === "env" && (
          <div id="dev-panel-env" role="tabpanel">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="font-semibold text-lg mb-2">Environment Variables</h2>
              <p className="text-sm text-gray-500 mb-6">
                Set these in your Vercel project settings or <code className="text-indigo-300">.env.local</code> file.
                Never commit secrets to source control.
              </p>
              <div className="space-y-3">
                {ENV_VARS.map((v) => (
                  <div
                    key={v.key}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-950 border border-gray-800"
                  >
                    <div>
                      <p className="font-mono text-sm text-white">{v.key}</p>
                      {v.required && <p className="text-xs text-gray-500">required</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      v.set
                        ? "bg-green-900/40 text-green-400"
                        : v.required
                        ? "bg-red-900/40 text-red-400"
                        : "bg-gray-800 text-gray-500"
                    }`}>
                      {v.set ? "SET" : "NOT SET"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deployment Diagnostics */}
        {activeTab === "deploy" && (
          <div id="dev-panel-deploy" role="tabpanel">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h2 className="font-semibold text-lg mb-6">Deployment Diagnostics</h2>
              <div className="space-y-3">
                {DEPLOY_CHECKS.map((c) => (
                  <div
                    key={c.check}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-950 border border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.check}</p>
                      {c.detail && <p className="text-xs text-gray-500">{c.detail}</p>}
                    </div>
                    <span className={`text-xs flex items-center gap-1.5 font-semibold ${
                      c.status === "pass"
                        ? "text-green-400"
                        : c.status === "warn"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}>
                      {c.status === "pass" ? "✓ Pass" : c.status === "warn" ? "⚠ Warn" : "✗ Fail"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
