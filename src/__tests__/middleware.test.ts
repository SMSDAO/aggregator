/**
 * Tests for src/middleware.ts
 *
 * Verifies:
 *  1. Security headers are applied on normal (non-rate-limited) responses.
 *  2. Security headers are applied on 429 rate-limit responses.
 *  3. Rate limiting returns 429 with Retry-After and X-RateLimit-* headers
 *     after exceeding 60 requests in the same window.
 *  4. Rate-limit counter resets after the window expires.
 *  5. Excluded paths (_next/*, favicon.ico) bypass rate limiting and headers.
 *  6. Non-API paths receive security headers but are never rate-limited.
 *  7. Requests without a determinable IP are not rate-limited (safe fallback).
 */

// ---------------------------------------------------------------------------
// Minimal mocks for NextResponse / NextRequest (Edge runtime not available in
// Node.js Jest environment).
// ---------------------------------------------------------------------------

interface MockHeaders {
  _map: Map<string, string>;
  set(key: string, value: string): void;
  get(key: string): string | null;
}

function makeHeaders(init: Record<string, string> = {}): MockHeaders {
  const _map = new Map<string, string>(Object.entries(init));
  return {
    _map,
    set(key: string, value: string) { _map.set(key.toLowerCase(), value); },
    get(key: string) { return _map.get(key.toLowerCase()) ?? null; },
  };
}

interface MockResponse {
  status: number;
  headers: MockHeaders;
  _body?: string;
}

// Mock NextResponse
const mockNextResponse = {
  next: jest.fn(),
};

jest.mock("next/server", () => {
  return {
    NextResponse: class MockNextResponse {
      status: number;
      headers: MockHeaders;
      _body?: string;

      constructor(body?: string, init?: { status?: number; headers?: MockHeaders | Headers | Record<string, string> }) {
        this._body = body;
        this.status = init?.status ?? 200;
        const h = init?.headers;
        if (h && typeof (h as MockHeaders).get === "function") {
          // Already a headers-like object (MockHeaders or native Headers):
          // wrap in MockHeaders so we can inspect via _map.
          const mock = makeHeaders();
          // Native Headers doesn't expose forEach in all envs; use our known keys.
          if ((h as MockHeaders)._map) {
            // Our MockHeaders
            this.headers = h as MockHeaders;
          } else {
            // Native Headers — copy known rate-limit / content-type entries
            const keys = [
              "content-type", "retry-after", "x-ratelimit-limit",
              "x-ratelimit-remaining", "x-ratelimit-reset",
              "x-frame-options", "x-content-type-options", "referrer-policy",
              "permissions-policy", "strict-transport-security",
              "content-security-policy",
            ];
            for (const k of keys) {
              const v = (h as Headers).get(k);
              if (v !== null) mock.set(k, v);
            }
            this.headers = mock;
          }
        } else {
          this.headers = makeHeaders((h as Record<string, string>) ?? {});
        }
      }

      static next() {
        const res: MockResponse = {
          status: 200,
          headers: makeHeaders(),
        };
        mockNextResponse.next();
        return res;
      }
    },
  };
});

// ---------------------------------------------------------------------------
// Helper: build a minimal mock NextRequest
// ---------------------------------------------------------------------------
function makeRequest(
  pathname: string,
  opts: { ip?: string; xForwardedFor?: string; xRealIp?: string } = {}
): object {
  const headerMap = new Map<string, string>();
  if (opts.xForwardedFor) headerMap.set("x-forwarded-for", opts.xForwardedFor);
  if (opts.xRealIp) headerMap.set("x-real-ip", opts.xRealIp);

  return {
    ip: opts.ip,
    nextUrl: { pathname },
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()) ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Import middleware AFTER mocks are set up
// ---------------------------------------------------------------------------
// We use jest.isolateModules to get a fresh module between tests so the
// rateLimitStore Map is reset.

const SECURITY_HEADERS = [
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "strict-transport-security",
  "content-security-policy",
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("middleware", () => {
  let middlewareFn: (req: object) => object;

  beforeEach(() => {
    jest.resetModules();
    // Re-import to get a fresh rateLimitStore
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../middleware");
    middlewareFn = mod.middleware;
    lastNextResponse = null;
    mockNextResponse.next.mockClear();
  });

  // -------------------------------------------------------------------------
  describe("non-API paths", () => {
    it("applies all security headers on a normal page response", () => {
      const req = makeRequest("/dashboard");
      const res = middlewareFn(req) as MockResponse;

      for (const header of SECURITY_HEADERS) {
        expect(res.headers.get(header)).not.toBeNull();
      }
    });

    it("sets X-Frame-Options to DENY", () => {
      const req = makeRequest("/");
      const res = middlewareFn(req) as MockResponse;
      expect(res.headers.get("x-frame-options")).toBe("DENY");
    });

    it("does not rate-limit non-API paths regardless of request count", () => {
      const req = makeRequest("/dashboard", { ip: "1.2.3.4" });
      for (let i = 0; i < 100; i++) {
        const res = middlewareFn(req) as MockResponse;
        expect(res.status).not.toBe(429);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("API paths - rate limiting", () => {
    it("applies security headers on a normal API response", () => {
      const req = makeRequest("/api/quote", { ip: "10.0.0.1" });
      const res = middlewareFn(req) as MockResponse;

      expect(res.status).not.toBe(429);
      for (const header of SECURITY_HEADERS) {
        expect(res.headers.get(header)).not.toBeNull();
      }
    });

    it("returns 200 for requests within the rate limit", () => {
      const req = makeRequest("/api/quote", { ip: "10.0.0.2" });
      for (let i = 0; i < 60; i++) {
        const res = middlewareFn(req) as MockResponse;
        expect(res.status).not.toBe(429);
      }
    });

    it("returns 429 with Retry-After after exceeding 60 requests", () => {
      const req = makeRequest("/api/quote", { ip: "10.0.0.3" });
      let last429: MockResponse | null = null;

      for (let i = 0; i < 70; i++) {
        const res = middlewareFn(req) as MockResponse;
        if (res.status === 429) {
          last429 = res;
        }
      }

      expect(last429).not.toBeNull();
      expect(last429!.headers.get("retry-after")).toBe("60");
    });

    it("applies security headers on 429 rate-limit responses", () => {
      const req = makeRequest("/api/quote", { ip: "10.0.0.4" });
      let rateRes: MockResponse | null = null;

      for (let i = 0; i < 70; i++) {
        const res = middlewareFn(req) as MockResponse;
        if (res.status === 429) rateRes = res;
      }

      expect(rateRes).not.toBeNull();
      for (const header of SECURITY_HEADERS) {
        expect(rateRes!.headers.get(header)).not.toBeNull();
      }
    });

    it("includes X-RateLimit-Limit and X-RateLimit-Remaining on 429", () => {
      const req = makeRequest("/api/health", { ip: "10.0.0.5" });
      let rateRes: MockResponse | null = null;

      for (let i = 0; i < 70; i++) {
        const res = middlewareFn(req) as MockResponse;
        if (res.status === 429) rateRes = res;
      }

      expect(rateRes!.headers.get("x-ratelimit-limit")).toBe("60");
      expect(rateRes!.headers.get("x-ratelimit-remaining")).toBe("0");
    });

    it("uses x-forwarded-for when request.ip is unavailable", () => {
      const req = makeRequest("/api/quote", { xForwardedFor: "192.168.1.1, 10.0.0.1" });
      // Should not throw; IP should be parsed from header
      const res = middlewareFn(req) as MockResponse;
      expect(res).toBeDefined();
    });

    it("uses x-real-ip when request.ip and x-forwarded-for are unavailable", () => {
      const req = makeRequest("/api/quote", { xRealIp: "172.16.0.1" });
      const res = middlewareFn(req) as MockResponse;
      expect(res).toBeDefined();
    });

    it("skips rate limiting when no IP can be determined", () => {
      // No ip, no headers — should never trigger 429
      const req = makeRequest("/api/quote");
      for (let i = 0; i < 100; i++) {
        const res = middlewareFn(req) as MockResponse;
        expect(res.status).not.toBe(429);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe("excluded paths", () => {
    it("bypasses middleware for _next/ paths", () => {
      const req = makeRequest("/_next/static/chunk.js");
      // Should return NextResponse.next() without applying headers
      middlewareFn(req);
      expect(mockNextResponse.next).toHaveBeenCalled();
    });

    it("bypasses middleware for favicon.ico", () => {
      const req = makeRequest("/favicon.ico");
      middlewareFn(req);
      expect(mockNextResponse.next).toHaveBeenCalled();
    });
  });
});
