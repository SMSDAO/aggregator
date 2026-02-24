import { NextRequest, NextResponse } from "next/server";
import { getCrossChainQuotes } from "@/lib";
import type { CrossChainQuoteRequest } from "@/lib";

/**
 * GET /api/cross-chain-quote
 * Query params: fromChainId, toChainId, fromToken, toToken, amount,
 *               fromAddress, toAddress?, slippage?, aggregators? (comma-separated)
 *
 * POST /api/cross-chain-quote
 * Body: CrossChainQuoteRequest JSON
 *
 * Returns the best cross-chain route across Li.Fi, Socket, and Squid,
 * plus all alternatives for comparison.
 */

function parseRequest(
  params: Record<string, string | null>
): CrossChainQuoteRequest {
  const {
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    amount,
    fromAddress,
    toAddress,
    slippage,
    aggregators,
  } = params;

  if (
    !fromChainId ||
    !toChainId ||
    !fromToken ||
    !toToken ||
    !amount ||
    !fromAddress
  ) {
    throw new Error(
      "Missing required fields: fromChainId, toChainId, fromToken, toToken, amount, fromAddress"
    );
  }

  return {
    fromChainId: parseInt(fromChainId, 10),
    toChainId: parseInt(toChainId, 10),
    fromToken,
    toToken,
    amount,
    fromAddress,
    toAddress: toAddress ?? undefined,
    slippage: slippage ? parseFloat(slippage) : undefined,
    aggregators: aggregators ? aggregators.split(",").map((s) => s.trim()) : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const req = parseRequest({
      fromChainId: searchParams.get("fromChainId"),
      toChainId: searchParams.get("toChainId"),
      fromToken: searchParams.get("fromToken"),
      toToken: searchParams.get("toToken"),
      amount: searchParams.get("amount"),
      fromAddress: searchParams.get("fromAddress"),
      toAddress: searchParams.get("toAddress"),
      slippage: searchParams.get("slippage"),
      aggregators: searchParams.get("aggregators"),
    });

    const result = await getCrossChainQuotes(req);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Missing") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CrossChainQuoteRequest;
    const req = parseRequest({
      fromChainId: body.fromChainId?.toString() ?? null,
      toChainId: body.toChainId?.toString() ?? null,
      fromToken: body.fromToken ?? null,
      toToken: body.toToken ?? null,
      amount: body.amount ?? null,
      fromAddress: body.fromAddress ?? null,
      toAddress: body.toAddress ?? null,
      slippage: body.slippage?.toString() ?? null,
      aggregators: body.aggregators?.join(",") ?? null,
    });

    const result = await getCrossChainQuotes(req);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Missing") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
