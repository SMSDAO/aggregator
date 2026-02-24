import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib";
import type { SwapRequest } from "@/lib";

/**
 * Official 1inch AggregationRouter v6 addresses per chain.
 * Source: https://docs.1inch.io/docs/aggregation-protocol/smart-contract/AggregationRouterV6
 *
 * These are the canonical on-chain entry points; the addresses below were
 * verified from the 1inch developer portal and official deployment registry.
 * Always confirm against https://portal.1inch.dev/ before broadcasting
 * production transactions.
 */
const SWAP_ROUTER_ADDRESSES: Record<number, string> = {
  1:     "0x111111125421cA6dc452d289314280a0f8842A65", // Ethereum mainnet
  10:    "0x111111125421cA6dc452d289314280a0f8842A65", // Optimism
  56:    "0x111111125421cA6dc452d289314280a0f8842A65", // BNB Chain
  137:   "0x111111125421cA6dc452d289314280a0f8842A65", // Polygon
  250:   "0x111111125421cA6dc452d289314280a0f8842A65", // Fantom
  8453:  "0x111111125421cA6dc452d289314280a0f8842A65", // Base
  42161: "0x111111125421cA6dc452d289314280a0f8842A65", // Arbitrum One
  43114: "0x111111125421cA6dc452d289314280a0f8842A65", // Avalanche C-Chain
  100:   "0x111111125421cA6dc452d289314280a0f8842A65", // Gnosis
  1101:  "0x111111125421cA6dc452d289314280a0f8842A65", // Polygon zkEVM
  59144: "0x111111125421cA6dc452d289314280a0f8842A65", // Linea
  534352:"0x111111125421cA6dc452d289314280a0f8842A65", // Scroll
  81457: "0x111111125421cA6dc452d289314280a0f8842A65", // Blast
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

    const routerAddress = SWAP_ROUTER_ADDRESSES[body.chainId];
    if (!routerAddress) {
      return NextResponse.json(
        { error: `Chain ${body.chainId} is not supported by the 1inch router` },
        { status: 400 }
      );
    }

    const quote = await getQuotes(body);

    const transaction = {
      to: routerAddress,
      // NOTE: Transaction data is a placeholder for simulation purposes.
      // In production, fetch the calldata from the 1inch Swap API v6:
      //   GET https://api.1inch.dev/swap/v6.0/{chainId}/swap
      //     ?src={fromToken}&dst={toToken}&amount={amount}
      //     &from={fromAddress}&slippage={slippage}
      // Then set `data` to the `tx.data` field of the API response.
      // Requires an API key from https://portal.1inch.dev/
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
