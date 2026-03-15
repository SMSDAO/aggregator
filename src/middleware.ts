import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge middleware.
 *
 * Responsibilities:
 *  1. Apply security headers on all responses.
 *  2. Basic in-edge rate limiting for API routes (via sliding window counter
 *     stored in response headers — a lightweight signal; production should
 *     use a Redis-backed store like Vercel KV).
 */

// Routes that should NOT apply security headers (e.g., internal Next.js routes)
const SKIP_HEADERS = ["/_next/", "/favicon.ico"];

// Simple in-memory rate limiter (edge runtime): keyed by IP.
// In a real deployment use Vercel KV / Upstash Redis for persistence across
// invocations, as edge function memory is ephemeral.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP for API routes

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal Next.js asset routes
  if (SKIP_HEADERS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Apply rate limiting on API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      record.count += 1;
      if (record.count > RATE_LIMIT_MAX) {
        return new NextResponse(JSON.stringify({ error: "Too many requests. Please retry after 1 minute." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          },
        });
      }
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.1inch.dev https://api.0x.org https://api.paraswap.io",
      "frame-ancestors 'none'",
    ].join("; ")
  );

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
