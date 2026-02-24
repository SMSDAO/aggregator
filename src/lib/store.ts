import type { ApiKey } from "./types";

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
export interface RegistrationStore {
  findByEmail(email: string): Promise<ApiKey | undefined>;
  findByKey(key: string): Promise<ApiKey | undefined>;
  save(apiKey: ApiKey): Promise<void>;
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

  async findByEmail(email: string): Promise<ApiKey | undefined> {
    return Array.from(this.map.values()).find((r) => r.email === email);
  }

  async findByKey(key: string): Promise<ApiKey | undefined> {
    return this.map.get(key);
  }

  async save(apiKey: ApiKey): Promise<void> {
    this.map.set(apiKey.key, apiKey);
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
