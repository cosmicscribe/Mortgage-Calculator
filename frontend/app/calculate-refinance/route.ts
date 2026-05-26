import { NextResponse } from "next/server";
import { calculateRefinance, refinanceInputSchema } from "@/lib/refinance-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = refinanceInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid calculation input.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(calculateRefinance(parsed.data));
  } catch {
    return NextResponse.json(
      {
        error: "Malformed request body."
      },
      { status: 400 }
    );
  }
}
