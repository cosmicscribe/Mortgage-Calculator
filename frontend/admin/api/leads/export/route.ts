import { getAdminStore } from "@/lib/admin-store";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  const store = getAdminStore();
  const rows = [
    [
      "lead_id",
      "name",
      "email",
      "phone",
      "country",
      "status",
      "loan_balance",
      "decision",
      "lead_score",
      "lead_quality",
      "risk_band",
      "primary_risk",
      "lender_action",
      "cta_decision",
      "cta_type",
      "cta_clicked",
      "monthly_savings",
      "created_at"
    ],
    ...store.leads.map((lead) => {
      const calculation = store.calculations.find((item) => item.id === lead.calculationId);
      const ctaEvent = store.ctaEvents.find((item) => item.leadId === lead.id);

      return [
        lead.id,
        `${lead.firstName} ${lead.lastName}`,
        lead.email,
        lead.phone,
        lead.country,
        lead.status,
        lead.loanBalance,
        calculation?.result.decision.recommendation,
        calculation?.result.decision.leadScore,
        calculation?.result.decision.leadQuality,
        calculation?.result.decision.riskBand,
        calculation?.result.decision.primaryRiskDriver?.key,
        calculation?.result.decision.lenderNote.recommendation,
        ctaEvent?.decision,
        ctaEvent?.ctaType,
        ctaEvent?.clicked,
        calculation?.result.comparison.monthlySavings,
        lead.createdAt
      ];
    })
  ];

  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
    headers: {
      "Content-Disposition": "attachment; filename=leads.csv",
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
