import type { ApiKey } from "./types";

/**
 * Storage interface for developer registrations.
 *
 * Replace the default `registrationStore` export with a database-backed
 * implementation before deploying to production. Options:
 *   - Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
 *   - Upstash Redis:   https://upstash.com/
 *   - PlanetScale:     https://planetscale.com
 *
 * Example (Upstash Redis):
 *   import { Redis } from "@upstash/redis";
 *   const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL!, token: process.env.UPSTASH_REDIS_TOKEN! });
 *
 *   class RedisRegistrationStore implements RegistrationStore {
 *     async findByEmail(email: string) { return redis.hget<ApiKey>("reg:email", email) ?? undefined; }
 *     async findByKey(key: string) { return redis.hget<ApiKey>("reg:key", key) ?? undefined; }
 *     async save(apiKey: ApiKey) {
 *       await redis.hset("reg:email", { [apiKey.email]: apiKey });
 *       await redis.hset("reg:key", { [apiKey.key]: apiKey });
 *     }
 *   }
 *   export const registrationStore: RegistrationStore = new RedisRegistrationStore();
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

export const registrationStore: RegistrationStore =
  new InMemoryRegistrationStore();
