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
  /**
   * Raw value of PLATFORM_FEE_BPS from the environment.
   * Stored alongside the parsed value so validateConfig() can include it
   * in warning messages without re-reading process.env.
   */
  platformFeeBpsRaw: string | undefined;
}

/** Returns the current application configuration read from environment variables. */
export function getConfig(): AppConfig {
  const rawBps = process.env.PLATFORM_FEE_BPS;
  const { value: platformFeeBps } = parsePlatformFeeBps(rawBps);

  return {
    databaseUrl: process.env.DATABASE_URL || undefined,
    adminToken: process.env.ADMIN_TOKEN || undefined,
    platformFeeBps,
    platformFeeRecipient: process.env.PLATFORM_FEE_RECIPIENT || null,
    oneInchApiKey: process.env.ONEINCH_API_KEY || undefined,
    zeroExApiKey: process.env.ZEROX_API_KEY || undefined,
    platformFeeBpsRaw: rawBps,
  };
}

/**
 * Parses PLATFORM_FEE_BPS from a raw env string.
 * Returns the clamped value and whether the raw input was out of range.
 */
function parsePlatformFeeBps(raw: string | undefined): { value: number; outOfRange: boolean } {
  if (!raw) return { value: 10, outOfRange: false };

  // Ensure the raw value is a base-10 integer (digits only) before parsing.
  // This prevents silently accepting values like "10.5" or "10bps".
  if (!/^\d+$/.test(raw)) {
    return { value: 10, outOfRange: true };
  }

  const parsed = Number(raw);
  if (parsed < 0 || parsed > 10000) {
    return { value: 10, outOfRange: true };
  }
  return { value: parsed, outOfRange: false };
}

export interface ConfigWarning {
  key: string;
  message: string;
}

/**
 * Validates the supplied (or current) configuration and returns a list of warnings.
 * Accepts an optional pre-computed `AppConfig` so callers that already hold one
 * (e.g. the health endpoint) avoid a redundant env-var read.
 * Non-fatal issues are surfaced as warnings; no exceptions are thrown.
 */
export function validateConfig(cfg?: AppConfig): ConfigWarning[] {
  const config = cfg ?? getConfig();
  const warnings: ConfigWarning[] = [];

  if (!config.databaseUrl) {
    warnings.push({
      key: "DATABASE_URL",
      message: "Not set — using in-memory store (data lost on restart, not suitable for production).",
    });
  }

  if (!config.adminToken) {
    warnings.push({
      key: "ADMIN_TOKEN",
      message: "Not set — admin dashboard is disabled.",
    });
  }

  const rawBps = config.platformFeeBpsRaw ?? process.env.PLATFORM_FEE_BPS;
  const { outOfRange } = parsePlatformFeeBps(rawBps);
  if (outOfRange) {
    warnings.push({
      key: "PLATFORM_FEE_BPS",
      message: `Invalid value "${rawBps}" — must be an integer 0–10000; the default of 10 bps is being used.`,
    });
  }

  if (!config.platformFeeRecipient) {
    warnings.push({
      key: "PLATFORM_FEE_RECIPIENT",
      message: "Not set — platform fees are calculated but no recipient is configured.",
    });
  }

  if (!config.oneInchApiKey) {
    warnings.push({
      key: "ONEINCH_API_KEY",
      message: "Not set — 1inch quotes will be skipped.",
    });
  }

  if (!config.zeroExApiKey) {
    warnings.push({
      key: "ZEROX_API_KEY",
      message: "Not set — 0x Protocol quotes will be skipped.",
    });
  }

  return warnings;
}
