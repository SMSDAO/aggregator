/**
 * PostgreSQL-backed RegistrationStore using the Neon serverless driver.
 *
 * Requires a single environment variable:
 *   DATABASE_URL=postgres://user:pass@host/dbname
 *
 * Compatible with:
 *   - Neon  (https://neon.tech)       — Vercel Integration: "Neon Postgres"
 *   - Supabase (https://supabase.com) — connection string from Project → Settings → Database
 *   - Any standard PostgreSQL instance
 *
 * Run the migration once before first use:
 *   psql $DATABASE_URL -f scripts/migrate.sql
 */
import { neon } from "@neondatabase/serverless";
import type { ApiKey } from "./types";
import { MAX_RECENT_LIMIT } from "./store";
import type { RegistrationStore, StoreStats } from "./store";

export class PostgresRegistrationStore implements RegistrationStore {
  private readonly sql: ReturnType<typeof neon>;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  async findByEmail(email: string): Promise<ApiKey | undefined> {
    const rows = (await this.sql`
      SELECT
        key, name, email, plan, requests,
        project_name  AS "projectName",
        use_case      AS "useCase",
        created_at    AS "createdAt"
      FROM api_keys WHERE email = ${email} LIMIT 1
    `) as Record<string, unknown>[];
    return rows[0] ? (rows[0] as unknown as ApiKey) : undefined;
  }

  async findByKey(key: string): Promise<ApiKey | undefined> {
    const rows = (await this.sql`
      SELECT
        key, name, email, plan, requests,
        project_name  AS "projectName",
        use_case      AS "useCase",
        created_at    AS "createdAt"
      FROM api_keys WHERE key = ${key} LIMIT 1
    `) as Record<string, unknown>[];
    return rows[0] ? (rows[0] as unknown as ApiKey) : undefined;
  }

  async save(apiKey: ApiKey): Promise<void> {
    // ON CONFLICT … DO UPDATE ensures the row is always written and returned,
    // preventing a race where DO NOTHING silently drops a concurrent INSERT
    // while the caller still receives the newly-generated key.
    await this.sql`
      INSERT INTO api_keys (key, name, email, project_name, use_case, created_at, requests, plan)
      VALUES (
        ${apiKey.key},
        ${apiKey.name},
        ${apiKey.email},
        ${apiKey.projectName},
        ${apiKey.useCase},
        ${apiKey.createdAt},
        ${apiKey.requests},
        ${apiKey.plan}
      )
      ON CONFLICT (email) DO UPDATE SET
        key        = EXCLUDED.key,
        name       = EXCLUDED.name,
        project_name = EXCLUDED.project_name,
        use_case   = EXCLUDED.use_case,
        created_at = EXCLUDED.created_at,
        requests   = EXCLUDED.requests,
        plan       = EXCLUDED.plan
    `;
  }

  async getStats(): Promise<StoreStats> {
    const rows = (await this.sql`
      SELECT COUNT(*) AS "totalUsers", COALESCE(SUM(requests), 0) AS "totalRequests"
      FROM api_keys
    `) as Record<string, unknown>[];
    const row = rows[0] ?? {};
    return {
      totalUsers: Number(row.totalUsers ?? 0),
      totalRequests: Number(row.totalRequests ?? 0),
    };
  }

  async listRecent(limit: number): Promise<ApiKey[]> {
    const clampedLimit = Number.isFinite(limit)
      ? Math.max(0, Math.min(Math.trunc(limit), MAX_RECENT_LIMIT))
      : 0;
    const rows = (await this.sql`
      SELECT
        key, name, email, plan, requests,
        project_name  AS "projectName",
        use_case      AS "useCase",
        created_at    AS "createdAt"
      FROM api_keys ORDER BY created_at DESC LIMIT ${clampedLimit}
    `) as Record<string, unknown>[];
    return rows.map((row) => {
      const rawPlan = String(row.plan ?? "free");
      const validPlans: ApiKey["plan"][] = ["free", "pro", "enterprise"];
      const plan: ApiKey["plan"] = (validPlans as string[]).includes(rawPlan)
        ? (rawPlan as ApiKey["plan"])
        : "free";
      return {
        key: String(row.key),
        name: String(row.name),
        email: String(row.email),
        plan,
        requests: Number(row.requests),
        projectName: String(row.projectName),
        useCase: String(row.useCase),
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : String(row.createdAt),
      };
    });
  }
}
