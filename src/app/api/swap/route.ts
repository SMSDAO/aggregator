import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib";
import type { SwapRequest } from "@/lib";

// 1inch v5 AggregationRouter addresses per chain.
const SWAP_ROUTER_ADDRESSES: Record<number, string> = {
  1: "0x1111111254EEB25477B68fb85Ed929f73A960582",     // Ethereum
  10: "0x1111111254EEB25477B68fb85Ed929f73A960582",    // Optimism
  56: "0x1111111254EEB25477B68fb85Ed929f73A960582",    // BNB Chain
  137: "0x1111111254EEB25477B68fb85Ed929f73A960582",   // Polygon
  8453: "0x1111111254EEB25477B68fb85Ed929f73A960582",  // Base
  42161: "0x1111111254EEB25477B68fb85Ed929f73A960582", // Arbitrum One
  43114: "0x1111111254EEB25477B68fb85Ed929f73A960582", // Avalanche
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SwapRequest;

    if (
      !body.fromToken ||
      !body.toToken ||
      !body.amount ||
      !body.chainId ||
      !body.fromAddress
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: fromToken, toToken, amount, chainId, fromAddress",
        },
        { status: 400 }
      );
    }

    const quote = await getQuotes(body);

    const routerAddress =
      SWAP_ROUTER_ADDRESSES[body.chainId] ??
      "0x0000000000000000000000000000000000000000";

    const transaction = {
      to: routerAddress,
      // NOTE: Transaction data is a placeholder for simulation purposes.
      // In production, encode this using ABI encoding (e.g., ethers.js or viem)
      // to match the 1inch AggregationRouter swap function signature.
      data: "0x",
      value: "0",
      gasLimit: quote.estimatedGas,
    };

    return NextResponse.json({ quote, transaction });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
