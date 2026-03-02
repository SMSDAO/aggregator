/**
 * Retry utility with exponential backoff.
 *
 * Used by aggregator integrations to recover from transient HTTP failures
 * (connection timeouts, 429 rate-limits, 5xx server errors) without manual
 * intervention — enabling self-healing behaviour for external API calls.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3. */
  attempts?: number;
  /** Base delay in milliseconds between retries. Default: 200. */
  baseDelayMs?: number;
  /** HTTP status codes that should trigger a retry. Default: [429, 500, 502, 503, 504]. */
  retryStatuses?: number[];
}

/**
 * Wraps a `fetch` call with automatic retries on transient errors.
 *
 * @param url     - The URL to fetch.
 * @param init    - Standard `RequestInit` options.
 * @param options - Retry configuration.
 * @returns The last `Response` if all retries are exhausted with a
 *          retryable status, or the first successful/non-retryable response.
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const { attempts = 3, baseDelayMs = 200, retryStatuses = [429, 500, 502, 503, 504] } =
    options;
  // Guard against nonsensical configuration: at least 1 attempt, non-negative delay.
  const safeAttempts = Math.max(1, attempts);
  const safeBaseDelayMs = Math.max(0, baseDelayMs);

  let lastError: unknown;
  let retries = 0;
  for (let attempt = 0; attempt < safeAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!retryStatuses.includes(response.status) || attempt === safeAttempts - 1) {
        return response;
      }
      // Retryable status — wait before next attempt using number of retries so far.
      await delay(safeBaseDelayMs * 2 ** retries++);
    } catch (err) {
      lastError = err;
      if (attempt < safeAttempts - 1) {
        await delay(safeBaseDelayMs * 2 ** retries++);
      }
    }
  }
  throw lastError ?? new Error("All retry attempts threw exceptions");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
