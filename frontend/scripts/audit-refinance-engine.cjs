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
  assert(
    near(actual, expected, tolerance),
    `${name}: expected ${expected} +/- ${tolerance}, got ${actual}`
  );
}

function assertGreaterThanOrEqual(name, actual, expected) {
  assert(actual >= expected, `${name}: expected >= ${expected}, got ${actual}`);
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
  "BENEFICIAL"
);
assert(cleanWin.decision.warnings.length === 0, "Clean win should not contain advisory warnings.");
assert(cleanWin.decision.riskScore < 30, "Clean win must have a low advisor risk score.");
assert(cleanWin.decision.riskBand === "LOW", "Clean win must have low risk band.");
assert(cleanWin.decision.leadScore === 100, "Clean win must have top lead score.");
assert(cleanWin.decision.leadQuality === "HIGH", "Clean win must have high lead quality.");
assert(cleanWin.decision.primaryRiskDriver === null, "Clean win should not have a primary risk driver.");
assert(cleanWin.decision.advisorSummary.includes("You save"), "Clean win must include human advisor summary.");
assert(cleanWin.decision.lenderNote.quality === "HIGH", "Clean win should be high-quality lender lead.");
assert(cleanWin.decision.lenderNote.recommendation === "FAST_TRACK", "Clean win should be fast-track lender note.");

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
  }
);

assertDecision(
  "Break-even after stay",
  { ...base, currentRate: 7, newRate: 6.9, closingCosts: 12000, expectedStayYears: 2 },
  "NOT_BENEFICIAL",
  (result) => {
    assert(
      result.comparison.breakEvenMonths === null ||
        result.comparison.breakEvenMonths > 24 ||
        result.comparison.trueNetOutcome < 0,
      "Break-even-after-stay scenario must not be beneficial."
    );
  }
);

assertDecision(
  "High cash-out trap",
  { ...base, newRate: 3, newAmortizationYears: 30, cashOutAmount: 75000, expectedStayYears: 5 },
  "NOT_BENEFICIAL",
  (result) => {
    assert(result.comparison.monthlySavings > 0, "Cash-out trap must prove positive monthly savings.");
    assert(result.comparison.trueNetOutcome < 0, "Cash-out must reduce true net outcome.");
    assert(result.comparison.debtVsBenefit === null, "Debt-vs-benefit insight must stay hidden when true net is negative.");
    assert(result.decision.riskScore >= 30, "Cash-out trap must carry advisor risk score.");
  }
);

assertDecision(
  "Five-year term extension",
  { ...base, currentRemainingYears: 20, newRate: 4.25, newAmortizationYears: 30, expectedStayYears: 10 },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.trueNetOutcome > 0, "Term extension trap should have positive true net outcome.");
    assert(result.decision.warnings.some((warning) => warning.includes("extends")), "Term extension warning missing.");
    assert(result.decision.riskScore >= 25, "Large term extension must increase advisor risk score.");
  }
);

assertDecision(
  "Very small savings",
  { ...base, currentRate: 6, newRate: 5.95, closingCosts: 100, expectedStayYears: 10 },
  "BENEFICIAL",
  (result) => {
    assert(result.comparison.monthlySavings > 0 && result.comparison.monthlySavings < 50, "Scenario must have small savings.");
    assert(result.decision.riskScore === 15, "Small savings should add 15 advisor risk points.");
    assert(
      result.risk_flags.some((flag) => flag.message.includes("Monthly savings are small")),
      "Small savings risk flag missing."
    );
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

assertDecision(
  "Interest increase despite monthly savings",
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
    assert(result.comparison.monthlySavings > 0, "Scenario must have monthly savings.");
    assert(result.comparison.interestDifferenceRateOnly < 0, "Scenario must increase total interest.");
    assert(result.decision.riskScore >= 70, "Cash-out plus term extension plus interest increase must score as high risk.");
  }
);

assertDecision(
  "Advisor-grade positive net with cash-out and reset",
  {
    ...base,
    currentLoanBalance: 420000,
    currentRate: 7.1,
    currentRemainingYears: 22,
    newRate: 5.25,
    newAmortizationYears: 30,
    closingCosts: 6500,
    points: 0,
    cashOutAmount: 10000,
    expectedStayYears: 7
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.trueNetOutcome > 0, "Advisor-grade reset scenario should prove positive true net.");
    assert(result.decision.riskScore >= 55, "Cash-out plus 5+ year reset must not be low risk.");
    assert(
      result.decision.riskScoreFactors.some((factor) => factor.key === "CASH_OUT") &&
        result.decision.riskScoreFactors.some((factor) => factor.key === "TERM_EXTENSION_MAJOR"),
      "Advisor risk factors must identify cash-out and major term reset."
    );
    assert(result.decision.riskBand === "HIGH", "Advisor-grade reset scenario must be high risk.");
    assert(result.decision.leadScore === 20, "Advisor-grade reset scenario should convert risk into lead score.");
    assert(result.decision.leadQuality === "LOW", "Advisor-grade reset scenario should have low lead quality.");
    assert(result.decision.primaryRiskDriver?.key === "CASH_OUT", "Primary risk driver must be deterministic.");
    assert(result.decision.advisorSummary.includes("However"), "Advisor summary must explain the trade-off.");
    assert(result.decision.advisorSummary.includes("Over your expected stay"), "Advisor summary must include time framing.");
    assert(result.decision.advisorSummary.includes("over the full loan term"), "Advisor summary must include long-term framing.");
    assert(result.decision.lenderNote.quality === "LOW", "Positive-net high-risk scenario should be low-quality lead.");
    assert(result.decision.lenderNote.leadScore === result.decision.leadScore, "Lender note must carry lead score.");
    assert(
      result.decision.lenderNote.recommendation === "LO_REVIEW_REQUIRED",
      "Positive-net risk scenario should require lender review."
    );
    assert(
      result.decision.lenderNote.flags.includes("Cash-out present") &&
        result.decision.lenderNote.flags.includes("Term extension >=5 years"),
      "Lender note must include monetizable risk flags."
    );
  }
);

assertDecision(
  "Debt vs benefit high warning",
  {
    ...base,
    cashOutAmount: 10000,
    closingCosts: 8000,
    currentRate: 7,
    newRate: 6.25,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.trueNetOutcome > 0, "Debt-vs-benefit scenario must have positive true net.");
    assert(result.comparison.debtVsBenefit !== null, "Debt-vs-benefit insight must show when cash-out and true net are positive.");
    assert(result.comparison.debtVsBenefit?.severity === "high", "Debt-vs-benefit ratio >= 50 must be high severity.");
    assert(result.comparison.debtVsBenefit?.ratio >= 50, "Debt-vs-benefit ratio must be at least 50.");
    assert(
      result.comparison.debtVsBenefit?.message === "You are taking on $10,000 in additional debt for $161 in net benefit.",
      "Debt-vs-benefit message must clearly compare debt increase to net benefit."
    );
    assert(
      result.comparison.debtVsBenefit?.interpretation ===
        "This is a high-risk trade-off. The debt increase is significantly larger than the financial benefit.",
      "High debt-vs-benefit interpretation must be advisor-clear."
    );
    assert(
      result.decision.riskScoreFactors.some((factor) => factor.key === "DEBT_VS_BENEFIT_HIGH" && factor.points === 10),
      "Debt-vs-benefit ratio >= 50 and < 100 must add +10 risk score."
    );
    assert(
      result.decision.lenderNote.flags.includes("High debt-vs-benefit trade-off"),
      "Lender note must flag high debt-vs-benefit trade-off."
    );
  }
);

assertDecision(
  "Debt vs benefit extreme warning",
  {
    ...base,
    cashOutAmount: 10000,
    closingCosts: 0,
    currentRate: 7,
    newRate: 6.75,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.debtVsBenefit !== null, "Extreme debt-vs-benefit insight must show.");
    assert(result.comparison.debtVsBenefit?.ratio >= 100, "Extreme debt-vs-benefit ratio must be at least 100.");
    assert(
      result.decision.riskScoreFactors.some((factor) => factor.key === "DEBT_VS_BENEFIT_EXTREME" && factor.points === 15),
      "Debt-vs-benefit ratio >= 100 must add +15 risk score."
    );
  }
);

assertDecision(
  "Canada debt vs benefit warning",
  {
    ...base,
    country: "CA",
    points: 0,
    cashOutAmount: 10000,
    closingCosts: 0,
    currentRate: 7,
    newRate: 6.75,
    newAmortizationYears: 30,
    expectedStayYears: 5
  },
  "TRADE_OFFS",
  (result) => {
    assert(result.comparison.debtVsBenefit !== null, "Canada debt-vs-benefit insight must show.");
    assert(result.comparison.debtVsBenefit?.severity === "high", "Canada debt-vs-benefit warning must use the same severity logic.");
  }
);

assertDecision(
  "Stay shorter than break-even",
  { ...base, currentRate: 7, newRate: 6.7, closingCosts: 9000, expectedStayYears: 1 },
  "NOT_BENEFICIAL",
  (result) => {
    assert(result.comparison.breakEvenMonths > 12, "Break-even should exceed stay period.");
  }
);

for (const result of [cleanWin, usSameInput, caSameInput]) {
  assert(Number.isFinite(result.comparison.trueNetOutcome), "Scenario output must remain finite.");
  assert(result.comparison.debtVsBenefit === null, "Debt-vs-benefit insight must stay hidden when cash-out is zero.");
}

const sourceOfTruthScenario = calculateRefinance({
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
});
const expectedTrueNet =
  sourceOfTruthScenario.comparison.monthlySavings * 120 -
  sourceOfTruthScenario.comparison.totalUpfrontCost -
  sourceOfTruthScenario.comparison.cashOutAmount;
assert(
  near(sourceOfTruthScenario.comparison.trueNetOutcome, expectedTrueNet),
  "True net outcome must equal monthly savings times stay months minus upfront cost minus cash-out."
);
assert(
  sourceOfTruthScenario.decision.recommendation === "TRADE_OFFS",
  "Source of truth must stay TRADE_OFFS when positive net is paired with high structural risk."
);
assertClose(
  "Source of truth trueNetOutcome",
  sourceOfTruthScenario.comparison.trueNetOutcome,
  12834,
  0.01
);
assertGreaterThanOrEqual(
  "Source of truth riskScore",
  sourceOfTruthScenario.decision.riskScore,
  70
);
assert(
  sourceOfTruthScenario.decision.primaryRiskDriver?.key === "CASH_OUT",
  "Source of truth primary risk driver must remain cash-out."
);
assert(
  sourceOfTruthScenario.decision.lenderNote.recommendation === "LO_REVIEW_REQUIRED",
  "Source of truth must require lender review."
);

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
  [
    cleanWin,
    sourceOfTruthScenario,
    usSameInput,
    caSameInput
  ].every((result) => allowedRiskBands.has(result.decision.riskBand)),
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
    breakEvenMonths:
      result.comparison.breakEvenMonths === null ? null : cents(result.comparison.breakEvenMonths),
    trueNetOutcome: cents(result.comparison.trueNetOutcome),
    riskScore: result.decision.riskScore,
    riskBand: result.decision.riskBand,
    leadScore: result.decision.leadScore,
    lender: result.decision.lenderNote.recommendation,
    interestDifferenceRateOnly: cents(result.comparison.interestDifferenceRateOnly)
  }))
);
