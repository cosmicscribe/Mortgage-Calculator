const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../lib/refinance-engine.ts");
const source = fs.readFileSync(filename, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText;

const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(output, filename);

const {
  calculateCanadaMonthlyRate,
  calculateMonthlyPayment,
  calculateRefinance,
  calculateUsMonthlyRate,
  refinanceInputSchema
} = mod.exports;

const cents = (value) => Math.round(value * 100) / 100;
const near = (actual, expected, tolerance = 0.01) => Math.abs(actual - expected) <= tolerance;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(name, actual, expected, tolerance = 0.01) {
  assert(near(actual, expected, tolerance), `${name}: expected ${expected} +/- ${tolerance}, got ${actual}`);
}

function assertDecision(name, input, expectedDecision, extraChecks = () => undefined) {
  const result = calculateRefinance(input);
  assert(
    result.decision.recommendation === expectedDecision,
    `${name}: expected ${expectedDecision}, got ${result.decision.recommendation}`
  );
  extraChecks(result);

  return result;
}

function hasFactor(result, key, points) {
  return result.decision.riskScoreFactors.some((factor) => factor.key === key && factor.points === points);
}

const base = {
  country: "US",
  currentLoanBalance: 400000,
  currentRate: 7,
  currentRemainingYears: 25,
  newRate: 5.25,
  newAmortizationYears: 25,
  termYears: 5,
  closingCosts: 6000,
  points: 0,
  cashOutAmount: 0,
  expectedStayYears: 7,
  rollClosingCosts: false
};

const usMonthlyRate = calculateUsMonthlyRate(6);
const caMonthlyRate = calculateCanadaMonthlyRate(6);
assert(near(usMonthlyRate, 0.005, 0.0000000001), "US monthly rate must equal nominal annual rate / 12.");
assert(
  near(caMonthlyRate, Math.pow(1 + 0.06 / 2, 2 / 12) - 1, 0.0000000001),
  "Canada monthly rate must use semi-annual compounding conversion."
);
assert(caMonthlyRate !== usMonthlyRate, "Canada and US monthly rates must differ for the same nominal rate.");
assert(
  near(calculateMonthlyPayment(400000, usMonthlyRate, 360), 2398.2),
  "US PMT for $400k at 6% over 30 years should match lender math."
);

const cleanWin = assertDecision(
  "Clean win",
  { ...base, currentRate: 7.25, newRate: 5.25, expectedStayYears: 7 },
  "BENEFICIAL",
  (result) => {
    assert(result.decision.warnings.length === 0, "Clean win should not contain advisory warnings.");
    assert(result.decision.riskScore === 0, "Clean win must have a zero advisor risk score.");
    assert(result.decision.riskBand === "LOW", "Clean win must have low risk band.");
    assert(result.riskLevel === "Low", "Top-level risk level must mirror the risk band.");
    assert(result.decision.leadScore === 100, "Clean win must have top lead score.");
    assert(result.decision.lenderNote.recommendation === "FAST_TRACK", "Clean win should be fast-track lender note.");
    assert(result.comparison.exactBreakEvenMonth === result.exact_break_even_month, "Exact break-even aliases must match.");
    assert(result.comparison.exactBreakEvenMonth === 13, "Clean win should use month-by-month break-even.");
    assert(result.comparison.interestSavedStayPeriod > 0, "Clean win must save interest over the stay period.");
    assert(result.comparison.interestSavedFullTerm > result.comparison.interestSavedStayPeriod, "Full-term interest impact must be secondary and separate.");
  }
);

assertDecision(
  "Zero savings",
  { ...base, currentRate: 6, newRate: 6, closingCosts: 0, expectedStayYears: 5 },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.breakEvenMonths === null, "Zero savings must return null break-even.");
    assert(near(result.comparison.trueNetOutcome, 0), "Zero savings and zero costs should produce zero true net.");
  }
);

assertDecision(
  "Negative savings",
  { ...base, currentRate: 5.5, newRate: 6.25, closingCosts: 3000, expectedStayYears: 5 },
  "NOT_BENEFICIAL",
  (result) => {
    assert(result.comparison.monthlySavings < 0, "Scenario must have negative monthly savings.");
    assert(result.comparison.breakEvenMonths === null, "Negative savings must return null break-even.");
    assert(result.comparison.interestSavedStayPeriod < 0, "Stay-period interest should worsen.");
  }
);

assertDecision(
  "Break-even after stay",
  { ...base, currentRate: 7, newRate: 6.7, closingCosts: 9000, expectedStayYears: 1 },
  "NOT_BENEFICIAL",
  (result) => {
    assert(result.comparison.breakEvenMonths > 12, "Break-even should exceed stay period.");
    assert(hasFactor(result, "LATE_BREAK_EVEN", 25), "Break-even longer than 24 months must add +25 risk.");
  }
);

assertDecision(
  "Cash-out amortization cost",
  { ...base, newRate: 3, newAmortizationYears: 30, cashOutAmount: 75000, expectedStayYears: 5 },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.monthlySavings > 0, "Cash-out scenario must prove positive monthly savings.");
    assert(result.comparison.cashOutCostOverStay > 0, "Cash-out must carry separate interest cost over stay.");
    assert(result.comparison.termExtensionMonths === 60, "Term extension months must be explicit.");
    assert(result.comparison.breakEvenMonths > 60, "Cash-out impact must be included in break-even recovery.");
    assert(hasFactor(result, "CASH_OUT", 20), "Cash-out greater than 5% of loan must add +20 risk.");
  }
);

assertDecision(
  "Five-year-plus term extension",
  { ...base, currentRemainingYears: 20, newRate: 4.25, newAmortizationYears: 30, expectedStayYears: 10 },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.trueNetOutcome > 0, "Term extension scenario should have positive true net outcome.");
    assert(result.decision.warnings.some((warning) => warning.includes("extends")), "Term extension warning missing.");
    assert(result.comparison.termExtensionMonths === 120, "Term extension should be 120 months.");
    assert(hasFactor(result, "TERM_EXTENSION_MAJOR", 25), "Term extension over 60 months must add +25 risk before offsets.");
  }
);

assertDecision(
  "Very small savings",
  { ...base, currentRate: 6, newRate: 5.95, closingCosts: 100, expectedStayYears: 10 },
  "BENEFICIAL",
  (result) => {
    assert(result.comparison.monthlySavings > 0 && result.comparison.monthlySavings < 50, "Scenario must have small savings.");
    assert(hasFactor(result, "LOW_SAVINGS", 15), "Small savings should add +15 advisor risk points before offsets.");
    assert(hasFactor(result, "LATE_BREAK_EVEN", -15), "Break-even under 12 months should reduce risk by 15.");
  }
);

assertDecision(
  "High points",
  { ...base, currentRate: 7, newRate: 5.25, points: 3, expectedStayYears: 7 },
  "BENEFICIAL",
  (result) => {
    const expectedPointsCost = cents((3 / 100) * result.proposed.loanAmount);
    assert(near(result.comparison.pointsCost, expectedPointsCost), "Points cost must equal points percent times new loan amount.");
    assert(
      near(result.comparison.totalUpfrontCost, base.closingCosts + expectedPointsCost),
      "Upfront cost must include closing costs and points."
    );
  }
);

const usSameInput = calculateRefinance({ ...base, country: "US", currentRate: 6, newRate: 5, closingCosts: 5000 });
const caSameInput = calculateRefinance({ ...base, country: "CA", currentRate: 6, newRate: 5, closingCosts: 5000, points: 0 });
assert(
  usSameInput.proposed.monthlyPayment !== caSameInput.proposed.monthlyPayment,
  "Canada and USA payments must differ for same nominal inputs."
);

const sourceOfTruthScenario = assertDecision(
  "Source of truth stay-period model",
  {
    ...base,
    currentLoanBalance: 420000,
    currentRate: 6.85,
    currentRemainingYears: 26,
    newRate: 5.95,
    newAmortizationYears: 30,
    closingCosts: 7200,
    points: 2,
    cashOutAmount: 10000,
    expectedStayYears: 10
  },
  "TRADE_OFFS",
  (result) => {
    const expectedTrueNet =
      result.comparison.monthlySavings * 120 -
      result.comparison.totalUpfrontCost -
      result.comparison.cashOutCostOverStay;
    assertClose("Source of truth trueNetOutcome", result.comparison.trueNetOutcome, expectedTrueNet, 0.01);
    assert(result.comparison.interestSavedStayPeriod > 0, "Stay-period interest should improve.");
    assert(result.comparison.interestSavedFullTerm < 0, "Full-term interest should worsen.");
    assertClose("Effective monthly benefit", result.comparison.effectiveMonthlyBenefit, result.comparison.interestSavedStayPeriod / 120, 0.01);
    assertClose("Cash-out ROI", result.comparison.cashOutROI, result.comparison.trueNetOutcome / result.comparison.cashOutAmount, 0.01);
    assert(hasFactor(result, "RATE_SENSITIVITY", 5), "Rate improvement under 1% must add sensitivity risk.");
    assert(result.decision.riskScore === 70, "Risk model must follow explicit additive rules.");
    assert(result.decision.riskBand === "HIGH", "Source scenario must be high risk.");
    assert(
      result.decision.explanationPoints.some((point) => point.includes("Positive return, but structure-driven risk")),
      "High-risk positive cash-out ROI must include a tension-resolving advisor insight."
    );
    assert(
      result.decision.warnings.includes("Positive cash-out return is paired with high structural risk."),
      "High-risk positive cash-out ROI must add a warning."
    );
    assert(result.decision.primaryRiskDriver?.key === "INTEREST_INCREASE", "Primary risk driver must reflect the largest additive risk.");
    assert(result.decision.lenderNote.recommendation === "LO_REVIEW_REQUIRED", "Source of truth must require lender review.");
  }
);

assertDecision(
  "Debt vs benefit high warning",
  {
    ...base,
    cashOutAmount: 10000,
    closingCosts: 14972,
    currentRate: 7,
    newRate: 6.25,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.trueNetOutcome > 0, "Debt-vs-benefit scenario must have positive true net.");
    assert(result.comparison.debtVsBenefit !== null, "Debt-vs-benefit insight must show when cash-out and true net are positive.");
    assert(result.comparison.cashOutROI !== null, "Cash-out ROI must show when cash-out and true net are positive.");
    assert(hasFactor(result, "TIGHT_RECOVERY_WINDOW", 10), "Break-even after 70% of stay must add tight recovery-window risk.");
    assert(result.comparison.debtVsBenefit?.severity === "high", "Debt-vs-benefit ratio >= 50 must be high severity.");
    assert(result.comparison.debtVsBenefit?.ratio >= 50, "Debt-vs-benefit ratio must be at least 50.");
    assert(
      result.comparison.debtVsBenefit?.message === "You are taking on $10,000 in additional debt for $161 in net benefit.",
      "Debt-vs-benefit message must clearly compare debt increase to net benefit."
    );
  }
);

assertDecision(
  "Debt vs benefit extreme warning",
  {
    ...base,
    cashOutAmount: 10000,
    closingCosts: 15100,
    currentRate: 7,
    newRate: 6.25,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.debtVsBenefit !== null, "Extreme debt-vs-benefit insight must show.");
    assert(result.comparison.debtVsBenefit?.ratio >= 100, "Extreme debt-vs-benefit ratio must be at least 100.");
  }
);

assertDecision(
  "Canada debt vs benefit warning",
  {
    ...base,
    country: "CA",
    points: 0,
    cashOutAmount: 10000,
    closingCosts: 14800,
    currentRate: 7,
    newRate: 6.25,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.debtVsBenefit !== null, "Canada debt-vs-benefit insight must show.");
    assert(result.comparison.debtVsBenefit?.severity === "high", "Canada debt-vs-benefit warning must use the same severity logic.");
  }
);

for (const result of [cleanWin, usSameInput, caSameInput, sourceOfTruthScenario]) {
  assert(Number.isFinite(result.comparison.trueNetOutcome), "Scenario output must remain finite.");
  assert(Number.isFinite(result.interestSavedStayPeriod), "Top-level stay-period interest output must be finite.");
  assert(Number.isFinite(result.interestSavedFullTerm), "Top-level full-term interest output must be finite.");
  assert(result.currentPayment === result.current.monthlyPayment, "Top-level currentPayment must mirror nested current monthly payment.");
  assert(result.newPayment === result.proposed.monthlyPayment, "Top-level newPayment must mirror nested proposed monthly payment.");
}

assert(
  !refinanceInputSchema.safeParse({ ...base, rollClosingCosts: true }).success,
  "Financed closing costs must be rejected because the model treats closing costs as upfront."
);

assert(sourceOfTruthScenario.advisor_summary === sourceOfTruthScenario.decision.advisorSummary, "Top-level advisor summary must mirror decision summary.");
assert(sourceOfTruthScenario.lender_note.recommendation === sourceOfTruthScenario.decision.lenderNote.recommendation, "Top-level lender note must mirror decision lender note.");
assert(sourceOfTruthScenario.primary_risk_driver?.key === sourceOfTruthScenario.decision.primaryRiskDriver?.key, "Top-level primary risk driver must mirror decision driver.");
assert(sourceOfTruthScenario.lead_score === sourceOfTruthScenario.decision.leadScore, "Top-level lead score must mirror decision lead score.");
assert(sourceOfTruthScenario.risk_band === sourceOfTruthScenario.decision.riskBand, "Top-level risk band must mirror decision risk band.");

const allowedRiskBands = new Set(["LOW", "MODERATE", "HIGH"]);
assert(
  [cleanWin, sourceOfTruthScenario, usSameInput, caSameInput].every((result) => allowedRiskBands.has(result.decision.riskBand)),
  "Risk band taxonomy must stay aligned to LOW/MODERATE/HIGH."
);

console.log("Refinance audit passed.");
console.table(
  [
    ["Clean win", cleanWin],
    ["US same nominal", usSameInput],
    ["CA same nominal", caSameInput],
    ["Source of truth", sourceOfTruthScenario]
  ].map(([name, result]) => ({
    scenario: name,
    decision: result.decision.recommendation,
    monthlyPaymentNew: result.proposed.monthlyPayment,
    monthlySavings: cents(result.comparison.monthlySavings),
    breakEvenMonths: result.comparison.breakEvenMonths === null ? null : cents(result.comparison.breakEvenMonths),
    trueNetOutcome: cents(result.comparison.trueNetOutcome),
    interestSavedStayPeriod: cents(result.comparison.interestSavedStayPeriod),
    effectiveMonthlyBenefit: cents(result.comparison.effectiveMonthlyBenefit),
    interestSavedFullTerm: cents(result.comparison.interestSavedFullTerm),
    cashOutCostOverStay: cents(result.comparison.cashOutCostOverStay),
    cashOutROI: result.comparison.cashOutROI === null ? null : cents(result.comparison.cashOutROI),
    riskScore: result.decision.riskScore,
    riskBand: result.decision.riskBand,
    leadScore: result.decision.leadScore,
    lender: result.decision.lenderNote.recommendation
  }))
);
