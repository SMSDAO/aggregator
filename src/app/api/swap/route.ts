import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@/lib";
import type { SwapRequest } from "@/lib";

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

    const transaction = {
      to: "0x1111111254EEB25477B68fb85Ed929f73A960582",
      data: `0x12aa3caf${body.fromToken.slice(2).padStart(64, "0")}${body.toToken
        .slice(2)
        .padStart(64, "0")}`,
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
