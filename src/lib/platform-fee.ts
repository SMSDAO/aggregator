/**
 * Platform service fee module.
 *
 * The platform charges a configurable fee on flash loans and swaps.
 * Configure these environment variables before deployment:
 *
 *   PLATFORM_FEE_BPS          — fee in basis points (1 bp = 0.01%).
 *                                Default: 10 (= 0.1%). Set to 0 to disable.
 *   PLATFORM_FEE_RECIPIENT    — EVM wallet address that receives the fee.
 *                                If unset the fee is still calculated and
 *                                disclosed in API responses, but no on-chain
 *                                transfer is constructed until real calldata
 *                                encoding is implemented.
 */

import { getConfig } from "./config";

export interface PlatformFeeInfo {
  /** Fee in basis points as configured via PLATFORM_FEE_BPS. */
  feeBps: number;
  /** Fee as a percentage (feeBps / 100). */
  feePercent: number;
  /** Fee amount in the input token's base units. */
  feeAmount: string;
  /** Configured recipient address, or null if PLATFORM_FEE_RECIPIENT is unset. */
  recipient: string | null;
}

/**
 * Returns the currently configured platform fee in basis points.
 * Delegates to getConfig() so the value is read at call time.
 */
export function getPlatformFeeBps(): number {
  return getConfig().platformFeeBps;
}

/**
 * Returns the configured fee recipient address, or null when unset.
 * Delegates to getConfig() so the value is read at call time.
 */
export function getPlatformFeeRecipient(): string | null {
  return getConfig().platformFeeRecipient;
}

/**
 * Calculates the platform fee for a given input amount and returns a
 * `PlatformFeeInfo` object suitable for inclusion in API responses.
 *
 * @param amount - Input amount in the token's smallest base unit (as a string
 *                 to preserve BigInt precision for large values).
 */
export function calcPlatformFee(amount: string): PlatformFeeInfo {
  const bps = getPlatformFeeBps();
  const recipient = getPlatformFeeRecipient();

  // Integer arithmetic to avoid floating-point precision loss on large amounts.
  const feeAmount =
    bps > 0
      ? ((BigInt(amount) * BigInt(bps)) / BigInt(10000)).toString()
      : "0";

  return {
    feeBps: bps,
    feePercent: bps / 100,
    feeAmount,
    recipient,
  };
}
