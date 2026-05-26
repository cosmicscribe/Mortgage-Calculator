"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Home,
  Landmark,
  LineChart,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wifi,
  WalletCards
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { RefinanceInput, RefinanceResult } from "@/lib/refinance-engine";

type AmortizationView = "yearly" | "monthly";

type FormState = {
  country: "US" | "CA";
  currentLoanBalance: string;
  currentRate: string;
  currentRemainingYears: string;
  newRate: string;
  newAmortizationYears: string;
  termYears: string;
  closingCosts: string;
  points: string;
  cashOutAmount: string;
  expectedStayYears: string;
  rollClosingCosts: boolean;
};

type LeadFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consent: boolean;
};

type PublicSettings = {
  defaultInterestRate: number;
  loanTypes: string[];
  countries: Array<"US" | "CA">;
};

const initialForm: FormState = {
  country: "US",
  currentLoanBalance: "420000",
  currentRate: "6.85",
  currentRemainingYears: "26",
  newRate: "5.95",
  newAmortizationYears: "30",
  termYears: "5",
  closingCosts: "7200",
  points: "0",
  cashOutAmount: "0",
  expectedStayYears: "6",
  rollClosingCosts: false
};

const initialLeadForm: LeadFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  consent: false
};

const recommendationStyles = {
  BENEFICIAL: {
    accent: "#0f8a6f",
    bg: "bg-[#e7f7f1]",
    border: "border-[#0f8a6f]/25",
    text: "text-[#0b6654]",
    halo: "",
    icon: BadgeCheck
  },
  TRADE_OFFS: {
    accent: "#c9841e",
    bg: "bg-[#fff7e6]",
    border: "border-[#c9841e]/30",
    text: "text-[#7b5315]",
    halo: "",
    icon: Clock3
  },
  NOT_BENEFICIAL: {
    accent: "#c94f3c",
    bg: "bg-[#fff1ec]",
    border: "border-[#c94f3c]/25",
    text: "text-[#9d3529]",
    halo: "",
    icon: ShieldCheck
  }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

function decisionLabel(code: RefinanceResult["decision"]["recommendation"]) {
  if (code === "BENEFICIAL") {
    return "Refinance is beneficial";
  }

  if (code === "NOT_BENEFICIAL") {
    return "Refinance is not beneficial";
  }

  return "Refinance has trade-offs";
}

function riskStructureLabel(score: number) {
  if (score >= 50) {
    return "High Risk Structure";
  }

  if (score >= 20) {
    return "Moderate Caution";
  }

  return "Low Risk Structure";
}

function getCTA(decision: RefinanceResult["decision"]["recommendation"]) {
  if (decision === "BENEFICIAL") {
    return {
      context: "This looks like a strong opportunity.",
      label: "Talk to a mortgage advisor about locking this in",
      tone: "primary"
    };
  }

  if (decision === "TRADE_OFFS") {
    return {
      context: "This decision depends on your priorities.",
      label: "Review this scenario with a mortgage advisor",
      tone: "secondary"
    };
  }

  return {
    context: "This isn't a good refinance right now.",
    label: "Ask an advisor what would make refinancing worthwhile",
    tone: "subtle"
  };
}

function money(value: number, country: FormState["country"]) {
  return new Intl.NumberFormat(country === "CA" ? "en-CA" : "en-US", {
    style: "currency",
    currency: country === "CA" ? "CAD" : "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function compactMoney(value: number, country: FormState["country"]) {
  const absValue = Math.abs(value);

  if (absValue >= 1000000) {
    return `${value < 0 ? "-" : ""}${money(absValue / 1000000, country).replace(/\.00$/, "")}M`;
  }

  if (absValue >= 100000) {
    return `${value < 0 ? "-" : ""}${money(absValue / 1000, country).replace(/\.00$/, "")}k`;
  }

  return money(value, country);
}

function wholeMoney(value: number, country: FormState["country"]) {
  return new Intl.NumberFormat(country === "CA" ? "en-CA" : "en-US", {
    style: "currency",
    currency: country === "CA" ? "CAD" : "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function months(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "No break-even";
  }

  return `${Math.ceil(value)} months`;
}

function percentDelta(current: number, proposed: number) {
  if (!current) {
    return "0%";
  }

  const delta = Math.round(((current - proposed) / current) * 100);

  if (delta > 0) {
    return `${delta}% lower`;
  }

  if (delta < 0) {
    return `${Math.abs(delta)}% higher`;
  }

  return "No payment change";
}

function amortizationPeriodLabel(period: number, view: AmortizationView) {
  return view === "yearly" ? `Year ${period}` : `Month ${period}`;
}

function toPayload(form: FormState): RefinanceInput {
  return {
    country: form.country,
    currentLoanBalance: Number(form.currentLoanBalance),
    currentRate: Number(form.currentRate),
    currentRemainingYears: Number(form.currentRemainingYears),
    newRate: Number(form.newRate),
    newAmortizationYears: Number(form.newAmortizationYears),
    termYears: Number(form.termYears),
    closingCosts: Number(form.closingCosts),
    points: form.country === "US" ? Number(form.points) : 0,
    cashOutAmount: Number(form.cashOutAmount),
    expectedStayYears: Number(form.expectedStayYears),
    rollClosingCosts: false
  };
}

function NumberField({
  label,
  value,
  prefix,
  suffix,
  onChange
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="field-shell mt-2">
        {prefix ? <span className="text-sm font-black text-[#59635f]">{prefix}</span> : null}
        <input
          className="w-full bg-transparent py-3.5 text-[15px] font-bold text-[#17231f] outline-none"
          inputMode="decimal"
          min="0"
          step="any"
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="text-sm font-black text-[#59635f]">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  type = "text",
  onChange
}: {
  label: string;
  value: string;
  type?: "email" | "tel" | "text";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="field-shell mt-2">
        <input
          className="w-full bg-transparent py-3.5 text-[15px] font-bold text-[#17231f] outline-none"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral"
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warm" | "strong";
}) {
  const toneClass = {
    neutral: "text-[#17231f]",
    good: "text-[#0b6654]",
    warm: "text-[#7b5315]",
    strong: "text-[#4e55bc]"
  }[tone];

  return (
    <div className="metric-tile p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f5ef] text-[#0f8a6f]">
          <Icon size={21} />
        </div>
        <ChevronRight className="text-[#9aa5a0]" size={17} />
      </div>
      <p className="label">{label}</p>
      <p className={`metric-value mt-1 ${toneClass}`}>{value}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-[#64706b]">{detail}</p>
    </div>
  );
}

function ComparisonRow({
  label,
  before,
  after,
  country
}: {
  label: string;
  before: number;
  after: number;
  country: FormState["country"];
}) {
  const improves = before > after;

  return (
    <div className="comparison-row">
      <span className="text-sm font-black text-[#26352f]">{label}</span>
      <span className="text-sm font-bold text-[#6a756f]">{money(before, country)}</span>
      <span className={`text-sm font-black ${improves ? "text-[#0b6654]" : "text-[#9d3529]"}`}>
        {money(after, country)}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<RefinanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(initialLeadForm);
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [lenderDefaultRate, setLenderDefaultRate] = useState<number | null>(null);
  const [rateMode, setRateMode] = useState<"lender" | "custom">("lender");
  const [settingsSyncedAt, setSettingsSyncedAt] = useState<Date | null>(null);
  const [amortizationView, setAmortizationView] = useState<AmortizationView>("yearly");
  const [mounted, setMounted] = useState(false);
  const formRef = useRef(form);
  const rateModeRef = useRef(rateMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    rateModeRef.current = rateMode;
  }, [rateMode]);

  async function calculate(nextForm = form) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/calculate-refinance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(toPayload(nextForm))
      });

      if (!response.ok) {
        throw new Error("Please check the inputs and try again.");
      }

      const data = (await response.json()) as RefinanceResult;
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Calculation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function syncLenderSettings(recalculate = false) {
    try {
      const response = await fetch("/admin/api/settings", {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { settings: PublicSettings };
      const nextRate = payload.settings.defaultInterestRate.toFixed(2);
      setLenderDefaultRate(payload.settings.defaultInterestRate);
      setSettingsSyncedAt(new Date());

      if (rateModeRef.current === "lender" && formRef.current.newRate !== nextRate) {
        const nextForm = { ...formRef.current, newRate: nextRate };
        formRef.current = nextForm;
        setForm(nextForm);

        if (recalculate) {
          void calculate(nextForm);
        }
      }
    } catch {
      // Keep the calculator usable if the settings endpoint is temporarily unavailable.
    }
  }

  useEffect(() => {
    void calculate(initialForm);
    void syncLenderSettings(true);

    const intervalId = window.setInterval(() => {
      void syncLenderSettings(true);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      {
        name: "Before",
        payment: result.current.monthlyPayment,
        interest: result.current.totalInterestRemaining
      },
      {
        name: "After",
        payment: result.proposed.monthlyPayment,
        interest: result.proposed.totalInterest
      }
    ];
  }, [result]);

  const amortizationData = useMemo(() => {
    if (!result) {
      return [];
    }

    if (amortizationView === "monthly") {
      const maxMonths = Math.max(result.current_schedule.length, result.new_schedule.length);

      return Array.from({ length: maxMonths + 1 }, (_, index) => {
        const currentRow = index === 0 ? null : result.current_schedule[index - 1];
        const proposedRow = index === 0 ? null : result.new_schedule[index - 1];

        return {
          period: index,
          label: index === 0 ? "Today" : amortizationPeriodLabel(index, amortizationView),
          current: index === 0 ? Number(form.currentLoanBalance) : currentRow?.remaining_balance ?? null,
          proposed: index === 0 ? result.proposed.loanAmount : proposedRow?.remaining_balance ?? null,
          interest: proposedRow?.interest_paid ?? 0,
          principal: proposedRow?.principal_paid ?? 0
        };
      });
    }

    const maxYears = Math.ceil(
      Math.max(result.current_schedule.length, result.new_schedule.length) / 12
    );

    return Array.from({ length: maxYears + 1 }, (_, index) => {
      if (index === 0) {
        return {
          period: 0,
          label: "Today",
          current: Number(form.currentLoanBalance),
          proposed: result.proposed.loanAmount,
          interest: 0,
          principal: 0
        };
      }

      const yearStart = (index - 1) * 12;
      const yearEnd = index * 12;
      const currentRows = result.current_schedule.slice(yearStart, yearEnd);
      const proposedRows = result.new_schedule.slice(yearStart, yearEnd);
      const currentLast = currentRows.at(-1);
      const proposedLast = proposedRows.at(-1);

      return {
        period: index,
        label: amortizationPeriodLabel(index, amortizationView),
        current: currentLast?.remaining_balance ?? null,
        proposed: proposedLast?.remaining_balance ?? null,
        interest: proposedRows.reduce((total, row) => total + row.interest_paid, 0),
        principal: proposedRows.reduce((total, row) => total + row.principal_paid, 0)
      };
    });
  }, [amortizationView, form.currentLoanBalance, result]);

  const amortizationInsights = useMemo(() => {
    if (!result) {
      return [];
    }

    const payoffDifference = result.amortization_summary.payoff_time_difference;
    const trueNetOutcome = result.comparison.trueNetOutcome;
    const insights: string[] = [];

    if (payoffDifference > 0) {
      insights.push(`You pay off the loan ${months(payoffDifference)} earlier.`);
    } else if (payoffDifference < 0) {
      insights.push(`The new loan runs ${months(Math.abs(payoffDifference))} longer.`);
    } else {
      insights.push("The payoff timeline is unchanged.");
    }

    if (trueNetOutcome > 0) {
      insights.push(`Overall financial position improves by ${money(trueNetOutcome, form.country)} over your expected stay period after upfront costs and cash-out.`);
    } else if (trueNetOutcome < 0) {
      insights.push(`Overall financial position worsens by ${money(Math.abs(trueNetOutcome), form.country)} over your expected stay period after upfront costs and cash-out.`);
    } else {
      insights.push("Overall financial position is unchanged over your expected stay period after upfront costs and cash-out.");
    }

    return insights;
  }, [form.country, result]);

  const amortizationTimeline = useMemo(() => {
    if (!result) {
      return [];
    }

    const finalCurrentMonth = result.current.monthsRemaining;
    const finalProposedMonth = result.proposed.amortizationMonths;

    return result.amortization
      .filter((point) => {
        const isFiveYearStep = point.month % 60 === 0;
        const isCurrentPayoff = point.month === finalCurrentMonth;
        const isProposedPayoff = point.month === finalProposedMonth;

        return point.month === 0 || isFiveYearStep || isCurrentPayoff || isProposedPayoff;
      })
      .slice(0, 10);
  }, [result]);

  const recommendation = result ? recommendationStyles[result.decision.recommendation] : null;
  const RecommendationIcon = recommendation?.icon ?? BadgeCheck;
  const productMode = form.country === "CA" ? "Renew or Switch" : "Refinance & Save";
  const currencyPrefix = form.country === "CA" ? "C$" : "$";
  const savingsPositive = (result?.comparison.trueNetOutcome ?? 0) > 0;
  const cta = result ? getCTA(result.decision.recommendation) : null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateNewRate(value: string) {
    setRateMode("custom");
    update("newRate", value);
  }

  function useLenderDefaultRate() {
    if (lenderDefaultRate === null) {
      return;
    }

    const nextForm = { ...form, newRate: lenderDefaultRate.toFixed(2) };
    setRateMode("lender");
    setForm(nextForm);
    void calculate(nextForm);
  }

  function updateLead<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setLeadForm((current) => ({ ...current, [key]: value }));
  }

  function setCountry(country: FormState["country"]) {
    const nextForm = { ...form, country };
    setForm(nextForm);
    void calculate(nextForm);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void calculate();
  }

  async function onSubmitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeadStatus(null);
    setLeadError(null);
    setIsSubmittingLead(true);

    try {
      const response = await fetch("/submit-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...leadForm,
          country: form.country,
          loanBalance: Number(form.currentLoanBalance),
          desiredAction: form.country === "CA" ? "RENEW_SWITCH" : "REFINANCE_SAVE",
          ctaTracking:
            result && cta
              ? {
                  decision: result.decision.recommendation,
                  ctaType: cta.tone,
                  clicked: true
                }
              : undefined
        })
      });

      const payload = (await response.json()) as { error?: string; leadId?: string; nextStep?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Lead submission failed.");
      }

      setLeadStatus(`${payload.nextStep ?? "We received your request."} Reference: ${payload.leadId}.`);
      setLeadForm(initialLeadForm);
    } catch (caught) {
      setLeadError(caught instanceof Error ? caught.message : "Lead submission failed.");
    } finally {
      setIsSubmittingLead(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="ambient-grid" />

      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto flex max-w-[1540px] items-center justify-between gap-4 pb-6"
        initial={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex items-center gap-3">
          <div className="brand-mark">
            <Landmark size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0f8a6f]">Northstar Home Lending</p>
            <h1 className="text-xl font-black text-[#17231f] sm:text-2xl">Refinance Calculator</h1>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="trust-pill">
            <ShieldCheck size={17} />
            Bank-grade estimate
          </div>
          <div className="mode-pill">
            <Building2 size={17} />
            {productMode}
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 mx-auto grid max-w-[1540px] items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <motion.section
          animate="show"
          className="float-card input-card p-4"
          initial="hidden"
          transition={{ duration: 0.45 }}
          variants={sectionVariants}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="label">Input form</p>
              <h2 className="mt-1 text-2xl font-black text-[#17231f]">{productMode}</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#64706b]">
                Compare payment, break-even timing, interest savings, and true cost in one trusted view.
              </p>
            </div>
            <div className="icon-lift">
              <Calculator size={24} />
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={onSubmit}>
            <div>
              <span className="label">Mortgage market</span>
              <div className="segmented mt-2">
                {(["US", "CA"] as const).map((country) => (
                  <button
                    aria-pressed={form.country === country}
                    className={form.country === country ? "is-active" : ""}
                    key={country}
                    type="button"
                    onClick={() => setCountry(country)}
                  >
                    <span>{country === "US" ? "USA" : "Canada"}</span>
                    <small>{country === "US" ? "Refinance & Save" : "Renew or Switch"}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <NumberField
                label="Current balance"
                prefix={currencyPrefix}
                value={form.currentLoanBalance}
                onChange={(value) => update("currentLoanBalance", value)}
              />
              <NumberField
                label="Current rate"
                suffix="%"
                value={form.currentRate}
                onChange={(value) => update("currentRate", value)}
              />
              <NumberField
                label="Years remaining"
                suffix="yrs"
                value={form.currentRemainingYears}
                onChange={(value) => update("currentRemainingYears", value)}
              />
              <NumberField
                label="New rate"
                suffix="%"
                value={form.newRate}
                onChange={updateNewRate}
              />
              <NumberField
                label="New amortization"
                suffix="yrs"
                value={form.newAmortizationYears}
                onChange={(value) => update("newAmortizationYears", value)}
              />
              <NumberField
                label="Expected stay"
                suffix="yrs"
                value={form.expectedStayYears}
                onChange={(value) => update("expectedStayYears", value)}
              />
              {form.country === "CA" ? (
                <NumberField
                  label="Mortgage term"
                  suffix="yrs"
                  value={form.termYears}
                  onChange={(value) => update("termYears", value)}
                />
              ) : null}
              <NumberField
                label="Closing costs"
                prefix={currencyPrefix}
                value={form.closingCosts}
                onChange={(value) => update("closingCosts", value)}
              />
              {form.country === "US" ? (
                <NumberField
                  label="Mortgage points"
                  suffix="%"
                  value={form.points}
                  onChange={(value) => update("points", value)}
                />
              ) : (
                <div className="rounded-[8px] border border-[#dde4df] bg-[#f7f8f3] p-3 text-sm font-bold leading-5 text-[#64706b]">
                  Canadian mortgages typically do not use points. Rates are set directly.
                </div>
              )}
              <NumberField
                label="Cash out"
                prefix={currencyPrefix}
                value={form.cashOutAmount}
                onChange={(value) => update("cashOutAmount", value)}
              />
            </div>

            <div className="rate-sync-card">
              <div>
                <span>
                  <Wifi size={15} />
                  {rateMode === "lender" ? "Using lender default" : "Custom borrower rate"}
                </span>
                <strong>{lenderDefaultRate === null ? "Loading default rate" : `${lenderDefaultRate.toFixed(2)}% lender default`}</strong>
                <p>
                  {settingsSyncedAt
                    ? `Synced from admin at ${settingsSyncedAt.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit"
                      })}`
                    : "Waiting for admin settings..."}
                </p>
              </div>
              <button disabled={lenderDefaultRate === null || rateMode === "lender"} type="button" onClick={useLenderDefaultRate}>
                Reset to default
              </button>
            </div>

            <button className="primary-action" disabled={isLoading} type="submit">
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              {productMode}
            </button>
          </form>

          {error ? <p className="mt-4 rounded-2xl bg-[#fff1ec] p-3 text-sm font-bold text-[#9d3529]">{error}</p> : null}
        </motion.section>

        <section className="space-y-5">
          <motion.section
            animate="show"
            className="hero-card float-card p-5 sm:p-6"
            initial="hidden"
            transition={{ delay: 0.06, duration: 0.45 }}
            variants={sectionVariants}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="eyebrow">
                    <Sparkles size={15} />
                    Results dashboard
                  </span>
                  {result ? (
                    <span className={`decision-chip ${savingsPositive ? "is-good" : "is-caution"}`}>
                      {decisionLabel(result.decision.recommendation)}
                    </span>
                  ) : null}
                </div>

                <h2 className="max-w-3xl text-[clamp(2.25rem,4vw,4rem)] font-black leading-[0.95] text-[#17231f]">
                  Know whether a new rate is worth the move.
                </h2>
                <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#53615b]">
                  A lender-grade view of payment change, break-even timing, cash-out impact, and full-term cost.
                </p>
              </div>

              <div className="rate-orbit">
                <div className="mini-house">
                  <Home size={42} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">Rate scenario</p>
                  <p className="mt-2 text-5xl font-black">{form.newRate}%</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/72">
                    Proposed rate over {form.newAmortizationYears} years
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {result ? (
            <>
              <motion.section
                animate="show"
                className={`savings-panel ${savingsPositive ? "is-positive" : "is-negative"}`}
                initial="hidden"
                transition={{ delay: 0.12, duration: 0.45 }}
                variants={sectionVariants}
              >
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#17231f]">
                    <TrendingDown size={15} />
                    True net outcome
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-[#64706b]">Decision driver</p>
                  <p className="savings-hero-value mt-2">
                    {money(result.comparison.trueNetOutcome, form.country)}
                  </p>
                  <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#3f4e48]">
                    {result.explanation_text}
                  </p>
                  {result.comparison.debtVsBenefit ? (
                    <div
                      className={`mt-5 rounded-[8px] border p-4 ${
                        result.comparison.debtVsBenefit.severity === "high"
                          ? "border-[#c94f3c]/30 bg-[#fff1ec]"
                          : result.comparison.debtVsBenefit.severity === "moderate"
                            ? "border-[#c9841e]/35 bg-[#fff7e6]"
                            : "border-[#0f8a6f]/25 bg-[#e7f7f1]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <ShieldCheck
                          className={
                            result.comparison.debtVsBenefit.severity === "high"
                              ? "mt-1 text-[#9d3529]"
                              : result.comparison.debtVsBenefit.severity === "moderate"
                                ? "mt-1 text-[#7b5315]"
                                : "mt-1 text-[#0b6654]"
                          }
                          size={21}
                        />
                        <div>
                          <p
                            className={`text-sm font-black uppercase tracking-[0.12em] ${
                              result.comparison.debtVsBenefit.severity === "high"
                                ? "text-[#9d3529]"
                                : result.comparison.debtVsBenefit.severity === "moderate"
                                  ? "text-[#7b5315]"
                                  : "text-[#0b6654]"
                            }`}
                          >
                            Debt vs benefit
                          </p>
                          <p className="mt-2 text-base font-black leading-6 text-[#17231f]">
                            You are taking on {wholeMoney(result.comparison.cashOutAmount, form.country)} in additional debt for{" "}
                            {wholeMoney(result.comparison.trueNetOutcome, form.country)} in net benefit.
                          </p>
                          <p className="mt-1 text-sm font-bold leading-6 text-[#3f4e48]">
                            {result.comparison.debtVsBenefit.interpretation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="savings-stack">
                  <div>
                    <span>Monthly savings</span>
                    <strong>{money(result.comparison.monthlySavings, form.country)}</strong>
                  </div>
                  <div>
                    <span>Break-even</span>
                    <strong>{months(result.comparison.breakEvenMonths)}</strong>
                  </div>
                  <div>
                    <span>Interest Difference (Rate Only)</span>
                    <strong>{money(result.comparison.interestDifferenceRateOnly, form.country)}</strong>
                    <small>This reflects interest only and does not include upfront costs or cash-out.</small>
                  </div>
                </div>
              </motion.section>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Metric
                  detail={`${form.currentRemainingYears} years remaining`}
                  icon={CircleDollarSign}
                  label="Current payment"
                  value={money(result.current.monthlyPayment, form.country)}
                />
                <Metric
                  detail={percentDelta(result.current.monthlyPayment, result.proposed.monthlyPayment)}
                  icon={WalletCards}
                  label="New payment"
                  tone={result.comparison.monthlySavings > 0 ? "good" : "warm"}
                  value={money(result.proposed.monthlyPayment, form.country)}
                />
                <Metric
                  detail={`Total upfront cost: ${money(result.costs.totalUpfrontCost, form.country)}`}
                  icon={Clock3}
                  label="Break-even"
                  tone="warm"
                  value={months(result.comparison.breakEvenMonths)}
                />
                <Metric
                  detail="Monthly savings across your expected stay minus upfront costs and cash-out."
                  icon={Scale}
                  label="True Net Outcome (Stay Period)"
                  tone={result.comparison.trueNetOutcome >= 0 ? "good" : "warm"}
                  value={compactMoney(result.comparison.trueNetOutcome, form.country)}
                />
                <Metric
                  detail="This reflects interest only and does not include upfront costs or cash-out."
                  icon={LineChart}
                  label="Interest Difference (Rate Only)"
                  tone={result.comparison.interestDifferenceRateOnly >= 0 ? "good" : "warm"}
                  value={compactMoney(result.comparison.interestDifferenceRateOnly, form.country)}
                />
              </div>

              {form.country === "US" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="metric-tile p-4">
                    <p className="label">Points paid</p>
                    <p className="metric-value mt-1 text-[#17231f]">{money(result.costs.pointsCost, form.country)}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-[#64706b]">{result.costs.points.toFixed(2)}% of the new loan amount</p>
                  </div>
                  <div className="metric-tile p-4">
                    <p className="label">Total upfront cost</p>
                    <p className="metric-value mt-1 text-[#17231f]">{money(result.costs.totalUpfrontCost, form.country)}</p>
                    <p className="mt-2 text-sm font-semibold leading-5 text-[#64706b]">Closing costs + points</p>
                  </div>
                </div>
              ) : null}

              {result.comparison.cashOutAmount > 0 ? (
                <div className="metric-tile border-[#c94f3c]/25 bg-[#fff1ec] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 text-[#9d3529]" size={20} />
                    <div>
                      <p className="text-sm font-black text-[#9d3529]">Cash-out warning</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-[#66322b]">
                        Cash-out increases your debt and reduces net benefit.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <motion.section
                animate="show"
                className="float-card comparison-card p-5 sm:p-6"
                initial="hidden"
                transition={{ delay: 0.18, duration: 0.45 }}
                variants={sectionVariants}
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="label">Before vs after comparison</p>
                    <h2 className="mt-2 text-3xl font-black text-[#17231f]">Payment pressure, side by side.</h2>
                  </div>
                  <span className="basis-pill">
                    {form.country === "CA" ? "Canadian semi-annual compounding" : "US monthly compounding"}
                  </span>
                </div>

                <div className="comparison-layout grid gap-5 min-[1120px]:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
                  <div className="space-y-4">
                    <div className="chart-wrap">
                      <ResponsiveContainer height="100%" width="100%">
                        <BarChart data={chartData} margin={{ bottom: 0, left: 0, right: 8, top: 10 }}>
                          <CartesianGrid stroke="#dde4df" strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} />
                          <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} />
                          <Tooltip formatter={(value) => money(Number(value), form.country)} />
                          <Bar dataKey="payment" fill="#0f8a6f" name="Monthly payment" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="interest" fill="#5964d8" name="Total interest" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-wrap amortization-chart">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="label">Amortization visualization</p>
                          <p className="mt-1 text-base font-black text-[#17231f]">Balance over time</p>
                        </div>
                        <div className="view-toggle" aria-label="Amortization view">
                          {(["yearly", "monthly"] as const).map((view) => (
                            <button
                              aria-pressed={amortizationView === view}
                              className={amortizationView === view ? "is-active" : ""}
                              key={view}
                              type="button"
                              onClick={() => setAmortizationView(view)}
                            >
                              {view === "yearly" ? "Yearly" : "Monthly"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <ResponsiveContainer height="82%" width="100%">
                        <RechartsLineChart data={amortizationData} margin={{ bottom: 0, left: 0, right: 8, top: 10 }}>
                          <CartesianGrid stroke="#dde4df" strokeDasharray="4 4" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tickFormatter={(value) =>
                              amortizationView === "yearly" ? `${value}y` : `${value}m`
                            }
                            tickLine={false}
                          />
                          <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} />
                          <Tooltip
                            formatter={(value) =>
                              value === null ? "Paid off" : money(Number(value), form.country)
                            }
                            labelFormatter={(value) => amortizationPeriodLabel(Number(value), amortizationView)}
                          />
                          <Legend />
                          <Line
                            connectNulls={false}
                            dataKey="current"
                            dot={false}
                            name="Current balance"
                            stroke="#64706b"
                            strokeWidth={3}
                            type="monotone"
                          />
                          <Line
                            connectNulls={false}
                            dataKey="proposed"
                            dot={false}
                            name="New loan balance"
                            stroke="#0f8a6f"
                            strokeWidth={3}
                            type="monotone"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-wrap amortization-chart">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="label">Interest vs principal</p>
                          <p className="mt-1 text-base font-black text-[#17231f]">New loan payment mix</p>
                        </div>
                        <span className="basis-pill">
                          {amortizationView === "yearly" ? "Yearly totals" : "Monthly totals"}
                        </span>
                      </div>
                      <ResponsiveContainer height="82%" width="100%">
                        <AreaChart data={amortizationData} margin={{ bottom: 0, left: 0, right: 8, top: 10 }}>
                          <CartesianGrid stroke="#dde4df" strokeDasharray="4 4" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tickFormatter={(value) =>
                              amortizationView === "yearly" ? `${value}y` : `${value}m`
                            }
                            tickLine={false}
                          />
                          <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} />
                          <Tooltip
                            formatter={(value) => money(Number(value), form.country)}
                            labelFormatter={(value) => amortizationPeriodLabel(Number(value), amortizationView)}
                          />
                          <Legend />
                          <Area
                            dataKey="interest"
                            fill="#c9841e"
                            fillOpacity={0.22}
                            name="Interest paid"
                            stroke="#c9841e"
                            strokeWidth={2}
                            type="monotone"
                          />
                          <Area
                            dataKey="principal"
                            fill="#0f8a6f"
                            fillOpacity={0.24}
                            name="Principal paid"
                            stroke="#0f8a6f"
                            strokeWidth={2}
                            type="monotone"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="amortization-insights">
                      {amortizationInsights.map((insight) => (
                        <span key={insight}>{insight}</span>
                      ))}
                    </div>
                  </div>

                  <div className="comparison-table">
                    <div className="comparison-head">
                      <span />
                      <span>Before</span>
                      <span>After</span>
                    </div>
                    <ComparisonRow
                      after={result.proposed.monthlyPayment}
                      before={result.current.monthlyPayment}
                      country={form.country}
                      label="Monthly payment"
                    />
                    <ComparisonRow
                      after={result.proposed.totalInterest}
                      before={result.current.totalInterestRemaining}
                      country={form.country}
                      label="Total interest"
                    />
                    <ComparisonRow
                      after={result.proposed.loanAmount}
                      before={result.current.remainingBalance}
                      country={form.country}
                      label="Loan balance"
                    />
                    <div className="loan-note">
                      <Banknote size={18} />
                      <span>
                        New loan amount: <strong>{money(result.proposed.loanAmount, form.country)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="amortization-timeline min-[1120px]:col-span-2">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="label">Amortization timeline</p>
                        <h3 className="mt-1 text-2xl font-black text-[#17231f]">Loan balance milestones</h3>
                      </div>
                      <span className="basis-pill">
                        {form.country === "CA" ? "Renewal-aware view" : "Payoff path"}
                      </span>
                    </div>

                    <div className="timeline-track">
                      {amortizationTimeline.map((point) => {
                        const currentPaidOff = point.currentBalance === null || point.currentBalance === 0;
                        const proposedPaidOff = point.proposedBalance === null || point.proposedBalance === 0;
                        const label = point.month === 0 ? "Today" : `Year ${Math.round(point.month / 12)}`;

                        return (
                          <div className="timeline-item" key={point.month}>
                            <div className="timeline-dot">
                              <Clock3 size={16} />
                            </div>
                            <div>
                              <p>{label}</p>
                              <div className="timeline-balances">
                                <span>
                                  Current
                                  <strong>
                                    {currentPaidOff ? "Paid off" : money(point.currentBalance ?? 0, form.country)}
                                  </strong>
                                </span>
                                <span>
                                  New loan
                                  <strong>
                                    {proposedPaidOff ? "Paid off" : money(point.proposedBalance ?? 0, form.country)}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>

              <motion.section
                animate="show"
                className={`float-card recommendation-card border p-5 sm:p-6 ${recommendation?.border} ${recommendation?.halo}`}
                initial="hidden"
                transition={{ delay: 0.24, duration: 0.45 }}
                variants={sectionVariants}
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
                  <div>
                    <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${recommendation?.bg} ${recommendation?.text}`}>
                      <RecommendationIcon size={18} />
                      Confidence score: {result.confidence_score}%
                    </div>
                    <p className="mb-2 text-sm font-black uppercase tracking-[0.14em] text-[#64706b]">
                      {result.confidence_level} confidence in this recommendation
                    </p>
                    <div className="confidence-meter mb-4">
                      <span style={{ width: `${result.confidence_score}%` }} />
                    </div>
                    <p className="label">Recommendation section</p>
                    <h2 className="mt-2 text-[clamp(2rem,4vw,3.6rem)] font-black leading-none text-[#17231f]">
                      {decisionLabel(result.decision.recommendation)}
                    </h2>
                    <p className="mt-4 text-xl font-black leading-7 text-[#3f4e48]">{result.decision.headline}</p>
                    <p className="mt-3 max-w-3xl text-lg font-semibold leading-8 text-[#53615b]">
                      {result.decision.advisorSummary}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm font-black leading-6 text-[#3f4e48]">
                      {result.confidence_reason}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-[#64706b]">{result.disclaimer}</p>
                    <div className="confidence-factors mt-4">
                      {result.confidence_factors.map((factor) => (
                        <span key={factor}>{factor}</span>
                      ))}
                    </div>
                    <div className="mt-4 rounded-[8px] border border-[#dde4df] bg-white/70 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-[#17231f]">Advisor risk score</span>
                        <strong className={result.decision.riskScore >= 30 ? "text-[#9d3529]" : "text-[#0b6654]"}>
                          {result.decision.riskScore}/100 ({riskStructureLabel(result.decision.riskScore)})
                        </strong>
                      </div>
                      <div className="confidence-meter">
                        <span style={{ width: `${result.decision.riskScore}%` }} />
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-5 text-[#64706b]">
                        Scores of 30 or higher indicate trade-offs even when true net outcome is positive.
                      </p>
                      {result.decision.riskScoreFactors.length ? (
                        <div className="confidence-factors mt-3">
                          {result.decision.riskScoreFactors.map((factor) => (
                            <span key={`${factor.points}-${factor.message}`}>+{factor.points} {factor.message}</span>
                          ))}
                        </div>
                      ) : null}
                      {result.decision.primaryRiskDriver ? (
                        <p className="mt-3 text-sm font-black leading-5 text-[#3f4e48]">
                          Primary concern: {result.decision.primaryRiskDriver.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-4 rounded-[8px] border border-[#dde4df] bg-[#f7f8f3] p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-[#17231f]">Lender note</span>
                        <strong className="text-sm font-black text-[#4e55bc]">
                          {result.decision.lenderNote.recommendation.replaceAll("_", " ")}
                        </strong>
                      </div>
                      <p className="text-sm font-semibold leading-5 text-[#64706b]">
                        Lead score: {result.decision.leadScore}/100 ({result.decision.leadQuality})
                      </p>
                      {result.decision.lenderNote.flags.length ? (
                        <div className="confidence-factors mt-3">
                          {result.decision.lenderNote.flags.map((flag) => (
                            <span key={flag}>{flag}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="decision-logic">
                    <div className="mb-4 flex items-center gap-2 text-sm font-black text-[#17231f]">
                      <Scale size={18} />
                      Decision logic
                    </div>
                    <div className="space-y-3">
                      {result.explanation_points.map((point) => (
                        <div className="logic-item" key={point}>
                          <CheckCircle2 className="text-[#0f8a6f]" size={18} />
                          <span>{point}</span>
                        </div>
                      ))}
                      {result.risk_flags.map((flag) => (
                        <div className={`logic-item risk-${flag.level}`} key={`${flag.level}-${flag.message}`}>
                          <ShieldCheck size={18} />
                          <span>{flag.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <form className="lead-card mt-6" onSubmit={onSubmitLead}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="label">Advisor handoff</p>
                      <h3 className="mt-2 text-2xl font-black text-[#17231f]">
                        {cta?.label ?? "Talk to a mortgage advisor"}
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#64706b]">
                        {cta?.context}
                      </p>
                    </div>
                    <span className="basis-pill">{cta?.tone === "primary" ? "High intent" : cta?.tone === "secondary" ? "Advisor review" : "Soft review"}</span>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TextField
                      label="First name"
                      value={leadForm.firstName}
                      onChange={(value) => updateLead("firstName", value)}
                    />
                    <TextField
                      label="Last name"
                      value={leadForm.lastName}
                      onChange={(value) => updateLead("lastName", value)}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={leadForm.email}
                      onChange={(value) => updateLead("email", value)}
                    />
                    <TextField
                      label="Phone"
                      type="tel"
                      value={leadForm.phone}
                      onChange={(value) => updateLead("phone", value)}
                    />
                  </div>

                  <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <label className="lead-consent">
                      <input
                        checked={leadForm.consent}
                        type="checkbox"
                        onChange={(event) => updateLead("consent", event.target.checked)}
                      />
                      <span>I agree to be contacted about this refinance scenario.</span>
                    </label>
                    <button className="lead-action" disabled={isSubmittingLead} type="submit">
                      {isSubmittingLead ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                      {cta?.label ?? "Submit lead"}
                    </button>
                  </div>

                  {leadStatus ? <p className="lead-message is-success">{leadStatus}</p> : null}
                  {leadError ? <p className="lead-message is-error">{leadError}</p> : null}
                </form>
              </motion.section>
            </>
          ) : (
            <div className="float-card p-8 text-center font-bold text-[#64706b]">Run a scenario to see your results.</div>
          )}
        </section>
      </div>
    </main>
  );
}
