"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Send,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { INITIAL_ALERTS, INITIAL_CONTENT_ITEMS, INITIAL_TOOL_EXPENSES } from "@/lib/data/seed-data";

export default function CommandCenterPage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerAction = (alertId: string, actionName: string, detail: string) => {
    setToastMessage(`${actionName}: ${detail}`);
    // Dismiss alert optimistically
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-stagger-1">
      {/* Morning Briefing Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand">
            <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
            OPERATIONAL COCKPIT &middot; FRIDAY, SEP 18
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
            Good morning, Sudeesh.
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            The operating system identified <span className="tabular-numbers font-semibold text-foreground">{alerts.length} items</span> requiring action today. Zero manual database maintenance needed.
          </p>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-status-emerald-bg px-4 py-2 text-xs font-semibold text-status-emerald border border-status-emerald-border shadow-subtle animate-stagger-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* KPI Horizon Strip with Staggered Visual Rhythm */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-interactive animate-stagger-1 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Active Retainers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-blue-bg text-status-blue border border-status-blue-border">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">4 Clients</span>
            <span className="tabular-numbers text-xs font-semibold text-status-emerald">₹5.5L MRR</span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">Chetan, Florian, OrbitXPay, Bilal</p>
        </div>

        <div className="card-interactive animate-stagger-2 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Pending Client Reviews</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-rose-bg text-status-rose border border-status-rose-border">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">2 Posts</span>
            <span className="tabular-numbers text-xs font-semibold text-status-rose">1 Stalled &gt; 48h</span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">Awaiting Chetan &amp; Florian</p>
        </div>

        <div className="card-interactive animate-stagger-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Scheduled for Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-emerald-bg text-status-emerald border border-status-emerald-border">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">1 Post</span>
            <span className="text-xs font-semibold text-status-emerald">Approved &amp; Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">Chetan Ahuja at 2:30 PM</p>
        </div>

        <div className="card-interactive animate-stagger-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Unbilled Pass-Through Tools</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-amber-bg text-status-amber border border-status-amber-border">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-foreground">₹24,900</span>
            <span className="tabular-numbers text-xs font-semibold text-status-amber">2 Items</span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">Clay Credits + HeyReach Seat</p>
        </div>
      </div>

      {/* Two Column Layout: Urgent Attention Feed vs Operational Schedule */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Urgent Triage Queue (2 Cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand" />
              <h2 className="font-display text-base font-bold text-foreground">
                Needs Attention Right Now ({alerts.length})
              </h2>
            </div>
            <span className="text-xs font-medium text-foreground-muted">Ranked by Operational Urgency</span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center shadow-card">
                <CheckCircle2 className="mx-auto h-8 w-8 text-status-emerald" />
                <h3 className="mt-2 text-sm font-bold text-foreground">All Attention Items Cleared</h3>
                <p className="mt-1 text-xs text-foreground-muted">
                  The agency is operating at zero friction. No overdue client reviews or unbilled tool expenses.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`group relative flex flex-col justify-between gap-4 rounded-xl border bg-surface p-5 shadow-card transition-all hover:shadow-raised sm:flex-row sm:items-center ${
                    alert.severity === "critical"
                      ? "border-status-rose-border bg-gradient-to-r from-status-rose-bg/30 to-surface"
                      : alert.severity === "warning"
                      ? "border-status-amber-border bg-gradient-to-r from-status-amber-bg/30 to-surface"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          alert.severity === "critical"
                            ? "bg-status-rose text-white"
                            : alert.severity === "warning"
                            ? "bg-status-amber text-white"
                            : "bg-foreground-subtle text-white"
                        }`}
                      >
                        {alert.client_name}
                      </span>
                      <span className="text-[11px] font-medium text-foreground-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" /> SLA Trigger
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-foreground-muted leading-relaxed">{alert.description}</p>
                  </div>

                  {/* Operational Action Button */}
                  <div className="shrink-0">
                    {alert.action_type === "whatsapp_ping" ? (
                      <button
                        onClick={() =>
                          triggerAction(
                            alert.id,
                            "WhatsApp Link Generated",
                            "Review link copied to clipboard for Chetan (+91 98765 43210)"
                          )
                        }
                        aria-label="Send WhatsApp review ping to client"
                        className="btn-pressable flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-status-emerald px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-emerald"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send WhatsApp Ping</span>
                      </button>
                    ) : alert.action_type === "bill_expense" ? (
                      <button
                        onClick={() =>
                          triggerAction(
                            alert.id,
                            "Drafted to Invoice",
                            "₹24,900 added to Chetan Ahuja October Retainer Draft"
                          )
                        }
                        aria-label="Add tool expense to client invoice draft"
                        className="btn-pressable flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Add to Next Invoice</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerAction(alert.id, "Acknowledged", "Lead operator notified")}
                        aria-label="Acknowledge operational item"
                        className="btn-pressable flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-subtle hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                      >
                        <span>{alert.action_label}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Rail: Today's Temporal Schedule & Context */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" />
                <h2 className="font-display text-sm font-bold text-foreground">Today's Schedule</h2>
              </div>
              <span className="text-[11px] font-semibold text-brand">Projection</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-status-emerald-border bg-status-emerald-bg/40 p-3">
                <div className="text-center font-display">
                  <span className="block text-[10px] font-semibold text-status-emerald">SEP</span>
                  <span className="block text-sm font-bold text-foreground">18</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Publish LinkedIn Post</span>
                    <span className="rounded bg-status-emerald px-1.5 py-0.5 text-[9px] font-bold text-white">
                      2:30 PM
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-muted line-clamp-1">
                    Chetan Ahuja &middot; The ₹4.2Cr difference between debt and equity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-canvas p-3">
                <div className="text-center font-display">
                  <span className="block text-[10px] font-semibold text-foreground-muted">SEP</span>
                  <span className="block text-sm font-bold text-foreground">18</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Bi-Weekly Strategy Sync</span>
                    <span className="rounded bg-canvas text-[9px] font-bold text-foreground-muted border border-border-subtle px-1.5 py-0.5">
                      4:00 PM
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Florian Health &middot; Fathom Note Taker Attached
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sudeesh Quick Links */}
          <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
              Client Quick Context
            </h3>
            <div className="mt-3 divide-y divide-border-subtle">
              <Link
                href="/clients/client-chetan"
                className="flex items-center justify-between py-2 text-xs font-semibold text-foreground hover:text-brand"
              >
                <span>Chetan Ahuja (Debtworks)</span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle" />
              </Link>
              <Link
                href="/clients/client-florian"
                className="flex items-center justify-between py-2 text-xs font-semibold text-foreground hover:text-brand"
              >
                <span>Florian M. (Florian Health)</span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle" />
              </Link>
              <Link
                href="/clients/client-orbitxpay"
                className="flex items-center justify-between py-2 text-xs font-semibold text-foreground hover:text-brand"
              >
                <span>OrbitXPay (Mustafa)</span>
                <ChevronRight className="h-3.5 w-3.5 text-foreground-subtle" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
