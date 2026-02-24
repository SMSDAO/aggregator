-- DEX Aggregator — initial schema migration
-- Run once against your Neon / Supabase / PostgreSQL database:
--   psql $DATABASE_URL -f scripts/migrate.sql

CREATE TABLE IF NOT EXISTS api_keys (
  key           TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  project_name  TEXT        NOT NULL,
  use_case      TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  requests      INTEGER     NOT NULL DEFAULT 0,
  plan          TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'enterprise'))
);

-- Index for fast lookups by email (used on every registration attempt)
CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys (email);
