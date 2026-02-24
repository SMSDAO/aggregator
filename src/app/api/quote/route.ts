import { NextRequest, NextResponse } from "next/server";
import { getQuotes, calcPlatformFee } from "@/lib";
import type { QuoteRequest } from "@/lib";

/** Validate that `s` is a non-negative integer string (no decimals, no sign). */
function isIntegerString(s: string): boolean {
  return /^\d+$/.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteRequest;

    if (!body.fromToken || !body.toToken || !body.amount || !body.chainId) {
      return NextResponse.json(
        { error: "Missing required fields: fromToken, toToken, amount, chainId" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(Number(body.chainId)) || !Number.isInteger(Number(body.chainId))) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }
    if (!isIntegerString(String(body.amount))) {
      return NextResponse.json({ error: "amount must be a non-negative integer string" }, { status: 400 });
    }

    const result = await getQuotes(body);
    const platformFee = calcPlatformFee(body.amount);
    return NextResponse.json({ ...result, platformFee });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromToken = searchParams.get("fromToken");
  const toToken = searchParams.get("toToken");
  const amount = searchParams.get("amount");
  const chainId = searchParams.get("chainId");

  if (!fromToken || !toToken || !amount || !chainId) {
    return NextResponse.json(
      { error: "Missing required params: fromToken, toToken, amount, chainId" },
      { status: 400 }
    );
  }

  const parsedChainId = parseInt(chainId, 10);
  if (!Number.isFinite(parsedChainId)) {
    return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
  }
  if (!isIntegerString(amount)) {
    return NextResponse.json({ error: "amount must be a non-negative integer string" }, { status: 400 });
  }
  const slippageRaw = searchParams.get("slippage");
  const slippage = slippageRaw ? parseFloat(slippageRaw) : 0.5;
  if (!Number.isFinite(slippage) || slippage < 0 || slippage > 50) {
    return NextResponse.json({ error: "slippage must be a number between 0 and 50" }, { status: 400 });
  }

  try {
    const result = await getQuotes({
      fromToken,
      toToken,
      amount,
      chainId: parsedChainId,
      slippage,
    });
    const platformFee = calcPlatformFee(amount);
    return NextResponse.json({ ...result, platformFee });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
