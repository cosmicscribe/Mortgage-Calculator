import { z } from "zod";

export const refinanceInputSchema = z.object({
  country: z.enum(["US", "CA"]),
  currentLoanBalance: z.number().positive(),
  currentRate: z.number().min(0).max(30),
  currentRemainingYears: z.number().positive().max(40),
  newRate: z.number().min(0).max(30),
  newAmortizationYears: z.number().positive().max(40),
  termYears: z.number().positive().max(10).optional(),
  closingCosts: z.number().min(0),
  points: z.number().min(0).default(0),
  cashOutAmount: z.number().min(0),
  expectedStayYears: z.number().positive().max(40),
  rollClosingCosts: z
    .boolean()
    .default(false)
    .refine((value) => !value, {
      message: "Financed closing costs are not supported by this decision model. Enter closing costs as upfront costs."
    })
});

export type RefinanceInput = z.input<typeof refinanceInputSchema>;

export type RecommendationCode = "BENEFICIAL" | "TRADE_OFFS" | "NOT_BENEFICIAL";
export type RecommendationType = "beneficial" | "mixed" | "not_beneficial";
export type ConfidenceLevel = "High" | "Medium" | "Low";
export type RiskFlag = {
  level: "high_risk" | "medium_risk" | "info";
  message: string;
};

export type RiskFactorKey =
  | "CASH_OUT"
  | "DEBT_VS_BENEFIT_EXTREME"
  | "DEBT_VS_BENEFIT_HIGH"
  | "TERM_EXTENSION_MAJOR"
  | "TERM_EXTENSION_MINOR"
  | "INTEREST_INCREASE"
  | "LATE_BREAK_EVEN"
  | "TIGHT_RECOVERY_WINDOW"
  | "LOW_SAVINGS"
  | "RATE_SENSITIVITY";

export type RiskScoreFactor = {
  key: RiskFactorKey;
  points: number;
  message: string;
};

export type PrimaryRiskDriver = {
  key: RiskFactorKey;
  message: string;
} | null;

export type RiskBand = "LOW" | "MODERATE" | "HIGH";
export type LeadQuality = "HIGH" | "MEDIUM" | "LOW";

export type TimeContext = {
  stayPeriod: string;
  breakEven: string;
  shortTerm: "over your expected stay";
  longTerm: "over the full loan term";
};

export type LenderNote = {
  quality: LeadQuality;
  leadScore: number;
  flags: string[];
  recommendation: "FAST_TRACK" | "LO_REVIEW_REQUIRED" | "DO_NOT_PRIORITIZE";
};

export type DebtVsBenefitInsight = {
  ratio: number;
  severity: "low" | "moderate" | "high";
  message: string;
  interpretation: string;
} | null;

export type AmortizationMonth = {
  month_number: number;
  payment: number;
  interest_paid: number;
  principal_paid: number;
  remaining_balance: number;
};

export type RefinanceResult = {
  currentPayment: number;
  newPayment: number;
  monthlySavings: number;
  breakEvenMonths: number | null;
  interestSavedStayPeriod: number;
  interestSavedFullTerm: number;
  effectiveMonthlyBenefit: number;
  trueNetOutcome: number;
  cashOutROI: number | null;
  riskScore: number;
  riskLevel: "Low" | "Moderate" | "High";
  termExtensionMonths: number;
  cashOutCostOverStay: number;
  monthly_payment_current: number;
  monthly_payment_new: number;
  monthly_savings: number;
  break_even_months: number | null;
  exact_break_even_month: number | null;
  stay_period_savings: number;
  true_net_outcome: number;
  interest_difference_rate_only: number;
  interest_saved_stay_period: number;
  interest_saved_full_term: number;
  effective_monthly_benefit: number;
  cash_out_cost_over_stay: number;
  cash_out_roi: number | null;
  net_benefit_after_cash_out: number;
  term_extension_months: number;
  risk_level: "Low" | "Moderate" | "High";
  recommendation: "Refinance is beneficial" | "Refinance has trade-offs" | "Refinance is not beneficial";
  recommendation_type: RecommendationType;
  headline: string;
  summary: string;
  key_points: string[];
  risk_flags: RiskFlag[];
  risk_score: number;
  risk_band: RiskBand;
  risk_score_factors: RiskScoreFactor[];
  lead_score: number;
  lead_quality: LeadQuality;
  primary_risk_driver: PrimaryRiskDriver;
  time_context: TimeContext;
  advisor_summary: string;
  lender_note: LenderNote;
  explanation_points: string[];
  confidence_score: number;
  confidence_label: "high" | "medium" | "low";
  confidence_level: ConfidenceLevel;
  confidence_reason: string;
  confidence_factors: string[];
  explanation_text: string;
  disclaimer: string;
  amortization: Array<{
    month: number;
    currentBalance: number | null;
    proposedBalance: number | null;
  }>;
  current_schedule: AmortizationMonth[];
  new_schedule: AmortizationMonth[];
  amortization_summary: {
    total_interest_current: number;
    total_interest_new: number;
    interest_difference: number;
    interest_saved_stay_period: number;
    interest_saved_full_term: number;
    payoff_time_difference: number;
  };
  current: {
    monthlyPayment: number;
    remainingBalance: number;
    totalInterestRemaining: number;
    totalPaymentsRemaining: number;
    monthsRemaining: number;
  };
  proposed: {
    monthlyPayment: number;
    loanAmount: number;
    remainingBalance: number;
    totalInterest: number;
    totalPayments: number;
    amortizationMonths: number;
    termBalance?: number;
    termInterest?: number;
  };
  costs: {
    closingCosts: number;
    points: number;
    pointsCost: number;
    totalUpfrontCost: number;
    totalClosingCosts: number;
    trueNetOutcome: number;
    trueCostDifference: number;
  };
  comparison: {
    monthlySavings: number;
    breakEvenMonths: number | null;
    exactBreakEvenMonth: number | null;
    stayPeriodSavings: number;
    trueNetOutcome: number;
    debtVsBenefit: DebtVsBenefitInsight;
    interestDifferenceRateOnly: number;
    interestSavedStayPeriod: number;
    interestSavedFullTerm: number;
    effectiveMonthlyBenefit: number;
    cashOutAmount: number;
    cashOutCostOverStay: number;
    cashOutROI: number | null;
    netBenefitAfterCashOut: number;
    termExtensionMonths: number;
    riskLevel: "Low" | "Moderate" | "High";
    pointsCost: number;
    totalUpfrontCost: number;
    totalClosingCosts: number;
    totalCostIncrease: number;
    trueCostDifference: number;
    totalCostDelta: number;
  };
  decision: {
    recommendation: RecommendationCode;
    confidence: "high" | "medium" | "low";
    headline: string;
    summary: string;
    keyPoints: string[];
    riskFlags: RiskFlag[];
    riskScore: number;
    riskBand: RiskBand;
    riskScoreFactors: RiskScoreFactor[];
    leadScore: number;
    leadQuality: LeadQuality;
    primaryRiskDriver: PrimaryRiskDriver;
    timeContext: TimeContext;
    advisorSummary: string;
    lenderNote: LenderNote;
    explanationPoints: string[];
    confidenceScore: number;
    confidenceLevel: ConfidenceLevel;
    confidenceReason: string;
    confidenceFactors: string[];
    debtVsBenefit: DebtVsBenefitInsight;
    reasons: string[];
    warnings: string[];
  };
};

type MortgageBasis = {
  principal: number;
  annualRatePercent: number;
  amortizationMonths: number;
};

type PaymentSchedule = {
  monthlyPayment: number;
  endingBalance: number;
  totalInterest: number;
  totalPayments: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function yearsToMonths(years: number) {
  return Math.round(years * 12);
}

export function calculateUsMonthlyRate(annualRatePercent: number) {
  // USA mortgage convention here: nominal annual rate divided into 12 monthly periods.
  return annualRatePercent / 100 / 12;
}

export function calculateCanadaMonthlyRate(annualRatePercent: number) {
  const annualRate = annualRatePercent / 100;

  // Canada convention: rates are compounded semi-annually, then converted to
  // an equivalent monthly rate for monthly payments.
  return Math.pow(1 + annualRate / 2, 1 / 6) - 1;
}

export function calculateMonthlyPayment(principal: number, monthlyRate: number, months: number) {
  if (monthlyRate === 0) {
    return roundMoney(principal / months);
  }

  // Standard PMT formula:
  // Pmt = P * r / (1 - (1 + r)^-n)
  // where P is principal, r is the periodic monthly rate, and n is months.
  return roundMoney((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
}

export function calculateAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  payment: number,
  months: number,
  clearBalanceAtEnd = true
) {
  const schedule = buildMonthlyAmortizationSchedule(principal, monthlyRate, payment, months, clearBalanceAtEnd);

  return {
    endingBalance: schedule.at(-1)?.remaining_balance ?? roundMoney(principal),
    totalInterest: roundMoney(schedule.reduce((total, row) => total + row.interest_paid, 0)),
    totalPaid: roundMoney(schedule.reduce((total, row) => total + row.payment, 0))
  };
}

export function buildMonthlyAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  payment: number,
  months: number,
  clearBalanceAtEnd = true
): AmortizationMonth[] {
  let balance = principal;
  const schedule: AmortizationMonth[] = [];

  for (let month = 1; month <= months; month += 1) {
    // Each month accrues interest on the current balance; the rest of the
    // payment reduces principal. The final payment is capped to prevent
    // rounding from pushing the ending balance below zero.
    const interest = balance * monthlyRate;
    const isFinalScheduledPayment = clearBalanceAtEnd && month === months;
    const principalPaid = isFinalScheduledPayment ? balance : Math.min(payment - interest, balance);
    const actualPayment = interest + principalPaid;
    balance = Math.max(0, balance - principalPaid);
    if (isFinalScheduledPayment) {
      balance = 0;
    }

    schedule.push({
      month_number: month,
      payment: roundMoney(actualPayment),
      interest_paid: roundMoney(interest),
      principal_paid: roundMoney(principalPaid),
      remaining_balance: roundMoney(balance)
    });

    if (balance === 0) {
      break;
    }
  }

  return schedule;
}

function buildSchedule({ principal, amortizationMonths }: MortgageBasis, monthlyRate: number): PaymentSchedule {
  const payment = calculateMonthlyPayment(principal, monthlyRate, amortizationMonths);
  const schedule = calculateAmortizationSchedule(principal, monthlyRate, payment, amortizationMonths);

  return {
    monthlyPayment: payment,
    endingBalance: schedule.endingBalance,
    totalInterest: schedule.totalInterest,
    totalPayments: schedule.totalPaid
  };
}

function buildUsSchedule(mortgage: MortgageBasis) {
  return buildSchedule(mortgage, calculateUsMonthlyRate(mortgage.annualRatePercent));
}

function buildCanadaSchedule(mortgage: MortgageBasis) {
  return buildSchedule(mortgage, calculateCanadaMonthlyRate(mortgage.annualRatePercent));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatCurrencyShort(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatMonths(value: number | null) {
  return value === null || !Number.isFinite(value) ? "no break-even point" : `${Math.ceil(value)} months`;
}

function recommendationLabel(code: RecommendationCode): RefinanceResult["recommendation"] {
  if (code === "BENEFICIAL") {
    return "Refinance is beneficial";
  }

  if (code === "TRADE_OFFS") {
    return "Refinance has trade-offs";
  }

  return "Refinance is not beneficial";
}

function recommendationType(code: RecommendationCode): RecommendationType {
  if (code === "BENEFICIAL") {
    return "beneficial";
  }

  if (code === "TRADE_OFFS") {
    return "mixed";
  }

  return "not_beneficial";
}

function confidenceLabel(level: ConfidenceLevel): "high" | "medium" | "low" {
  return level.toLowerCase() as "high" | "medium" | "low";
}

function effectiveMortgagePoints(input: RefinanceInput) {
  return input.country === "US" ? input.points ?? 0 : 0;
}

function calculatePointsCost(input: RefinanceInput, loanAmount: number) {
  return loanAmount * (effectiveMortgagePoints(input) / 100);
}

function buildConfidenceScore({
  monthlySavings,
  breakEvenMonths,
  expectedStayMonths,
  cashOutAmount,
  hasTermExtension
}: {
  monthlySavings: number;
  breakEvenMonths: number | null;
  expectedStayMonths: number;
  cashOutAmount: number;
  hasTermExtension: boolean;
}) {
  let score = 70;
  const factors: string[] = [];
  const hasBreakEven = breakEvenMonths !== null && Number.isFinite(breakEvenMonths);

  if (monthlySavings <= 0) {
    score -= 40;
    factors.push("Monthly savings are not positive.");
  } else {
    factors.push("Monthly savings are positive.");
  }

  if (!hasBreakEven) {
    score -= 25;
    factors.push("There is no break-even point.");
  } else {
    if (breakEvenMonths > expectedStayMonths) {
      score -= 25;
      factors.push("Break-even occurs after the expected stay period.");
    } else {
      factors.push("Break-even occurs within the expected stay period.");
    }

    if (breakEvenMonths > expectedStayMonths * 0.7) {
      score -= 10;
      factors.push("Break-even consumes most of the expected stay period.");
    }
  }

  if (cashOutAmount > 0) {
    score -= 5;
    factors.push("Cash-out adds debt.");
  }

  if (hasTermExtension) {
    score -= 5;
    factors.push("The new loan term is longer than the remaining term.");
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  const level: ConfidenceLevel = clampedScore >= 75 ? "High" : clampedScore >= 50 ? "Medium" : "Low";

  return {
    level,
    score: clampedScore,
    reason: `${level} confidence: Score reflects monthly savings, break-even timing, cash-out, and term-extension risk.`,
    factors
  };
}

function buildAdvisorRiskScore({
  cashOutAmount,
  currentLoanBalance,
  debtVsBenefitRatio,
  termExtensionMonths,
  interestDifference,
  breakEvenMonths,
  expectedStayMonths,
  monthlySavings,
  currentPayment,
  currentRate,
  newRate
}: {
  cashOutAmount: number;
  currentLoanBalance: number;
  debtVsBenefitRatio: number | null;
  termExtensionMonths: number;
  interestDifference: number;
  breakEvenMonths: number | null;
  expectedStayMonths: number;
  monthlySavings: number;
  currentPayment: number;
  currentRate: number;
  newRate: number;
}) {
  const rateImprovement = currentRate - newRate;
  const candidateFactors: RiskScoreFactor[] = [
    {
      key: "CASH_OUT",
      points: cashOutAmount > currentLoanBalance * 0.05 ? 20 : 0,
      message: "Cash-out is more than 5% of the loan balance."
    },
    {
      key: "TERM_EXTENSION_MAJOR",
      points: termExtensionMonths > 60 ? 25 : 0,
      message: "Loan term is extended by 5+ years."
    },
    {
      key: "TERM_EXTENSION_MINOR",
      points: termExtensionMonths > 36 && termExtensionMonths <= 60 ? 15 : 0,
      message: "Loan term is extended."
    },
    {
      key: "INTEREST_INCREASE",
      points: interestDifference < 0 ? 25 : 0,
      message: "Total interest increases over the full loan."
    },
    {
      key: "RATE_SENSITIVITY",
      points: rateImprovement > 0 && rateImprovement < 0.75 ? 8 : rateImprovement > 0 && rateImprovement < 1 ? 5 : 0,
      message:
        rateImprovement > 0 && rateImprovement < 0.75
          ? "Benefit is fragile because the rate improvement is under 0.75%."
          : "Benefit depends on a relatively small rate improvement."
    },
    {
      key: "LATE_BREAK_EVEN",
      points: breakEvenMonths !== null && breakEvenMonths > 24 ? 25 : 0,
      message: "Break-even is longer than 24 months."
    },
    {
      key: "TIGHT_RECOVERY_WINDOW",
      points:
        breakEvenMonths !== null && expectedStayMonths > 0 && breakEvenMonths > expectedStayMonths * 0.7 ? 10 : 0,
      message: "Tight recovery window: most savings occur late in your stay."
    },
    {
      key: "LOW_SAVINGS",
      points: monthlySavings > 0 && monthlySavings < 100 ? 15 : 0,
      message: "Monthly savings are relatively small."
    },
    {
      key: "LOW_SAVINGS",
      points: currentPayment > 0 && monthlySavings / currentPayment > 0.15 ? -20 : 0,
      message: "Strong monthly savings reduce refinance risk."
    },
    {
      key: "LATE_BREAK_EVEN",
      points: breakEvenMonths !== null && breakEvenMonths < 12 ? -15 : 0,
      message: "Fast break-even reduces refinance risk."
    }
  ];
  const factors = candidateFactors.filter((factor) => factor.points !== 0);

  const score = Math.min(
    100,
    Math.max(
      0,
      factors.reduce((total, factor) => total + factor.points, 0)
    )
  );
  const primaryFactor = [...factors].filter((factor) => factor.points > 0).sort((a, b) => b.points - a.points)[0] ?? null;
  const primaryRiskDriver = primaryFactor
    ? {
        key: primaryFactor.key,
        message: primaryFactor.message
      }
    : null;

  return { score, factors, primaryRiskDriver };
}

function riskBand(score: number): RiskBand {
  if (score >= 50) {
    return "HIGH";
  }

  if (score >= 20) {
    return "MODERATE";
  }

  return "LOW";
}

function leadQuality(leadScore: number): LeadQuality {
  if (leadScore >= 70) {
    return "HIGH";
  }

  if (leadScore >= 40) {
    return "MEDIUM";
  }

  return "LOW";
}

function listToSentence(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function buildDebtVsBenefitInsight({
  cashOutAmount,
  trueNetOutcome
}: {
  cashOutAmount: number;
  trueNetOutcome: number;
}): DebtVsBenefitInsight {
  if (cashOutAmount <= 0 || trueNetOutcome <= 0) {
    return null;
  }

  const ratio = cashOutAmount / trueNetOutcome;
  const severity: NonNullable<DebtVsBenefitInsight>["severity"] =
    ratio >= 50 ? "high" : ratio >= 10 ? "moderate" : "low";
  const interpretation =
    severity === "high"
      ? "This is a high-risk trade-off. The debt increase is significantly larger than the financial benefit."
      : severity === "moderate"
        ? "The debt increase is meaningfully larger than the benefit. Consider whether the cash-out is necessary."
        : "The debt increase is relatively balanced with the financial benefit.";

  return {
    ratio,
    severity,
    message: `You are taking on ${formatCurrencyShort(cashOutAmount)} in additional debt for ${formatCurrencyShort(trueNetOutcome)} in net benefit.`,
    interpretation
  };
}

function buildDecision(
  input: RefinanceInput,
  monthlySavings: number,
  breakEvenMonths: number | null,
  trueNetOutcome: number,
  interestSavedStayPeriod: number,
  interestSavedFullTerm: number,
  effectiveMonthlyBenefit: number,
  cashOutCostOverStay: number,
  cashOutROI: number | null,
  trueCostDifference: number,
  newLoanAmount: number,
  currentPayment: number
): RefinanceResult["decision"] {
  const expectedStayMonths = yearsToMonths(input.expectedStayYears);
  const termMonths = yearsToMonths(input.termYears ?? 5);
  const hasBreakEven = breakEvenMonths !== null && Number.isFinite(breakEvenMonths);
  const hasBreakEvenWithinStay = hasBreakEven && breakEvenMonths <= expectedStayMonths;
  const hasCashOut = input.cashOutAmount > 0;
  const hasTermExtension = input.newAmortizationYears > input.currentRemainingYears;
  const termExtensionMonths = Math.max(0, yearsToMonths(input.newAmortizationYears - input.currentRemainingYears));
  const hasSignificantTermExtension = termExtensionMonths > 24;
  const hasInterestIncrease = interestSavedFullTerm < 0;
  const hasSmallSavings = monthlySavings > 0 && monthlySavings < 50;
  const hasHardRiskFactors = hasCashOut || hasTermExtension || hasInterestIncrease;
  const debtVsBenefit = buildDebtVsBenefitInsight({
    cashOutAmount: input.cashOutAmount,
    trueNetOutcome
  });
  const advisorRisk = buildAdvisorRiskScore({
    cashOutAmount: input.cashOutAmount,
    currentLoanBalance: input.currentLoanBalance,
    debtVsBenefitRatio: debtVsBenefit?.ratio ?? null,
    termExtensionMonths,
    interestDifference: interestSavedFullTerm,
    breakEvenMonths,
    expectedStayMonths,
    monthlySavings,
    currentPayment,
    currentRate: input.currentRate,
    newRate: input.newRate
  });
  const advisorRiskBand = riskBand(advisorRisk.score);
  const leadScore = Math.max(0, 100 - advisorRisk.score);
  const advisorLeadQuality = leadQuality(leadScore);
  const timeContext: TimeContext = {
    stayPeriod: `${input.expectedStayYears} ${input.expectedStayYears === 1 ? "year" : "years"}`,
    breakEven: hasBreakEven ? `${Math.round(breakEvenMonths)} months` : "no break-even point",
    shortTerm: "over your expected stay",
    longTerm: "over the full loan term"
  };
  const recommendation: RecommendationCode =
    trueNetOutcome < 0
      ? "NOT_BENEFICIAL"
      : trueNetOutcome > 0 && hasBreakEvenWithinStay && advisorRisk.score < 30 && !hasHardRiskFactors
        ? "BENEFICIAL"
        : "TRADE_OFFS";
  const trueNetInsight =
    trueNetOutcome < 0
      ? `Overall financial position worsens by ${formatCurrency(Math.abs(trueNetOutcome))} over your expected stay period after upfront costs and cash-out.`
      : trueNetOutcome > 0
        ? `Overall financial position improves by ${formatCurrency(trueNetOutcome)} over your expected stay period after upfront costs and cash-out.`
        : "Overall financial position is unchanged over your expected stay period after upfront costs and cash-out.";
  const reasons: string[] = [];
  const warnings: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const positiveReturnRiskInsight =
    cashOutROI !== null && cashOutROI > 1 && advisorRisk.score >= 60
      ? `Positive return, but structure-driven risk: this refinance generates a ${cashOutROI.toFixed(2)}x return on the cash taken out, but carries elevated risk because gains depend on staying long enough, preserving the rate advantage, and accepting the term structure.`
      : null;
  const keyPoints = [
    `Monthly savings: ${formatCurrency(monthlySavings)}`,
    `Break-even: ${formatMonths(breakEvenMonths)}`,
    `True net outcome: ${formatCurrency(trueNetOutcome)}`,
    `Advisor risk score: ${advisorRisk.score}/100 (${advisorRiskBand})`,
    `Lead score: ${leadScore}/100 (${advisorLeadQuality})`,
    `True cost impact: ${formatCurrency(trueCostDifference)}`,
    `Savings over your stay period: ${formatCurrency(interestSavedStayPeriod)}`,
    `True monthly benefit: ${formatCurrency(effectiveMonthlyBenefit)}`,
    `Lifetime interest impact: ${formatCurrency(interestSavedFullTerm)}`
  ];
  const explanationPoints = [
    monthlySavings > 0
      ? `Monthly impact: You save ${formatCurrency(monthlySavings)} per month.`
      : `Monthly impact: Your payment increases by ${formatCurrency(Math.abs(monthlySavings))} per month.`,
    !hasBreakEven
      ? "Break-even insight: There is no break-even point because monthly savings are not positive."
      : `Break-even insight: It takes ${formatMonths(breakEvenMonths)} to recover upfront costs.`,
    `Stay vs cost comparison: You plan to stay ${expectedStayMonths} months, producing ${formatCurrency(trueNetOutcome)} in true net outcome after upfront costs and cash-out.`,
    `True net insight: ${trueNetInsight}`,
    `Advisor risk score: ${advisorRisk.score}/100 (${advisorRiskBand}). A score of 30 or higher keeps a positive-net refinance in trade-offs rather than beneficial.`,
    `Savings over your stay period: ${formatCurrency(interestSavedStayPeriod)}. This is the primary interest metric because it matches your expected stay.`,
    `True monthly benefit: ${formatCurrency(effectiveMonthlyBenefit)} per month based on stay-period interest savings.`,
    `Lifetime interest impact: ${formatCurrency(interestSavedFullTerm)}. This is secondary because it assumes the loan runs to payoff.`
  ];

  if (positiveReturnRiskInsight) {
    keyPoints.push(positiveReturnRiskInsight);
    explanationPoints.push(positiveReturnRiskInsight);
    warnings.push("Positive cash-out return is paired with high structural risk.");
  }

  for (const factor of advisorRisk.factors) {
    riskFlags.push({
      level: factor.points >= 25 ? "high_risk" : "medium_risk",
      message: `${factor.message} Risk score +${factor.points}.`
    });
  }

  if (monthlySavings > 0) {
    reasons.push(`Monthly payment drops by ${formatCurrency(monthlySavings)}.`);
  }

  if (hasBreakEven) {
    reasons.push(`Estimated break-even point is ${Math.ceil(breakEvenMonths)} months.`);
  }

  if (input.newRate < input.currentRate) {
    reasons.push("The proposed rate is lower than the current rate.");
  }

  if (input.cashOutAmount > 0) {
    keyPoints.push(`Cash-out impact: Cash-out increases your loan balance by ${formatCurrency(input.cashOutAmount)}.`);
    explanationPoints.push("Cash-out warning: Cash-out increases your debt and reduces net benefit.");
    explanationPoints.push(`Cash-out interest cost over your stay: ${formatCurrency(cashOutCostOverStay)}.`);
    if (debtVsBenefit) {
      keyPoints.push(`Debt vs benefit: ${debtVsBenefit.message}`);
      explanationPoints.push(`Debt vs benefit: ${debtVsBenefit.message} ${debtVsBenefit.interpretation}`);
    }
    if (cashOutROI !== null) {
      keyPoints.push(
        `Cash-out ROI: You are turning ${formatCurrencyShort(input.cashOutAmount)} into ${formatCurrencyShort(trueNetOutcome)} over your stay, a ${cashOutROI.toFixed(2)}x return.`
      );
      explanationPoints.push(
        `Cash-out ROI: You are turning ${formatCurrencyShort(input.cashOutAmount)} into ${formatCurrencyShort(trueNetOutcome)} over your stay, a ${cashOutROI.toFixed(2)}x return.`
      );
    }
    if (trueNetOutcome < 0) {
      explanationPoints.push("Taking cash-out increases your loan balance and results in a net financial loss over your expected stay period.");
    }
    riskFlags.push({
      level: "high_risk",
      message: "Cash-out increases your debt and reduces net benefit."
    });
    warnings.push("Cash-out increases your debt and reduces net benefit.");
  }

  if (hasTermExtension) {
    keyPoints.push(`Term extension: The new loan runs ${termExtensionMonths} months longer than your current remaining term.`);
    explanationPoints.push(`Term extension warning: The new loan runs ${termExtensionMonths} months longer than your current remaining term.`);
    riskFlags.push({
      level: hasSignificantTermExtension ? "high_risk" : "medium_risk",
      message: hasSignificantTermExtension
        ? `The new loan extends the payoff timeline by ${termExtensionMonths} months, which is a significant term extension.`
        : `The new loan extends the payoff timeline by ${termExtensionMonths} months.`
    });
    warnings.push(`The new loan extends the payoff timeline by ${termExtensionMonths} months.`);
  }

  if (hasInterestIncrease) {
    riskFlags.push({
      level: "high_risk",
      message: `Lifetime interest increases by ${formatCurrency(Math.abs(interestSavedFullTerm))}. This is the full-term interest impact.`
    });
    warnings.push("Total interest increases under the proposed loan.");
  } else if (interestSavedFullTerm === 0) {
    riskFlags.push({
      level: "info",
      message: "Total interest is unchanged before considering upfront costs or cash-out."
    });
  }

  if (hasSmallSavings) {
    riskFlags.push({
      level: "medium_risk",
      message: `Monthly savings are small at ${formatCurrency(monthlySavings)}, so the result is sensitive to fees and timing.`
    });
  }

  if (input.country === "CA") {
    const stayVsTerm =
      expectedStayMonths > termMonths
        ? `Your expected stay extends beyond the ${input.termYears ?? 5}-year mortgage term.`
        : `Your expected stay is within the ${input.termYears ?? 5}-year mortgage term.`;
    explanationPoints.push(`${stayVsTerm} Canadian mortgages renew every term. Results may change at renewal.`);
    explanationPoints.push("Canadian mortgages typically do not use points. Rates are set directly.");
    riskFlags.push({
      level: "info",
      message: "Canadian mortgages renew every term. Results may change at renewal."
    });
    riskFlags.push({
      level: "info",
      message: "Canadian mortgages typically do not use points. Rates are set directly."
    });
  }

  if (!hasBreakEven || breakEvenMonths > expectedStayMonths) {
    riskFlags.push({
      level: "high_risk",
      message:
        !hasBreakEven
          ? "There is no break-even point because monthly savings are not positive."
          : `Break-even occurs after your expected stay of ${expectedStayMonths} months.`
    });
  }

  if (trueNetOutcome < 0) {
    riskFlags.push({
      level: "high_risk",
      message: "Although your monthly payment decreases, your overall financial position worsens due to upfront costs and/or cash-out."
    });
    warnings.push("Overall financial position worsens over the expected stay period.");
  }

  if (newLoanAmount > input.currentLoanBalance) {
    warnings.push("The new loan balance is meaningfully higher than the current balance.");
  }

  const monthlySavingsText =
    monthlySavings > 0
      ? `You save ${formatCurrency(monthlySavings)} per month`
      : `Your payment increases by ${formatCurrency(Math.abs(monthlySavings))} per month`;
  const netOutcomeText =
    trueNetOutcome > 0
      ? `${formatCurrency(trueNetOutcome)} in net benefit`
      : trueNetOutcome < 0
        ? `${formatCurrency(Math.abs(trueNetOutcome))} in net loss`
        : "no net gain or loss";
  const riskExplanation = advisorRisk.primaryRiskDriver?.message ?? "there are no major structural risk flags.";
  const stayPeriodImpact =
    trueNetOutcome > 0
      ? "improves your finances"
      : trueNetOutcome < 0
        ? "does not improve your finances"
        : "leaves your finances unchanged";
  const advisorSummary =
    !hasBreakEven
      ? `${monthlySavingsText}, and there is no break-even point because monthly savings are not positive. Over your expected stay (${timeContext.stayPeriod}), this results in ${netOutcomeText}. However, ${riskExplanation} This refinance ${stayPeriodImpact} ${timeContext.shortTerm}, but impacts cost ${timeContext.longTerm}.`
      : `${monthlySavingsText} and break even in ${timeContext.breakEven}. Over your expected stay (${timeContext.stayPeriod}), this results in ${netOutcomeText}. However, ${riskExplanation} This refinance ${stayPeriodImpact} ${timeContext.shortTerm}, but impacts cost ${timeContext.longTerm}.`;
  const lenderFlags = [
    hasCashOut ? "Cash-out present" : null,
    termExtensionMonths >= 60
      ? "Term extension >=5 years"
      : hasTermExtension
        ? "Term extension present"
        : null,
    hasInterestIncrease ? "Interest increase over lifetime" : null,
    advisorRisk.factors.some((factor) => factor.key === "RATE_SENSITIVITY")
      ? "Rate sensitivity"
      : null,
    advisorRisk.factors.some((factor) => factor.key === "TIGHT_RECOVERY_WINDOW")
      ? "Tight recovery window"
      : null,
    debtVsBenefit?.severity === "high"
      ? "High debt-vs-benefit trade-off"
      : debtVsBenefit?.severity === "moderate"
        ? "Moderate debt-vs-benefit trade-off"
        : null,
    !hasBreakEven
      ? "No break-even point"
      : breakEvenMonths > expectedStayMonths
        ? "Break-even exceeds expected stay"
        : breakEvenMonths > expectedStayMonths * 0.7
          ? "Break-even consumes most of stay"
          : null,
    monthlySavings > 0 && monthlySavings < 100 ? "Small monthly savings" : null
  ].filter((item): item is string => item !== null);
  const lenderNote: LenderNote =
    recommendation === "NOT_BENEFICIAL"
      ? {
          quality: advisorLeadQuality,
          leadScore,
          flags: lenderFlags,
          recommendation: "DO_NOT_PRIORITIZE"
        }
      : advisorRisk.score >= 30 || lenderFlags.length > 0
        ? {
            quality: advisorLeadQuality,
            leadScore,
            flags: lenderFlags,
            recommendation: "LO_REVIEW_REQUIRED"
          }
        : {
            quality: advisorLeadQuality,
            leadScore,
            flags: lenderFlags,
            recommendation: "FAST_TRACK"
          };

  const confidence = buildConfidenceScore({
    monthlySavings,
    breakEvenMonths,
    expectedStayMonths,
    cashOutAmount: input.cashOutAmount,
    hasTermExtension
  });
  const stayComparison =
    !hasBreakEven
      ? `Since you plan to stay ${expectedStayMonths} months, there is no break-even recovery window.`
      : `Since you plan to stay ${expectedStayMonths} months, this creates ${formatCurrency(trueNetOutcome)} in true net outcome after upfront costs and cash-out.`;
  const cashFlowTradeoff =
    monthlySavings > 0 && trueNetOutcome < 0
      ? "This refinance improves cash flow but may increase long-term cost."
      : monthlySavings > 0
        ? "This refinance improves cash flow and creates a positive modeled stay-period outcome."
        : trueNetOutcome < 0
          ? "This refinance worsens cash flow and creates a net financial loss over your expected stay period."
          : "This refinance may reduce long-term cost but does not improve monthly cash flow.";
  const commonSummary =
    !hasBreakEven
      ? `${monthlySavingsText}, so upfront costs are not recovered through monthly savings. ${stayComparison} However, after including upfront costs and cash-out, ${trueNetInsight.charAt(0).toLowerCase()}${trueNetInsight.slice(1)} ${cashFlowTradeoff}`
      : `${monthlySavingsText} and recover upfront costs in ${formatMonths(breakEvenMonths)}. ${stayComparison} However, after including upfront costs and cash-out, ${trueNetInsight.charAt(0).toLowerCase()}${trueNetInsight.slice(1)} ${cashFlowTradeoff}`;

  if (recommendation === "NOT_BENEFICIAL") {
    return {
      recommendation: "NOT_BENEFICIAL",
      confidence: confidenceLabel(confidence.level),
      headline: "Refinance is not beneficial.",
      summary: commonSummary,
      keyPoints,
      riskFlags,
      riskScore: advisorRisk.score,
      riskBand: advisorRiskBand,
      riskScoreFactors: advisorRisk.factors,
      leadScore,
      leadQuality: advisorLeadQuality,
      primaryRiskDriver: advisorRisk.primaryRiskDriver,
      timeContext,
      advisorSummary,
      lenderNote,
      explanationPoints,
      confidenceScore: confidence.score,
      confidenceLevel: confidence.level,
      confidenceReason: confidence.reason,
      confidenceFactors: confidence.factors,
      debtVsBenefit,
      reasons: reasons.length ? reasons : ["The refinance does not create a lower true cost under these assumptions."],
      warnings
    };
  }

  if (recommendation === "BENEFICIAL") {
    return {
      recommendation: "BENEFICIAL",
      confidence: confidenceLabel(confidence.level),
      headline: "Refinance is beneficial.",
      summary: commonSummary,
      keyPoints,
      riskFlags,
      riskScore: advisorRisk.score,
      riskBand: advisorRiskBand,
      riskScoreFactors: advisorRisk.factors,
      leadScore,
      leadQuality: advisorLeadQuality,
      primaryRiskDriver: advisorRisk.primaryRiskDriver,
      timeContext,
      advisorSummary,
      lenderNote,
      explanationPoints,
      confidenceScore: confidence.score,
      confidenceLevel: confidence.level,
      confidenceReason: confidence.reason,
      confidenceFactors: confidence.factors,
      debtVsBenefit,
      reasons,
      warnings
    };
  }

  return {
    recommendation: "TRADE_OFFS",
    confidence: confidenceLabel(confidence.level),
    headline: "Refinance has trade-offs.",
    summary: commonSummary,
    keyPoints,
    riskFlags,
    riskScore: advisorRisk.score,
    riskBand: advisorRiskBand,
    riskScoreFactors: advisorRisk.factors,
    leadScore,
    leadQuality: advisorLeadQuality,
    primaryRiskDriver: advisorRisk.primaryRiskDriver,
    timeContext,
    advisorSummary,
    lenderNote,
    explanationPoints,
    confidenceScore: confidence.score,
    confidenceLevel: confidence.level,
    confidenceReason: confidence.reason,
    confidenceFactors: confidence.factors,
    debtVsBenefit,
    reasons,
    warnings
  };
}

function calculateBalanceByMonth(
  principal: number,
  monthlyRate: number,
  payment: number,
  targetMonth: number,
  termMonths: number
) {
  if (targetMonth <= 0) {
    return roundMoney(principal);
  }

  let balance = principal;

  for (let month = 0; month < targetMonth; month += 1) {
    if (balance <= 0) {
      return 0;
    }

    const interest = balance * monthlyRate;
    const principalPaid = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    if (month + 1 === termMonths) {
      balance = 0;
    }
  }

  return roundMoney(balance);
}

function buildAmortizationPreview({
  currentPrincipal,
  proposedPrincipal,
  currentMonthlyRate,
  proposedMonthlyRate,
  currentPayment,
  proposedPayment,
  currentMonths,
  proposedMonths
}: {
  currentPrincipal: number;
  proposedPrincipal: number;
  currentMonthlyRate: number;
  proposedMonthlyRate: number;
  currentPayment: number;
  proposedPayment: number;
  currentMonths: number;
  proposedMonths: number;
}): RefinanceResult["amortization"] {
  const maxMonths = Math.max(currentMonths, proposedMonths);
  const points: RefinanceResult["amortization"] = [];

  for (let month = 0; month <= maxMonths; month += 12) {
    points.push({
      month,
      currentBalance:
        month <= currentMonths
          ? calculateBalanceByMonth(currentPrincipal, currentMonthlyRate, currentPayment, month, currentMonths)
          : null,
      proposedBalance:
        month <= proposedMonths
          ? calculateBalanceByMonth(proposedPrincipal, proposedMonthlyRate, proposedPayment, month, proposedMonths)
          : null
    });
  }

  if (points[points.length - 1]?.month !== maxMonths) {
    points.push({
      month: maxMonths,
      currentBalance:
        maxMonths <= currentMonths
          ? calculateBalanceByMonth(currentPrincipal, currentMonthlyRate, currentPayment, maxMonths, currentMonths)
          : null,
      proposedBalance:
        maxMonths <= proposedMonths
          ? calculateBalanceByMonth(proposedPrincipal, proposedMonthlyRate, proposedPayment, maxMonths, proposedMonths)
          : null
    });
  }

  return points;
}

function sumScheduleInterest(schedule: AmortizationMonth[], months: number) {
  return roundMoney(schedule.slice(0, months).reduce((total, row) => total + row.interest_paid, 0));
}

function calculateExactBreakEvenMonth({
  currentSchedule,
  proposedSchedule,
  monthlySavings,
  recoveryTarget
}: {
  currentSchedule: AmortizationMonth[];
  proposedSchedule: AmortizationMonth[];
  monthlySavings: number;
  recoveryTarget: number;
}) {
  if (monthlySavings <= 0) {
    return null;
  }

  let cumulativeSavings = 0;
  const maxMonths = Math.max(currentSchedule.length, proposedSchedule.length);

  for (let index = 0; index < maxMonths; index += 1) {
    const currentInterest = currentSchedule[index]?.interest_paid ?? 0;
    const proposedInterest = proposedSchedule[index]?.interest_paid ?? 0;
    const extraInterestCost = Math.max(0, proposedInterest - currentInterest);
    cumulativeSavings += monthlySavings - extraInterestCost;

    if (cumulativeSavings >= recoveryTarget) {
      return index + 1;
    }
  }

  return null;
}

function calculateCashOutCostOverStay({
  cashOutAmount,
  currentLoanBalance,
  proposedMonthlyRate,
  proposedMonths,
  stayMonths
}: {
  cashOutAmount: number;
  currentLoanBalance: number;
  proposedMonthlyRate: number;
  proposedMonths: number;
  stayMonths: number;
}) {
  if (cashOutAmount <= 0) {
    return 0;
  }

  const paymentWithCashOut = calculateMonthlyPayment(currentLoanBalance + cashOutAmount, proposedMonthlyRate, proposedMonths);
  const paymentWithoutCashOut = calculateMonthlyPayment(currentLoanBalance, proposedMonthlyRate, proposedMonths);
  const scheduleWithCashOut = buildMonthlyAmortizationSchedule(
    currentLoanBalance + cashOutAmount,
    proposedMonthlyRate,
    paymentWithCashOut,
    proposedMonths
  );
  const scheduleWithoutCashOut = buildMonthlyAmortizationSchedule(
    currentLoanBalance,
    proposedMonthlyRate,
    paymentWithoutCashOut,
    proposedMonths
  );

  return roundMoney(
    sumScheduleInterest(scheduleWithCashOut, stayMonths) - sumScheduleInterest(scheduleWithoutCashOut, stayMonths)
  );
}

function riskLevelFromBand(band: RiskBand): "Low" | "Moderate" | "High" {
  if (band === "HIGH") {
    return "High";
  }

  if (band === "MODERATE") {
    return "Moderate";
  }

  return "Low";
}

function calculateSharedRefinance(
  input: RefinanceInput,
  currentSchedule: PaymentSchedule,
  proposedSchedule: PaymentSchedule,
  currentMonthlyRate: number,
  proposedMonthlyRate: number
): RefinanceResult {
  const currentMonths = yearsToMonths(input.currentRemainingYears);
  const proposedMonths = yearsToMonths(input.newAmortizationYears);
  const newLoanAmount = input.currentLoanBalance + input.cashOutAmount;
  const points = effectiveMortgagePoints(input);
  const pointsCost = calculatePointsCost(input, newLoanAmount);
  const totalUpfrontCost = input.closingCosts + pointsCost;
  const monthlySavings = currentSchedule.monthlyPayment - proposedSchedule.monthlyPayment;
  const stayMonths = yearsToMonths(input.expectedStayYears);
  const staySavings = monthlySavings * stayMonths;
  const currentMonthlySchedule = buildMonthlyAmortizationSchedule(
    input.currentLoanBalance,
    currentMonthlyRate,
    currentSchedule.monthlyPayment,
    currentMonths
  );
  const proposedMonthlySchedule = buildMonthlyAmortizationSchedule(
    newLoanAmount,
    proposedMonthlyRate,
    proposedSchedule.monthlyPayment,
    proposedMonths
  );
  const totalInterestCurrent = currentMonthlySchedule.reduce((total, row) => total + row.interest_paid, 0);
  const totalInterestNew = proposedMonthlySchedule.reduce((total, row) => total + row.interest_paid, 0);
  const interestSavedFullTerm = roundMoney(totalInterestCurrent - totalInterestNew);
  const interestSavedStayPeriod = roundMoney(
    sumScheduleInterest(currentMonthlySchedule, stayMonths) - sumScheduleInterest(proposedMonthlySchedule, stayMonths)
  );
  const effectiveMonthlyBenefit = stayMonths > 0 ? roundMoney(interestSavedStayPeriod / stayMonths) : 0;
  const cashOutCostOverStay = calculateCashOutCostOverStay({
    cashOutAmount: input.cashOutAmount,
    currentLoanBalance: input.currentLoanBalance,
    proposedMonthlyRate,
    proposedMonths,
    stayMonths
  });
  const breakEvenMonths = calculateExactBreakEvenMonth({
    currentSchedule: currentMonthlySchedule,
    proposedSchedule: proposedMonthlySchedule,
    monthlySavings,
    recoveryTarget: totalUpfrontCost + input.cashOutAmount
  });
  const termExtensionMonths = Math.max(0, proposedMonths - currentMonths);
  const extensionPenaltyFactor = 0;
  const stayPeriodSavings = roundMoney(staySavings - totalUpfrontCost);
  const trueNetOutcome = roundMoney(staySavings - totalUpfrontCost - cashOutCostOverStay - extensionPenaltyFactor);
  const cashOutROI =
    input.cashOutAmount > 0 && trueNetOutcome > 0 ? roundMoney(trueNetOutcome / input.cashOutAmount) : null;
  const netBenefitAfterCashOut = roundMoney(trueNetOutcome);
  const trueCostDifference = roundMoney(totalInterestNew + totalUpfrontCost + cashOutCostOverStay - totalInterestCurrent);
  const totalCostIncrease = trueCostDifference;
  const currentTotalPayments = roundMoney(input.currentLoanBalance + totalInterestCurrent);
  const proposedTotalPayments = roundMoney(newLoanAmount + totalInterestNew + totalUpfrontCost);
  const totalCostDelta = trueCostDifference;
  const termMonths = yearsToMonths(input.termYears ?? 5);
  const decision = buildDecision(
    input,
    monthlySavings,
    breakEvenMonths,
    trueNetOutcome,
    interestSavedStayPeriod,
    interestSavedFullTerm,
    effectiveMonthlyBenefit,
    cashOutCostOverStay,
    cashOutROI,
    trueCostDifference,
    newLoanAmount,
    currentSchedule.monthlyPayment
  );
  const decisionRiskLevel = riskLevelFromBand(decision.riskBand);
  const amortization = buildAmortizationPreview({
    currentPrincipal: input.currentLoanBalance,
    proposedPrincipal: newLoanAmount,
    currentMonthlyRate,
    proposedMonthlyRate,
    currentPayment: currentSchedule.monthlyPayment,
    proposedPayment: proposedSchedule.monthlyPayment,
    currentMonths,
    proposedMonths
  });
  const termSchedule =
    input.country === "CA"
      ? calculateAmortizationSchedule(
          newLoanAmount,
          proposedMonthlyRate,
          proposedSchedule.monthlyPayment,
          Math.min(termMonths, proposedMonths),
          false
        )
      : null;

  return {
    currentPayment: roundMoney(currentSchedule.monthlyPayment),
    newPayment: roundMoney(proposedSchedule.monthlyPayment),
    monthlySavings,
    breakEvenMonths,
    interestSavedStayPeriod,
    interestSavedFullTerm,
    effectiveMonthlyBenefit,
    trueNetOutcome,
    cashOutROI,
    riskScore: decision.riskScore,
    riskLevel: decisionRiskLevel,
    termExtensionMonths,
    cashOutCostOverStay,
    monthly_payment_current: roundMoney(currentSchedule.monthlyPayment),
    monthly_payment_new: roundMoney(proposedSchedule.monthlyPayment),
    monthly_savings: monthlySavings,
    break_even_months: breakEvenMonths,
    exact_break_even_month: breakEvenMonths,
    stay_period_savings: stayPeriodSavings,
    true_net_outcome: trueNetOutcome,
    interest_difference_rate_only: interestSavedStayPeriod,
    interest_saved_stay_period: interestSavedStayPeriod,
    interest_saved_full_term: interestSavedFullTerm,
    effective_monthly_benefit: effectiveMonthlyBenefit,
    cash_out_cost_over_stay: cashOutCostOverStay,
    cash_out_roi: cashOutROI,
    net_benefit_after_cash_out: netBenefitAfterCashOut,
    term_extension_months: termExtensionMonths,
    risk_level: decisionRiskLevel,
    recommendation: recommendationLabel(decision.recommendation),
    recommendation_type: recommendationType(decision.recommendation),
    headline: decision.headline,
    summary: decision.summary,
    key_points: decision.keyPoints,
    risk_flags: decision.riskFlags,
    risk_score: decision.riskScore,
    risk_band: decision.riskBand,
    risk_score_factors: decision.riskScoreFactors,
    lead_score: decision.leadScore,
    lead_quality: decision.leadQuality,
    primary_risk_driver: decision.primaryRiskDriver,
    time_context: decision.timeContext,
    advisor_summary: decision.advisorSummary,
    lender_note: decision.lenderNote,
    explanation_points: decision.explanationPoints,
    confidence_score: decision.confidenceScore,
    confidence_label: decision.confidence,
    confidence_level: decision.confidenceLevel,
    confidence_reason: decision.confidenceReason,
    confidence_factors: decision.confidenceFactors,
    explanation_text: decision.summary,
    disclaimer:
      input.country === "CA"
        ? "Canadian estimate uses semi-annual compounding. Mortgage terms renew, so renewal rates can change the result."
        : "Estimate assumes the stated rates, costs, cash-out, and stay period remain unchanged.",
    amortization,
    current_schedule: currentMonthlySchedule,
    new_schedule: proposedMonthlySchedule,
    amortization_summary: {
      total_interest_current: totalInterestCurrent,
      total_interest_new: totalInterestNew,
      interest_difference: interestSavedFullTerm,
      interest_saved_stay_period: interestSavedStayPeriod,
      interest_saved_full_term: interestSavedFullTerm,
      payoff_time_difference: currentMonthlySchedule.length - proposedMonthlySchedule.length
    },
    current: {
      monthlyPayment: currentSchedule.monthlyPayment,
      remainingBalance: roundMoney(input.currentLoanBalance),
      totalInterestRemaining: totalInterestCurrent,
      totalPaymentsRemaining: currentTotalPayments,
      monthsRemaining: currentMonths
    },
    proposed: {
      monthlyPayment: proposedSchedule.monthlyPayment,
      loanAmount: roundMoney(newLoanAmount),
      remainingBalance: roundMoney(newLoanAmount),
      totalInterest: totalInterestNew,
      totalPayments: roundMoney(proposedTotalPayments),
      amortizationMonths: proposedMonths,
      termBalance: termSchedule?.endingBalance,
      termInterest: termSchedule?.totalInterest
    },
    costs: {
      closingCosts: input.closingCosts,
      points,
      pointsCost,
      totalUpfrontCost,
      totalClosingCosts: totalUpfrontCost,
      trueNetOutcome,
      trueCostDifference
    },
    comparison: {
      monthlySavings,
      breakEvenMonths,
      exactBreakEvenMonth: breakEvenMonths,
      stayPeriodSavings,
      trueNetOutcome,
      debtVsBenefit: decision.debtVsBenefit,
      interestDifferenceRateOnly: interestSavedStayPeriod,
      interestSavedStayPeriod,
      interestSavedFullTerm,
      effectiveMonthlyBenefit,
      cashOutAmount: roundMoney(input.cashOutAmount),
      cashOutCostOverStay,
      cashOutROI,
      netBenefitAfterCashOut,
      termExtensionMonths,
      riskLevel: decisionRiskLevel,
      pointsCost,
      totalUpfrontCost,
      totalClosingCosts: totalUpfrontCost,
      totalCostIncrease,
      trueCostDifference,
      totalCostDelta
    },
    decision
  };
}

export function calculateUsRefinance(input: RefinanceInput): RefinanceResult {
  const currentMonths = yearsToMonths(input.currentRemainingYears);
  const proposedMonths = yearsToMonths(input.newAmortizationYears);
  const newLoanAmount = input.currentLoanBalance + input.cashOutAmount;

  const currentSchedule = buildUsSchedule({
    principal: input.currentLoanBalance,
    annualRatePercent: input.currentRate,
    amortizationMonths: currentMonths
  });
  const proposedSchedule = buildUsSchedule({
    principal: newLoanAmount,
    annualRatePercent: input.newRate,
    amortizationMonths: proposedMonths
  });

  return calculateSharedRefinance(
    input,
    currentSchedule,
    proposedSchedule,
    calculateUsMonthlyRate(input.currentRate),
    calculateUsMonthlyRate(input.newRate)
  );
}

export function calculateCanadaRefinance(input: RefinanceInput): RefinanceResult {
  const currentMonths = yearsToMonths(input.currentRemainingYears);
  const proposedMonths = yearsToMonths(input.newAmortizationYears);
  const newLoanAmount = input.currentLoanBalance + input.cashOutAmount;

  const currentSchedule = buildCanadaSchedule({
    principal: input.currentLoanBalance,
    annualRatePercent: input.currentRate,
    amortizationMonths: currentMonths
  });
  const proposedSchedule = buildCanadaSchedule({
    principal: newLoanAmount,
    annualRatePercent: input.newRate,
    amortizationMonths: proposedMonths
  });

  return calculateSharedRefinance(
    input,
    currentSchedule,
    proposedSchedule,
    calculateCanadaMonthlyRate(input.currentRate),
    calculateCanadaMonthlyRate(input.newRate)
  );
}

export function calculateRefinance(input: RefinanceInput): RefinanceResult {
  return input.country === "CA" ? calculateCanadaRefinance(input) : calculateUsRefinance(input);
}
