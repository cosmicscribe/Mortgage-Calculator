import { NextResponse } from "next/server";
import { updateSettings } from "@/lib/admin-store";
import { getAdminStore } from "@/lib/admin-store";

export async function GET() {
  return NextResponse.json({ settings: getAdminStore().settings });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    defaultInterestRate?: number;
    loanTypes?: string[];
    countries?: Array<"US" | "CA">;
  };

  if (
    typeof body.defaultInterestRate !== "number" ||
    body.defaultInterestRate < 0 ||
    body.defaultInterestRate > 30 ||
    !Array.isArray(body.loanTypes) ||
    body.loanTypes.length === 0 ||
    !Array.isArray(body.countries) ||
    body.countries.length === 0
  ) {
    return NextResponse.json({ error: "Invalid settings input." }, { status: 400 });
  }

  return NextResponse.json({
    settings: updateSettings({
      defaultInterestRate: body.defaultInterestRate,
      loanTypes: body.loanTypes.map((item) => item.trim()).filter(Boolean),
      countries: body.countries.filter((country) => country === "US" || country === "CA")
    })
  });
}
