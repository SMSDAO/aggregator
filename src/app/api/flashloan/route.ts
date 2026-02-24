import { NextRequest, NextResponse } from "next/server";
import { getFlashLoanQuotes, calcPlatformFee } from "@/lib";
import type { FlashLoanRequest } from "@/lib";

/** Validate that `s` is a non-negative integer string (no decimals, no sign). */
function isIntegerString(s: string): boolean {
  return /^\d+$/.test(s);
}

/** Loose Ethereum address check: 0x + 40 hex chars. */
function isAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FlashLoanRequest;

    if (!body.asset || !body.amount || !body.chainId || !body.targetContract) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: asset, amount, chainId, targetContract",
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(Number(body.chainId)) || !Number.isInteger(Number(body.chainId))) {
      return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
    }
    if (!isIntegerString(String(body.amount))) {
      return NextResponse.json({ error: "amount must be a non-negative integer string" }, { status: 400 });
    }
    if (!isAddress(body.asset)) {
      return NextResponse.json({ error: "asset must be a valid Ethereum address" }, { status: 400 });
    }
    if (!isAddress(body.targetContract)) {
      return NextResponse.json({ error: "targetContract must be a valid Ethereum address" }, { status: 400 });
    }

    const result = await getFlashLoanQuotes(body);
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
  const asset = searchParams.get("asset");
  const amount = searchParams.get("amount");
  const chainId = searchParams.get("chainId");
  const targetContract =
    searchParams.get("targetContract") ??
    "0x0000000000000000000000000000000000000000";

  if (!asset || !amount || !chainId) {
    return NextResponse.json(
      { error: "Missing required params: asset, amount, chainId" },
      { status: 400 }
    );
  }

  const parsedChainId = parseInt(chainId, 10);
  if (!Number.isFinite(parsedChainId)) {
    return NextResponse.json(
      { error: "Invalid chainId" },
      { status: 400 }
    );
  }
  if (!isIntegerString(amount)) {
    return NextResponse.json({ error: "amount must be a non-negative integer string" }, { status: 400 });
  }
  if (!isAddress(asset)) {
    return NextResponse.json({ error: "asset must be a valid Ethereum address" }, { status: 400 });
  }

  try {
    const result = await getFlashLoanQuotes({
      asset,
      amount,
      chainId: parsedChainId,
      targetContract,
      params: "0x",
    });
    const platformFee = calcPlatformFee(amount);
    return NextResponse.json({ ...result, platformFee });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
