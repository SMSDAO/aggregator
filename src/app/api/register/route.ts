import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { DeveloperRegistration, ApiKey } from "@/lib";

// WARNING: In-memory store only. All data is lost on server restart.
// Must be replaced with a persistent database (e.g., PostgreSQL, MongoDB) before production deployment.
const registrations = new Map<string, ApiKey>();

function generateApiKey(): string {
  return `agg_${randomBytes(24).toString("hex")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DeveloperRegistration;

    if (!body.name || !body.email || !body.projectName || !body.useCase) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, projectName, useCase" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const existing = Array.from(registrations.values()).find(
      (r) => r.email === body.email
    );
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const apiKey: ApiKey = {
      key: generateApiKey(),
      name: body.name,
      email: body.email,
      projectName: body.projectName,
      useCase: body.useCase,
      createdAt: new Date().toISOString(),
      requests: 0,
      plan: "free",
    };

    registrations.set(apiKey.key, apiKey);

    return NextResponse.json({
      apiKey: apiKey.key,
      plan: apiKey.plan,
      message:
        "Registration successful! Your API key has been generated. Keep it safe.",
      rateLimit: {
        free: "1000 requests/month",
        pro: "100,000 requests/month",
        enterprise: "Unlimited",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "DEX Aggregator Developer Registration API",
    plans: [
      { name: "free", price: "$0/month", requests: "1,000/month" },
      { name: "pro", price: "$49/month", requests: "100,000/month" },
      { name: "enterprise", price: "Custom", requests: "Unlimited" },
    ],
  });
}
