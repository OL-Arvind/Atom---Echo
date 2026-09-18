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
  Building2,
  Plus,
} from "lucide-react";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";

interface CommandCenterClientProps {
  initialData: {
    activeClientsCount: number;
    pendingReviewCount: number;
    unbilledExpensesTotal: number;
    alerts: any[];
    clients: any[];
    reviewPosts: any[];
    unbilledExpenses: any[];
  };
}

export function CommandCenterClient({ initialData }: CommandCenterClientProps) {
  const [alerts, setAlerts] = useState(initialData.alerts);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerAction = (alertId: string, actionName: string, detail: string) => {
    setToastMessage(`${actionName}: ${detail}`);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isDayZero = initialData.activeClientsCount === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-stagger-1">
      {/* Morning Briefing Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand">
            <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
            OPERATIONAL COCKPIT &middot; LIVE DATABASE ENGINE
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
            {isDayZero ? "Welcome to Atom & Echo OS" : "Good morning, Sudeesh."}
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {isDayZero
              ? "Your operating system is live on Supabase. Start by onboarding your first client to initiate workflows."
              : `The operating system identified ${alerts.length} item(s) requiring attention today. Zero manual spreadsheet upkeep needed.`}
          </p>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-status-emerald-bg px-4 py-2 text-xs font-semibold text-status-emerald border border-status-emerald-border shadow-subtle animate-stagger-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {isDayZero && <OnboardClientModal buttonText="+ Onboard First Founder" />}
      </div>

      {/* KPI Horizon Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Retainers */}
        <div className="card-interactive animate-stagger-1 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Active Retainers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-blue-bg text-status-blue border border-status-blue-border">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">
              {initialData.activeClientsCount} Client{initialData.activeClientsCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">
            {isDayZero ? "No clients onboarded" : `${initialData.activeClientsCount} live engagements`}
          </p>
        </div>

        {/* Pending Client Reviews */}
        <div className="card-interactive animate-stagger-2 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Pending Client Reviews</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-rose-bg text-status-rose border border-status-rose-border">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">
              {initialData.pendingReviewCount} Post{initialData.pendingReviewCount === 1 ? "" : "s"}
            </span>
            {initialData.pendingReviewCount > 0 && (
              <span className="tabular-numbers text-xs font-semibold text-status-rose">Action needed</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">
            {initialData.pendingReviewCount === 0 ? "Reviews up to date" : "Waiting on client approval"}
          </p>
        </div>

        {/* Scheduled for Today */}
        <div className="card-interactive animate-stagger-3 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Scheduled for Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-emerald-bg text-status-emerald border border-status-emerald-border">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-display text-2xl font-bold text-foreground">
              0 Posts
            </span>
            <span className="text-xs font-semibold text-foreground-muted">Pipeline clear</span>
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">Dynamic calendar projection</p>
        </div>

        {/* Unbilled Tool Expenses */}
        <div className="card-interactive animate-stagger-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Unbilled Tool Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-amber-bg text-status-amber border border-status-amber-border">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-foreground">
              ₹{initialData.unbilledExpensesTotal.toLocaleString("en-IN")}
            </span>
            {initialData.unbilledExpensesTotal > 0 && (
              <span className="tabular-numbers text-xs font-semibold text-status-amber">Pass-through</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-foreground-muted">
            {initialData.unbilledExpensesTotal === 0 ? "Zero leakage detected" : "Leakage prevention"}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Urgent Attention Feed vs Operational Setup */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Urgent Triage Queue (2 Cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-brand" />
              <h2 className="font-display text-base font-bold text-foreground">
                Urgent Attention Surface
              </h2>
            </div>
            <span className="tabular-numbers rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-foreground-muted border border-border-subtle">
              {alerts.length} Pending
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface/50 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas border border-border-subtle text-status-emerald shadow-subtle mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                Everything is Clear
              </h3>
              <p className="mt-1 max-w-sm text-xs text-foreground-muted">
                {isDayZero
                  ? "No clients or active campaigns registered yet. When clients submit feedback or tool costs accrue, they will appear here as actionable triage items."
                  : "No pending approval delays, unbilled pass-through expenses, or emergency holds detected."}
              </p>
              {isDayZero && (
                <div className="mt-5">
                  <OnboardClientModal buttonText="+ Onboard First Client" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="card-interactive rounded-xl border border-border-subtle bg-surface p-5 shadow-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-status-amber-bg text-status-amber border border-status-amber-border">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground">
                          {alert.title}
                        </h4>
                        <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                          {alert.reason}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerAction(alert.id, alert.next_action, "Dismissed alert")}
                      className="shrink-0 rounded-lg bg-canvas px-3 py-1.5 text-xs font-semibold text-brand border border-border-subtle hover:bg-brand hover:text-white transition-colors"
                    >
                      {alert.next_action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Rail: Quick Agency Operations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand" />
            <h2 className="font-display text-base font-bold text-foreground">
              Agency Operations
            </h2>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card space-y-4">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider text-foreground-subtle">
              System Health &amp; Sync
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Database Engine:</span>
                <span className="font-semibold text-status-emerald flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-emerald" />
                  Supabase Live
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Client Portal:</span>
                <span className="font-semibold text-foreground">Zero-Login PWA Active</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Automation Core:</span>
                <span className="font-semibold text-foreground">Manual by Exception</span>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4 space-y-2">
              <Link
                href="/clients"
                className="flex w-full items-center justify-between rounded-lg bg-canvas p-2.5 text-xs font-semibold text-foreground hover:text-brand border border-border-subtle transition-colors"
              >
                <span>View Clients Directory</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
