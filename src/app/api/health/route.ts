import { NextResponse } from "next/server";
import { getConfig, validateConfig } from "@/lib/config";

/**
 * GET /api/health
 *
 * Returns the current application health status and configuration summary.
 * Safe to expose publicly — no secrets are included in the response.
 */
export async function GET() {
  const cfg = getConfig();
  const warnings = validateConfig();

  const aggregators = {
    "1inch": !!cfg.oneInchApiKey,
    "0x Protocol": !!cfg.zeroExApiKey,
    Paraswap: true, // no API key required
  };

  const status = warnings.some((w) =>
    ["DATABASE_URL", "ADMIN_TOKEN"].includes(w.key)
  )
    ? "degraded"
    : "ok";

  return NextResponse.json({
    status,
    store: cfg.databaseUrl ? "postgres" : "memory",
    adminEnabled: !!cfg.adminToken,
    platformFeeBps: cfg.platformFeeBps,
    aggregators,
    warnings: warnings.map((w) => ({ key: w.key, message: w.message })),
    timestamp: new Date().toISOString(),
  });
}
