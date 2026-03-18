import { getConfig, validateConfig } from "@/lib/config";

describe("getConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns default platform fee bps when PLATFORM_FEE_BPS is unset", () => {
    delete process.env.PLATFORM_FEE_BPS;
    const cfg = getConfig();
    expect(cfg.platformFeeBps).toBe(10);
  });

  it("parses a valid PLATFORM_FEE_BPS", () => {
    process.env.PLATFORM_FEE_BPS = "50";
    const cfg = getConfig();
    expect(cfg.platformFeeBps).toBe(50);
  });

  it("falls back to 10 for an invalid PLATFORM_FEE_BPS value", () => {
    process.env.PLATFORM_FEE_BPS = "invalid";
    const cfg = getConfig();
    expect(cfg.platformFeeBps).toBe(10);
  });

  it("falls back to 10 for an out-of-range PLATFORM_FEE_BPS value", () => {
    process.env.PLATFORM_FEE_BPS = "99999";
    const cfg = getConfig();
    expect(cfg.platformFeeBps).toBe(10);
  });

  it("reads DATABASE_URL from environment", () => {
    process.env.DATABASE_URL = "postgres://localhost/test";
    const cfg = getConfig();
    expect(cfg.databaseUrl).toBe("postgres://localhost/test");
  });

  it("returns undefined for DATABASE_URL when not set", () => {
    delete process.env.DATABASE_URL;
    const cfg = getConfig();
    expect(cfg.databaseUrl).toBeUndefined();
  });
});

describe("validateConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns warnings for missing required config", () => {
    delete process.env.DATABASE_URL;
    delete process.env.ADMIN_TOKEN;
    delete process.env.PLATFORM_FEE_RECIPIENT;
    delete process.env.ONEINCH_API_KEY;
    delete process.env.ZEROX_API_KEY;
    const warnings = validateConfig();
    const keys = warnings.map((w) => w.key);
    expect(keys).toContain("DATABASE_URL");
    expect(keys).toContain("ADMIN_TOKEN");
    expect(keys).toContain("PLATFORM_FEE_RECIPIENT");
    expect(keys).toContain("ONEINCH_API_KEY");
    expect(keys).toContain("ZEROX_API_KEY");
  });

  it("accepts a pre-computed config to avoid double env reads", () => {
    const cfg = getConfig();
    const w1 = validateConfig(cfg);
    const w2 = validateConfig(cfg);
    expect(w1).toEqual(w2);
  });
});
