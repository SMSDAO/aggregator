import { NextRequest, NextResponse } from "next/server";
import { getFlashLoanQuotes, calcPlatformFee } from "@/lib";
import type { FlashLoanRequest } from "@/lib";

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

  try {
    const result = await getFlashLoanQuotes({
      asset,
      amount,
      chainId: parseInt(chainId, 10),
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
