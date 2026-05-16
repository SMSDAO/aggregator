import { NextRequest, NextResponse } from "next/server";
import type { AdminStats } from "@/lib";
import { getConfig } from "@/lib/config";
import { registrationStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cfg = getConfig();
  const adminToken = cfg.adminToken;
  if (!adminToken) {
    return NextResponse.json(
      { error: "Admin access is not configured" },
      { status: 503 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { totalUsers, totalRequests } = await registrationStore.getStats();
    // listRecent() now returns RecentRegistration[] — the secret key is never
    // included, so no extra stripping is required here.
    const recentRegistrations = await registrationStore.listRecent(20);

    const activeAggregators: string[] = ["ParaSwap"];
    if (cfg.oneInchApiKey) activeAggregators.unshift("1inch");
    if (cfg.zeroExApiKey) activeAggregators.push("0x Protocol");

    const stats: AdminStats = {
      totalUsers,
      totalRequests,
      totalVolume: "0",
      activeAggregators,
      topPairs: [],
      recentRegistrations,
    };

    return NextResponse.json(stats);
  } catch (error) {
    // Log full error details server-side without exposing them to the client.
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
