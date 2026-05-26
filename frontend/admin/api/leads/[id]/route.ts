import { NextResponse } from "next/server";
import { getLeadDetails, leadStatuses, updateLeadStatus, type LeadStatus } from "@/lib/admin-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const details = getLeadDetails(id);

  if (!details) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json(details);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status?: LeadStatus };

  if (!body.status || !leadStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
  }

  const lead = updateLeadStatus(id, body.status);

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
