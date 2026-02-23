import { NextRequest, NextResponse } from "next/server";
import type { AdminStats } from "@/lib";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const adminToken = process.env.ADMIN_TOKEN ?? "admin-secret";

  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats: AdminStats = {
    totalUsers: 142,
    totalRequests: 48721,
    totalVolume: "$12,450,000",
    activeAggregators: ["1inch", "0x Protocol", "Paraswap", "Uniswap"],
    topPairs: [
      { pair: "ETH/USDC", volume: "$4,200,000", requests: 18420 },
      { pair: "WBTC/ETH", volume: "$2,800,000", requests: 12150 },
      { pair: "ETH/DAI", volume: "$1,950,000", requests: 9870 },
      { pair: "USDC/USDT", volume: "$1,100,000", requests: 5280 },
      { pair: "ETH/WBTC", volume: "$980,000", requests: 3001 },
    ],
    recentRegistrations: [
      {
        key: "agg_xxx",
        name: "Alice Chen",
        email: "alice@defi.io",
        projectName: "YieldFarm Pro",
        useCase: "Yield optimization",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        requests: 1240,
        plan: "pro",
      },
      {
        key: "agg_yyy",
        name: "Bob Smith",
        email: "bob@web3.dev",
        projectName: "ArbiBot",
        useCase: "Arbitrage trading",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        requests: 520,
        plan: "free",
      },
    ],
  };

  return NextResponse.json(stats);
}
