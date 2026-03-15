"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    usageAlerts: true,
    planExpiry: true,
    newFeatures: false,
    securityAlerts: true,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your account preferences and notifications.</p>
        </div>

        <div className="space-y-6">
          {/* Profile settings */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="font-semibold text-lg mb-4">Profile</h2>
            <div className="space-y-4">
              {[
                { id: "s-name", label: "Display Name", type: "text", placeholder: "Your Name", value: "Developer" },
                { id: "s-email", label: "Email Address", type: "email", placeholder: "you@example.com", value: "dev@example.com" },
              ].map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-sm text-gray-400 mb-1">{field.label}</label>
                  <input
                    id={field.id}
                    type={field.type}
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* API settings */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="font-semibold text-lg mb-4">API Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="s-apikey" className="block text-sm text-gray-400 mb-1">API Key</label>
                <div className="flex gap-2">
                  <input
                    id="s-apikey"
                    type="password"
                    defaultValue="dex_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white opacity-60 focus:outline-none"
                  />
                  <button className="px-4 py-2.5 rounded-lg border border-gray-700 hover:border-red-500 text-sm text-gray-400 hover:text-red-400 transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="s-webhook" className="block text-sm text-gray-400 mb-1">Webhook URL (optional)</label>
                <input
                  id="s-webhook"
                  type="url"
                  placeholder="https://yourapp.com/webhook"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </section>

          {/* Notification preferences */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <h2 className="font-semibold text-lg mb-4">Notifications</h2>
            <div className="space-y-3">
              {(Object.keys(notifications) as (keyof typeof notifications)[]).map((key) => {
                const labels: Record<keyof typeof notifications, string> = {
                  usageAlerts: "Usage threshold alerts",
                  planExpiry: "Plan expiry reminders",
                  newFeatures: "New feature announcements",
                  securityAlerts: "Security alerts",
                };
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-300">{labels[key]}</span>
                    <button
                      role="switch"
                      aria-checked={notifications[key]}
                      onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        notifications[key] ? "bg-indigo-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          notifications[key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Danger zone */}
          <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-6">
            <h2 className="font-semibold text-lg text-red-400 mb-4">Danger Zone</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account and all associated data.</p>
              </div>
              <button className="self-start sm:self-auto px-4 py-2 rounded-lg border border-red-500/50 hover:bg-red-900/30 text-red-400 text-sm font-semibold transition-colors">
                Delete Account
              </button>
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all"
            >
              {saved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
