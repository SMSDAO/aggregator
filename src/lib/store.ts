import type { ApiKey, RecentRegistration } from "./types";

/**
 * Storage interface for developer registrations.
 *
 * The exported `registrationStore` automatically selects the right backend:
 *   - When DATABASE_URL is set → PostgresRegistrationStore (Neon / Supabase / any Postgres)
 *   - Otherwise               → InMemoryRegistrationStore  (local development only)
 *
 * Vercel setup (one-click):
 *   1. Add the "Neon Postgres" integration from the Vercel Marketplace.
 *      Vercel automatically injects DATABASE_URL into your project.
 *   2. Run the schema migration once:
 *        npx vercel env pull .env.local && psql $DATABASE_URL -f scripts/migrate.sql
 *
 * Supabase setup:
 *   1. Create a project at https://supabase.com
 *   2. Copy the connection string from Project → Settings → Database → URI
 *   3. Add it as DATABASE_URL in your Vercel project environment variables.
 *   4. Run: psql $DATABASE_URL -f scripts/migrate.sql
 */
export interface StoreStats {
  totalUsers: number;
  totalRequests: number;
}

export const MAX_RECENT_LIMIT = 1000;

/**
 * Sanitizes and clamps a raw `limit` argument for `listRecent()`.
 * - Non-finite values (NaN, ±Infinity) → 0
 * - Floats → truncated toward zero
 * - Result clamped to [0, MAX_RECENT_LIMIT]
 */
export function clampRecentLimit(limit: number): number {
  return Number.isFinite(limit)
    ? Math.max(0, Math.min(Math.trunc(limit), MAX_RECENT_LIMIT))
    : 0;
}

export interface RegistrationStore {
  findByEmail(email: string): Promise<ApiKey | undefined>;
  findByKey(key: string): Promise<ApiKey | undefined>;
  save(apiKey: ApiKey): Promise<void>;
  /** Returns aggregate counts without loading all rows into memory. */
  getStats(): Promise<StoreStats>;
  /** Returns the most recently registered records, newest first, with the secret `key` field omitted. */
  listRecent(limit: number): Promise<RecentRegistration[]>;
}

/**
 * In-memory implementation — for local development only.
 *
 * Data is lost on every restart and is NOT shared across concurrent serverless
 * function instances (Vercel, AWS Lambda, etc.).
 * Replace this with a persistent store before deploying to production.
 */
class InMemoryRegistrationStore implements RegistrationStore {
  private readonly map = new Map<string, ApiKey>();
  // Insertion-ordered list of API key strings for O(k) recent lookups.
  // Only this index is bounded at MAX_RECENT_LIMIT; the backing `map` grows
  // without bound.  The oldest entry is dropped from the front when the cap
  // is reached so the recency index stays bounded.
  private readonly insertionOrder: string[] = [];

  async findByEmail(email: string): Promise<ApiKey | undefined> {
    return Array.from(this.map.values()).find((r) => r.email === email);
  }

  async findByKey(key: string): Promise<ApiKey | undefined> {
    return this.map.get(key);
  }

  async save(apiKey: ApiKey): Promise<void> {
    if (!this.map.has(apiKey.key)) {
      // New key: record insertion order for recency lookups.
      // Re-saves of the same key (e.g., request-count increment) intentionally
      // do NOT move the entry — recency reflects first-registration time.
      this.insertionOrder.push(apiKey.key);
      // Trim the deque to the cap so memory stays bounded.
      if (this.insertionOrder.length > MAX_RECENT_LIMIT) {
        this.insertionOrder.shift();
      }
    }
    this.map.set(apiKey.key, apiKey);
  }

  async getStats(): Promise<StoreStats> {
    let totalUsers = 0;
    let totalRequests = 0;
    for (const k of this.map.values()) {
      totalUsers += 1;
      totalRequests += k.requests;
    }
    return { totalUsers, totalRequests };
  }

  async listRecent(limit: number): Promise<RecentRegistration[]> {
    const clampedLimit = clampRecentLimit(limit);
    // Walk insertionOrder in reverse (newest first) and collect up to clampedLimit
    // sanitized records.  O(k) where k = clampedLimit.
    const result: RecentRegistration[] = [];
    for (
      let i = this.insertionOrder.length - 1;
      i >= 0 && result.length < clampedLimit;
      i--
    ) {
      const entry = this.map.get(this.insertionOrder[i]);
      if (entry) {
        const { key: _key, ...rest } = entry;
        result.push(rest);
      }
    }
    return result;
  }
}

export const registrationStore: RegistrationStore = (() => {
  if (process.env.DATABASE_URL) {
    // Lazy import so the Neon driver is only loaded when DATABASE_URL is present.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostgresRegistrationStore } = require("./store-pg") as {
      PostgresRegistrationStore: new (url: string) => RegistrationStore;
    };
    return new PostgresRegistrationStore(process.env.DATABASE_URL);
  }
  return new InMemoryRegistrationStore();
})();
