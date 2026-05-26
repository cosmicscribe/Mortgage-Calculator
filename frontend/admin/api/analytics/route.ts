import { NextResponse } from "next/server";
import { getAdminSnapshot } from "@/lib/admin-store";

export async function GET() {
  const snapshot = getAdminSnapshot();

  return NextResponse.json({
    analytics: snapshot.analytics
  });
}
