"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Download,
  Landmark,
  RefreshCw,
  Save,
  Settings,
  Signal,
  Users
} from "lucide-react";
import {
  type AdminCalculation,
  type AdminLead,
  type AdminSettings,
  type LeadStatus
} from "@/lib/admin-store";
import type { LenderNote, PrimaryRiskDriver, RecommendationCode, RiskBand, LeadQuality } from "@/lib/refinance-engine";

type LeadListItem = AdminLead & {
  decision?: RecommendationCode;
  monthlySavings?: number;
  breakEvenMonths?: number | null;
  leadScore?: number;
  leadQuality?: LeadQuality;
  riskBand?: RiskBand;
  primaryRiskDriver?: PrimaryRiskDriver;
  lenderRecommendation?: LenderNote["recommendation"];
};

type Analytics = {
  totalLeads: number;
  formSubmissions: number;
  statusCounts: Record<LeadStatus, number>;
  ctaPerformance: {
    totalClicks: number;
    clicksByDecision: Record<RecommendationCode, number>;
  };
  averageMonthlySavings: number;
};

type LeadDetails = {
  lead: AdminLead;
  calculation: AdminCalculation;
};

const statusOptions: LeadStatus[] = ["new", "contacted", "qualified", "converted", "rejected"];

function money(value: number, country: "US" | "CA") {
  return new Intl.NumberFormat(country === "CA" ? "en-CA" : "en-US", {
    style: "currency",
    currency: country === "CA" ? "CAD" : "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function rate(value: number) {
  return `${value.toFixed(2)}%`;
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status: LeadStatus) {
  return {
    new: "admin-status is-new",
    contacted: "admin-status is-contacted",
    qualified: "admin-status is-qualified",
    converted: "admin-status is-converted",
    rejected: "admin-status is-rejected"
  }[status];
}

function actionLabel(recommendation?: LenderNote["recommendation"]) {
  if (recommendation === "FAST_TRACK") {
    return "Call immediately";
  }

  if (recommendation === "LO_REVIEW_REQUIRED") {
    return "Review before contact";
  }

  if (recommendation === "DO_NOT_PRIORITIZE") {
    return "Low priority";
  }

  return "Pending";
}

function primaryRiskLabel(driver?: PrimaryRiskDriver) {
  return driver?.message ?? "No major risk";
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<LeadDetails | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  async function loadAdminData(nextSelectedId = selectedId) {
    setIsLoading(true);

    const [leadsResponse, analyticsResponse, settingsResponse] = await Promise.all([
      fetch("/admin/api/leads"),
      fetch("/admin/api/analytics"),
      fetch("/admin/api/settings")
    ]);
    const leadsPayload = (await leadsResponse.json()) as { leads: LeadListItem[] };
    const analyticsPayload = (await analyticsResponse.json()) as { analytics: Analytics };
    const settingsPayload = (await settingsResponse.json()) as { settings: AdminSettings };
    const nextLeads = leadsPayload.leads;
    const chosenId = nextSelectedId ?? nextLeads[0]?.id ?? null;

    setLeads(nextLeads);
    setAnalytics(analyticsPayload.analytics);
    setSettings(settingsPayload.settings);
    setSelectedId(chosenId);

    if (chosenId) {
      const detailsResponse = await fetch(`/admin/api/leads/${chosenId}`);
      setDetails((await detailsResponse.json()) as LeadDetails);
    }

    setLastSyncedAt(new Date());
    setIsLoading(false);
  }

  useEffect(() => {
    setMounted(true);
    void loadAdminData(null);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadAdminData(selectedId);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [mounted, selectedId]);

  async function selectLead(id: string) {
    setSelectedId(id);
    const response = await fetch(`/admin/api/leads/${id}`);
    setDetails((await response.json()) as LeadDetails);
  }

  async function updateStatus(status: LeadStatus) {
    if (!selectedId) {
      return;
    }

    const response = await fetch(`/admin/api/leads/${selectedId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });
    const payload = (await response.json()) as { lead: AdminLead };

    setDetails((current) => (current ? { ...current, lead: payload.lead } : current));
    setLeads((current) => current.map((lead) => (lead.id === payload.lead.id ? { ...lead, status } : lead)));
    void loadAdminData(selectedId);
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }

    setIsSavingSettings(true);
    setSettingsMessage(null);

    const response = await fetch("/admin/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(settings)
    });

    if (response.ok) {
      setSettingsMessage("Settings saved.");
    } else {
      setSettingsMessage("Could not save settings.");
    }

    setIsSavingSettings(false);
  }

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedId) ?? leads[0],
    [leads, selectedId]
  );

  if (!mounted) {
    return null;
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-mark">
            <Landmark size={21} />
          </div>
          <div>
            <p>Northstar</p>
            <strong>Lender Admin</strong>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <a href="#leads">
            <Users size={17} />
            Leads
          </a>
          <a href="#analytics">
            <BarChart3 size={17} />
            Analytics
          </a>
          <a href="#settings">
            <Settings size={17} />
            Settings
          </a>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Single lender workspace</p>
            <h1>Refinance Admin Panel</h1>
            <div className="admin-live-row">
              <span className="admin-live-pill">
                <Signal size={14} />
                Live updates
              </span>
              <span>
                {lastSyncedAt ? `Synced ${lastSyncedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : "Syncing..."}
              </span>
            </div>
          </div>
          <div className="admin-actions">
            <button type="button" onClick={() => void loadAdminData(selectedId)}>
              {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
            <a href="/admin/api/leads/export">
              <Download size={16} />
              Export CSV
            </a>
          </div>
        </header>

        <section className="admin-stats" id="analytics">
          <motion.div className="admin-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span>Total leads</span>
            <strong>{analytics?.totalLeads ?? 0}</strong>
          </motion.div>
          <motion.div className="admin-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <span>Form submissions</span>
            <strong>{analytics?.formSubmissions ?? 0}</strong>
          </motion.div>
          <motion.div className="admin-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <span>CTA clicks</span>
            <strong>{analytics?.ctaPerformance.totalClicks ?? 0}</strong>
          </motion.div>
          <motion.div className="admin-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <span>Avg monthly savings</span>
            <strong>{money(analytics?.averageMonthlySavings ?? 0, selectedLead?.country ?? "US")}</strong>
          </motion.div>
        </section>

        <div className="admin-grid">
          <section className="admin-panel" id="leads">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Lead management</p>
                <h2>Leads</h2>
              </div>
              <span>{leads.length} records</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Risk</th>
                    <th>Decision</th>
                    <th>Primary Risk</th>
                    <th>Action</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      className={lead.id === selectedId ? "is-selected" : ""}
                      key={lead.id}
                      onClick={() => void selectLead(lead.id)}
                    >
                      <td>
                        <strong>{lead.firstName} {lead.lastName}</strong>
                        <span>{lead.email}</span>
                      </td>
                      <td>
                        <strong>{lead.leadScore ?? 0}</strong>
                        <span>{lead.leadQuality ?? "PENDING"}</span>
                      </td>
                      <td>{lead.riskBand ?? "PENDING"}</td>
                      <td>{lead.decision ?? "Pending"}</td>
                      <td>{primaryRiskLabel(lead.primaryRiskDriver)}</td>
                      <td>{actionLabel(lead.lenderRecommendation)}</td>
                      <td>{compactDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-panel admin-detail">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Lead details</p>
                <h2>{details ? `${details.lead.firstName} ${details.lead.lastName}` : "Select a lead"}</h2>
              </div>
            </div>

            {details ? (
              <>
                <div className="admin-detail-card">
                  <span>Contact</span>
                  <strong>{details.lead.email}</strong>
                  <p>{details.lead.phone}</p>
                </div>

                <label className="admin-field">
                  <span>Status</span>
                  <select value={details.lead.status} onChange={(event) => void updateStatus(event.target.value as LeadStatus)}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-detail-grid">
                  <div>
                    <span>Balance</span>
                    <strong>{money(details.calculation.inputs.currentLoanBalance, details.lead.country)}</strong>
                  </div>
                  <div>
                    <span>Current rate</span>
                    <strong>{rate(details.calculation.inputs.currentRate)}</strong>
                  </div>
                  <div>
                    <span>New rate</span>
                    <strong>{rate(details.calculation.inputs.newRate)}</strong>
                  </div>
                  <div>
                    <span>Break-even</span>
                    <strong>{Math.ceil(details.calculation.result.comparison.breakEvenMonths ?? 0)} mo</strong>
                  </div>
                  <div>
                    <span>Lead score</span>
                    <strong>{details.calculation.result.decision.leadScore}/100</strong>
                  </div>
                  <div>
                    <span>Risk band</span>
                    <strong>{details.calculation.result.decision.riskBand}</strong>
                  </div>
                  <div>
                    <span>Action</span>
                    <strong>{actionLabel(details.calculation.result.decision.lenderNote.recommendation)}</strong>
                  </div>
                  <div>
                    <span>Primary risk</span>
                    <strong>{primaryRiskLabel(details.calculation.result.decision.primaryRiskDriver)}</strong>
                  </div>
                </div>

                <div className="admin-result">
                  <span>Decision</span>
                  <strong>{details.calculation.result.decision.recommendation}</strong>
                  <p>{details.calculation.result.decision.advisorSummary}</p>
                </div>
              </>
            ) : (
              <p className="admin-empty">No lead selected.</p>
            )}
          </aside>
        </div>

        <section className="admin-panel" id="settings">
          <div className="admin-section-head">
            <div>
              <p className="admin-kicker">Basic settings</p>
              <h2>Lender defaults</h2>
            </div>
            <button className="admin-save" disabled={isSavingSettings || !settings} type="button" onClick={() => void saveSettings()}>
              {isSavingSettings ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save
            </button>
          </div>

          {settings ? (
            <div className="admin-settings-grid">
              <label className="admin-field">
                <span>Default interest rate</span>
                <input
                  type="number"
                  value={settings.defaultInterestRate}
                  onChange={(event) =>
                    setSettings((current) =>
                      current ? { ...current, defaultInterestRate: Number(event.target.value) } : current
                    )
                  }
                />
              </label>

              <label className="admin-field">
                <span>Loan types</span>
                <input
                  value={settings.loanTypes.join(", ")}
                  onChange={(event) =>
                    setSettings((current) =>
                      current
                        ? {
                            ...current,
                            loanTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                          }
                        : current
                    )
                  }
                />
              </label>

              <div className="admin-country-group">
                <span>Country selection</span>
                <label>
                  <input
                    checked={settings.countries.includes("US")}
                    type="checkbox"
                    onChange={(event) =>
                      setSettings((current) =>
                        current
                          ? {
                              ...current,
                              countries: event.target.checked
                                ? Array.from(new Set([...current.countries, "US"]))
                                : current.countries.filter((country) => country !== "US")
                            }
                          : current
                      )
                    }
                  />
                  USA
                </label>
                <label>
                  <input
                    checked={settings.countries.includes("CA")}
                    type="checkbox"
                    onChange={(event) =>
                      setSettings((current) =>
                        current
                          ? {
                              ...current,
                              countries: event.target.checked
                                ? Array.from(new Set([...current.countries, "CA"]))
                                : current.countries.filter((country) => country !== "CA")
                            }
                          : current
                      )
                    }
                  />
                  Canada
                </label>
              </div>
            </div>
          ) : null}

          {settingsMessage ? (
            <p className="admin-settings-message">
              <CheckCircle2 size={16} />
              {settingsMessage}
            </p>
          ) : null}
        </section>

        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-kicker">Database</p>
              <h2>PostgreSQL tables</h2>
            </div>
          </div>
          <div className="admin-schema">
            <code>leads</code>
            <code>calculations</code>
            <code>settings</code>
          </div>
          <p className="admin-note">
            Frontend deploys to Vercel. Backend deploys to Railway or AWS. PostgreSQL stores leads, calculation payloads, and lender settings.
          </p>
        </section>
      </section>
    </main>
  );
}
