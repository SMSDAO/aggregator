import { NextRequest, NextResponse } from "next/server";
import type { AdminStats } from "@/lib";
import { getConfig } from "@/lib/config";
import { registrationStore } from "@/lib/store";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminToken = process.env.ADMIN_TOKEN;
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
    const cfg = getConfig();
    const allKeys = await registrationStore.listAll();

    const totalUsers = allKeys.length;
    const totalRequests = allKeys.reduce((sum, k) => sum + k.requests, 0);

    const activeAggregators: string[] = ["ParaSwap"];
    if (cfg.oneInchApiKey) activeAggregators.unshift("1inch");
    if (cfg.zeroExApiKey) activeAggregators.push("0x Protocol");

    const recentRegistrations = allKeys.slice(0, 20);

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
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
