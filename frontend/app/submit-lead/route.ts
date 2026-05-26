import { NextResponse } from "next/server";
import { addLead } from "@/lib/admin-store";
import { createLeadId, leadSubmissionSchema, type LeadSubmissionResponse } from "@/lib/lead-contracts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid lead submission.",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const lead = addLead(parsed.data);
    const response: LeadSubmissionResponse = {
      leadId: lead.id || createLeadId(),
      status: "received",
      nextStep: "A licensed mortgage advisor will review the scenario and follow up."
    };

    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: "Malformed request body."
      },
      { status: 400 }
    );
  }
}
