import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib";
import type { QuoteRequest } from "@/lib";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteRequest;

    if (!body.fromToken || !body.toToken || !body.amount || !body.chainId) {
      return NextResponse.json(
        { error: "Missing required fields: fromToken, toToken, amount, chainId" },
        { status: 400 }
      );
    }

    const result = await getQuotes(body);
    return NextResponse.json(result);
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

  try {
    const result = await getQuotes({
      fromToken,
      toToken,
      amount,
      chainId: parseInt(chainId, 10),
      slippage: parseFloat(searchParams.get("slippage") ?? "0.5"),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
