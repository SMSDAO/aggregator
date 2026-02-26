/**
 * Centralized configuration module.
 *
 * Reads environment variables at call time so that Vercel dashboard changes
 * are picked up without a redeployment. Provides typed helpers and a
 * `validateConfig` function for startup health checks.
 */

export interface AppConfig {
  /** Postgres connection string. Undefined → in-memory store. */
  databaseUrl: string | undefined;
  /** Bearer token for the admin dashboard. Undefined → admin disabled. */
  adminToken: string | undefined;
  /** Platform fee in basis points (0–10000). Default: 10. */
  platformFeeBps: number;
  /** EVM wallet address that receives the platform fee. */
  platformFeeRecipient: string | null;
  /** 1inch API key. Undefined → 1inch quotes skipped. */
  oneInchApiKey: string | undefined;
  /** 0x API key. Undefined → 0x quotes skipped. */
  zeroExApiKey: string | undefined;
}

/** Returns the current application configuration read from environment variables. */
export function getConfig(): AppConfig {
  const rawBps = process.env.PLATFORM_FEE_BPS;
  const parsedBps = rawBps ? parseInt(rawBps, 10) : NaN;
  const platformFeeBps =
    !isNaN(parsedBps) && parsedBps >= 0 ? parsedBps : 10;

  return {
    databaseUrl: process.env.DATABASE_URL || undefined,
    adminToken: process.env.ADMIN_TOKEN || undefined,
    platformFeeBps,
    platformFeeRecipient: process.env.PLATFORM_FEE_RECIPIENT || null,
    oneInchApiKey: process.env.ONEINCH_API_KEY || undefined,
    zeroExApiKey: process.env.ZEROX_API_KEY || undefined,
  };
}

export interface ConfigWarning {
  key: string;
  message: string;
}

/**
 * Validates the current configuration and returns a list of warnings.
 * Non-fatal issues are surfaced as warnings; no exceptions are thrown.
 */
export function validateConfig(): ConfigWarning[] {
  const cfg = getConfig();
  const warnings: ConfigWarning[] = [];

  if (!cfg.databaseUrl) {
    warnings.push({
      key: "DATABASE_URL",
      message: "Not set — using in-memory store (data lost on restart, not suitable for production).",
    });
  }

  if (!cfg.adminToken) {
    warnings.push({
      key: "ADMIN_TOKEN",
      message: "Not set — admin dashboard is disabled.",
    });
  }

  if (!cfg.platformFeeRecipient) {
    warnings.push({
      key: "PLATFORM_FEE_RECIPIENT",
      message: "Not set — platform fees are calculated but no recipient is configured.",
    });
  }

  if (!cfg.oneInchApiKey) {
    warnings.push({
      key: "ONEINCH_API_KEY",
      message: "Not set — 1inch quotes will be skipped.",
    });
  }

  if (!cfg.zeroExApiKey) {
    warnings.push({
      key: "ZEROX_API_KEY",
      message: "Not set — 0x Protocol quotes will be skipped.",
    });
  }

  return warnings;
}
