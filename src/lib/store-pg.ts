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
import type { RegistrationStore } from "./store";

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
}
