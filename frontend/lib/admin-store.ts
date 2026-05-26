import { calculateRefinance, type RecommendationCode, type RefinanceInput, type RefinanceResult } from "./refinance-engine";
import type { CtaTrackingInput } from "./lead-contracts";

export const leadStatuses = ["new", "contacted", "qualified", "converted", "rejected"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export type CtaType = CtaTrackingInput["ctaType"];

export type CtaEvent = {
  id: string;
  leadId: string;
  decision: RecommendationCode;
  ctaType: CtaType;
  clicked: boolean;
  createdAt: string;
};

export type AdminLead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: "US" | "CA";
  loanBalance: number;
  desiredAction: "REFINANCE_SAVE" | "RENEW_SWITCH";
  status: LeadStatus;
  createdAt: string;
  calculationId: string;
};

export type AdminCalculation = {
  id: string;
  leadId: string;
  inputs: RefinanceInput;
  result: RefinanceResult;
  createdAt: string;
};

export type AdminSettings = {
  defaultInterestRate: number;
  loanTypes: string[];
  countries: Array<"US" | "CA">;
};

type AdminStore = {
  leads: AdminLead[];
  calculations: AdminCalculation[];
  ctaEvents: CtaEvent[];
  formSubmissions: number;
  settings: AdminSettings;
};

const seedInputs: RefinanceInput[] = [
  {
    country: "US",
    currentLoanBalance: 420000,
    currentRate: 6.85,
    currentRemainingYears: 26,
    newRate: 5.95,
    newAmortizationYears: 30,
    termYears: 5,
    closingCosts: 7200,
    cashOutAmount: 0,
    expectedStayYears: 6,
    rollClosingCosts: false
  },
  {
    country: "CA",
    currentLoanBalance: 560000,
    currentRate: 6.35,
    currentRemainingYears: 22,
    newRate: 5.45,
    newAmortizationYears: 25,
    termYears: 5,
    closingCosts: 4800,
    cashOutAmount: 15000,
    expectedStayYears: 4,
    rollClosingCosts: false
  },
  {
    country: "US",
    currentLoanBalance: 315000,
    currentRate: 5.75,
    currentRemainingYears: 24,
    newRate: 6.15,
    newAmortizationYears: 30,
    termYears: 5,
    closingCosts: 6500,
    cashOutAmount: 0,
    expectedStayYears: 3,
    rollClosingCosts: false
  }
];

const seedPeople = [
  ["Avery", "Morgan", "avery@example.com", "+14155550123"],
  ["Maya", "Chen", "maya@example.com", "+14165550124"],
  ["Jordan", "Reed", "jordan@example.com", "+13125550125"]
] as const;

const seedCreatedAt = [
  "2026-05-20T16:30:00.000Z",
  "2026-05-19T15:45:00.000Z",
  "2026-05-18T14:15:00.000Z"
] as const;

function buildSeedStore(): AdminStore {
  const calculations = seedInputs.map((inputs, index) => {
    const leadId = `lead_seed_${index + 1}`;
    return {
      id: `calc_seed_${index + 1}`,
      leadId,
      inputs,
      result: calculateRefinance(inputs),
      createdAt: seedCreatedAt[index]
    };
  });

  const leads: AdminLead[] = calculations.map((calculation, index) => {
    const [firstName, lastName, email, phone] = seedPeople[index];
    return {
      id: calculation.leadId,
      firstName,
      lastName,
      email,
      phone,
      country: calculation.inputs.country,
      loanBalance: calculation.inputs.currentLoanBalance,
      desiredAction: calculation.inputs.country === "CA" ? "RENEW_SWITCH" : "REFINANCE_SAVE",
      status: index === 0 ? "new" : index === 1 ? "contacted" : "qualified",
      createdAt: calculation.createdAt,
      calculationId: calculation.id
    };
  });

  const ctaEvents = calculations.map((calculation, index) => ({
    id: `cta_seed_${index + 1}`,
    leadId: calculation.leadId,
    decision: calculation.result.decision.recommendation,
    ctaType:
      calculation.result.decision.recommendation === "BENEFICIAL"
        ? "primary"
        : calculation.result.decision.recommendation === "TRADE_OFFS"
          ? "secondary"
          : "subtle",
    clicked: true,
    createdAt: calculation.createdAt
  })) satisfies CtaEvent[];

  return {
    leads,
    calculations,
    ctaEvents,
    formSubmissions: calculations.length,
    settings: {
      defaultInterestRate: 5.95,
      loanTypes: ["Conventional", "FHA", "VA", "Jumbo"],
      countries: ["US", "CA"]
    }
  };
}

function emptyStatusCounts(): Record<LeadStatus, number> {
  return Object.fromEntries(leadStatuses.map((status) => [status, 0])) as Record<LeadStatus, number>;
}

function summarizeCtaEvents(events: CtaEvent[]) {
  const clicksByDecision = events.reduce(
    (counts, event) => ({
      ...counts,
      [event.decision]: counts[event.decision] + (event.clicked ? 1 : 0)
    }),
    { BENEFICIAL: 0, TRADE_OFFS: 0, NOT_BENEFICIAL: 0 } satisfies Record<RecommendationCode, number>
  );

  return {
    totalClicks: events.filter((event) => event.clicked).length,
    clicksByDecision
  };
}

const globalWithStore = globalThis as typeof globalThis & {
  __northstarAdminStore?: AdminStore;
};

export function getAdminStore() {
  if (!globalWithStore.__northstarAdminStore) {
    globalWithStore.__northstarAdminStore = buildSeedStore();
  }

  globalWithStore.__northstarAdminStore.ctaEvents ??= [];
  globalWithStore.__northstarAdminStore.leads.forEach((lead) => {
    if (!leadStatuses.includes(lead.status)) {
      lead.status = "rejected";
    }
  });

  return globalWithStore.__northstarAdminStore;
}

export function getLeadDetails(id: string) {
  const store = getAdminStore();
  const lead = store.leads.find((item) => item.id === id);
  const calculation = lead ? store.calculations.find((item) => item.id === lead.calculationId) : undefined;

  if (!lead || !calculation) {
    return null;
  }

  return { lead, calculation };
}

export function getAdminSnapshot() {
  const store = getAdminStore();
  const leads = store.leads.map((lead) => {
    const calculation = store.calculations.find((item) => item.id === lead.calculationId);

    return {
      ...lead,
      decision: calculation?.result.decision.recommendation,
      monthlySavings: calculation?.result.comparison.monthlySavings,
      breakEvenMonths: calculation?.result.comparison.breakEvenMonths,
      leadScore: calculation?.result.decision.leadScore,
      leadQuality: calculation?.result.decision.leadQuality,
      riskBand: calculation?.result.decision.riskBand,
      primaryRiskDriver: calculation?.result.decision.primaryRiskDriver,
      lenderRecommendation: calculation?.result.decision.lenderNote.recommendation
    };
  });
  const firstDetails = leads[0] ? getLeadDetails(leads[0].id) : null;
  const statusCounts = store.leads.reduce(
    (counts, lead) => ({
      ...counts,
      [lead.status]: counts[lead.status] + 1
    }),
    emptyStatusCounts()
  );
  const ctaPerformance = summarizeCtaEvents(store.ctaEvents);

  return {
    leads,
    details: firstDetails,
    settings: store.settings,
    analytics: {
      totalLeads: store.leads.length,
      formSubmissions: store.formSubmissions,
      statusCounts,
      ctaPerformance,
      averageMonthlySavings:
        store.calculations.reduce((sum, item) => sum + item.result.comparison.monthlySavings, 0) /
        Math.max(store.calculations.length, 1)
    }
  };
}

export function addLead(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: "US" | "CA";
  loanBalance: number;
  desiredAction: "REFINANCE_SAVE" | "RENEW_SWITCH";
  inputs?: RefinanceInput;
  ctaTracking?: CtaTrackingInput;
}) {
  const store = getAdminStore();
  const leadId = `lead_${crypto.randomUUID()}`;
  const calculationId = `calc_${crypto.randomUUID()}`;
  const inputs =
    params.inputs ??
    ({
      country: params.country,
      currentLoanBalance: params.loanBalance,
      currentRate: store.settings.defaultInterestRate + 0.9,
      currentRemainingYears: 26,
      newRate: store.settings.defaultInterestRate,
      newAmortizationYears: 30,
      termYears: 5,
      closingCosts: 7200,
      cashOutAmount: 0,
      expectedStayYears: 6,
      rollClosingCosts: false
    } satisfies RefinanceInput);
  const createdAt = new Date().toISOString();
  const result = calculateRefinance(inputs);

  const lead: AdminLead = {
    id: leadId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phone: params.phone,
    country: params.country,
    loanBalance: params.loanBalance,
    desiredAction: params.desiredAction,
    status: "new",
    createdAt,
    calculationId
  };

  store.leads.unshift(lead);
  store.calculations.unshift({
    id: calculationId,
    leadId,
    inputs,
    result,
    createdAt
  });
  if (params.ctaTracking) {
    store.ctaEvents.unshift({
      id: `cta_${crypto.randomUUID()}`,
      leadId,
      decision: params.ctaTracking.decision,
      ctaType: params.ctaTracking.ctaType,
      clicked: params.ctaTracking.clicked,
      createdAt
    });
  }
  store.formSubmissions += 1;

  return lead;
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  const store = getAdminStore();
  const lead = store.leads.find((item) => item.id === id);

  if (!lead) {
    return null;
  }

  lead.status = status;
  return lead;
}

export function updateSettings(settings: AdminSettings) {
  const store = getAdminStore();
  store.settings = settings;
  return store.settings;
}
