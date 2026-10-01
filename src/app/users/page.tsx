"use client";

import { useState } from "react";
import Link from "next/link";

const MOCK_USERS = [
  { id: "1", name: "Alice Chen", email: "alice@defi.io", plan: "pro", role: "Developer", requests: 24531, status: "active", joined: "Jan 12, 2026" },
  { id: "2", name: "Bob Smith", email: "bob@yield.finance", plan: "free", role: "User", requests: 843, status: "active", joined: "Feb 3, 2026" },
  { id: "3", name: "Carol Dev", email: "carol@dex.build", plan: "enterprise", role: "Admin", requests: 102400, status: "active", joined: "Dec 1, 2025" },
  { id: "4", name: "Dave Quant", email: "dave@quant.trade", plan: "pro", role: "Developer", requests: 51200, status: "inactive", joined: "Nov 20, 2025" },
  { id: "5", name: "Eve Monitor", email: "eve@audit.io", plan: "free", role: "Auditor", requests: 312, status: "active", joined: "Mar 1, 2026" },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-purple-900/40 text-purple-300",
  Developer: "bg-blue-900/40 text-blue-300",
  User: "bg-gray-800 text-gray-300",
  Auditor: "bg-yellow-900/40 text-yellow-300",
};

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-purple-900/50 text-purple-300",
  pro: "bg-indigo-900/50 text-indigo-300",
  free: "bg-gray-800 text-gray-400",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Users
            </h1>
            <p className="text-gray-400 mt-1">Registered API key holders and their access levels.</p>
          </div>
          <Link
            href="/admin"
            className="self-start sm:self-auto px-4 py-2 rounded-lg border border-gray-700 hover:border-indigo-500 text-sm font-semibold transition-colors"
          >
            Admin Panel →
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: MOCK_USERS.length },
            { label: "Active", value: MOCK_USERS.filter((u) => u.status === "active").length },
            { label: "Pro / Enterprise", value: MOCK_USERS.filter((u) => u.plan !== "free").length },
            { label: "Admins", value: MOCK_USERS.filter((u) => u.role === "Admin").length },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-indigo-300">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Developer">Developer</option>
            <option value="User">User</option>
            <option value="Auditor">Auditor</option>
          </select>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-right px-4 py-3">Requests</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-gray-800 text-gray-400"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[user.plan] ?? "bg-gray-800 text-gray-400"}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
                      {user.requests.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${user.status === "active" ? "text-green-400" : "text-gray-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-400" : "bg-gray-500"}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{user.joined}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
