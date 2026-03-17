import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge middleware.
 *
 * Responsibilities:
 *  1. Apply security headers on all responses (including 429 rate-limit
 *     responses — achieved via the shared `applySecurityHeaders` helper).
 *  2. Basic in-edge rate limiting for API routes using a per-instance
 *     in-memory Map keyed by IP address.
 *
 * ⚠ Rate-limiting caveat: this store is per-Edge-instance and ephemeral.
 * Under Vercel's globally-distributed edge network each instance maintains
 * its own counter, so the effective limit is per-instance, not globally
 * enforced across all regions. For strict global enforcement, replace with a
 * shared backing store such as Vercel KV or Upstash Redis.
 */

// Routes that should NOT apply security headers (e.g., internal Next.js routes)
const SKIP_HEADERS = ["/_next/", "/favicon.ico"];

// Simple in-memory rate limiter (edge runtime): keyed by IP.
// Expired entries are pruned when the store grows beyond a threshold to
// prevent unbounded Map growth without incurring O(n) cost on every request.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP for API routes
const PRUNE_THRESHOLD = 1000; // prune only when store exceeds this size

/**
 * Applies a shared set of security headers to the given `Headers` object.
 * Called on every outgoing response — including 429 rate-limit responses —
 * so the same header policy is enforced uniformly.
 */
function applySecurityHeaders(headers: Headers): void {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // X-XSS-Protection is deprecated and ignored by modern browsers; omitting
  // it avoids triggering legacy XSS-auditor behaviour in older browsers.
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // 'unsafe-inline' is required by Next.js for its inline style/script
      // injection. 'unsafe-eval' has been removed to tighten XSS protection.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.1inch.dev https://api.0x.org https://api.paraswap.io",
      "frame-ancestors 'none'",
    ].join("; ")
  );
}

/** Removes expired entries from the rate-limit store to cap memory usage.
 *  Only runs when the store exceeds PRUNE_THRESHOLD to keep per-request
 *  overhead bounded under high-cardinality traffic.
 */
function pruneExpiredEntries(now: number): void {
  if (rateLimitStore.size <= PRUNE_THRESHOLD) return;
  for (const [ip, record] of rateLimitStore) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal Next.js asset routes
  if (SKIP_HEADERS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Apply rate limiting on API routes
  if (pathname.startsWith("/api/")) {
    // Prefer the platform-provided IP, then fall back to forwarded headers.
    // If no IP can be determined, skip rate limiting to avoid collapsing all
    // clients into the same "unknown" bucket.
    const ip =
      (request as unknown as { ip?: string }).ip ??
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const now = Date.now();

    // Opportunistically prune expired entries on each API request.
    pruneExpiredEntries(now);

    if (ip) {
      const record = rateLimitStore.get(ip);

      if (!record || now > record.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      } else {
        record.count += 1;
        if (record.count > RATE_LIMIT_MAX) {
          const tooManyHeaders = new Headers({
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          });
          // Apply the same security headers to 429 responses.
          applySecurityHeaders(tooManyHeaders);
          return new NextResponse(
            JSON.stringify({ error: "Too many requests. Please retry after 1 minute." }),
            { status: 429, headers: tooManyHeaders }
          );
        }
      }
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
