"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  ChevronRight,
  Building2,
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
    <div className="mx-auto max-w-7xl space-y-8 animate-stagger-1 text-white">
      {/* Morning Briefing Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.7)] sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            OPERATIONAL COCKPIT &middot; SUPABASE ENGINE
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
            {isDayZero ? "Welcome to Atom & Echo OS" : "Good morning, Sudeesh."}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {isDayZero
              ? "Your operating system is live on Supabase. Onboard your first founder client below to initiate autonomous content workflows and billing tracking."
              : `The operating system identified ${alerts.length} item(s) requiring attention today. Zero manual spreadsheet upkeep needed.`}
          </p>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white border border-zinc-700 shadow-lg animate-stagger-1">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {isDayZero && <OnboardClientModal buttonText="+ Onboard First Founder" />}
      </div>

      {/* KPI Horizon Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Retainers */}
        <div className="card-interactive animate-stagger-1 rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Retainers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-white">
              {initialData.activeClientsCount}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              Client{initialData.activeClientsCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {isDayZero ? "0 active retainers" : `${initialData.activeClientsCount} live contract(s)`}
          </p>
        </div>

        {/* Pending Client Reviews */}
        <div className="card-interactive animate-stagger-2 rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Pending Client Reviews</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-white">
              {initialData.pendingReviewCount}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              Post{initialData.pendingReviewCount === 1 ? "" : "s"}
            </span>
            {initialData.pendingReviewCount > 0 && (
              <span className="tabular-numbers rounded bg-white text-black px-1.5 py-0.5 text-[10px] font-bold">
                Action Required
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {initialData.pendingReviewCount === 0 ? "Reviews up to date" : "Waiting on founder approval"}
          </p>
        </div>

        {/* Scheduled for Today */}
        <div className="card-interactive animate-stagger-3 rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Scheduled for Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-white">
              0
            </span>
            <span className="text-xs font-medium text-zinc-400">Posts</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">Dynamic calendar projection</p>
        </div>

        {/* Unbilled Tool Expenses */}
        <div className="card-interactive animate-stagger-4 rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Unbilled Tool Expenses</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="tabular-numbers font-mono text-2xl font-bold text-white">
              ₹{initialData.unbilledExpensesTotal.toLocaleString("en-IN")}
            </span>
            {initialData.unbilledExpensesTotal > 0 && (
              <span className="tabular-numbers rounded border border-zinc-700 bg-zinc-800 text-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold">
                Pass-through
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {initialData.unbilledExpensesTotal === 0 ? "Zero leakage detected" : "Leakage prevention guard"}
          </p>
        </div>
      </div>

      {/* Main Grid: Urgent Attention Feed vs Operational Setup */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Urgent Triage Queue (2 Cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-white" />
              <h2 className="font-display text-base font-bold text-white">
                Urgent Attention Surface
              </h2>
            </div>
            <span className="tabular-numbers font-mono rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-zinc-800">
              {alerts.length} Pending
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#0C0C0E]/50 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-inner mb-3">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Everything is Clear
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-400 leading-relaxed">
                {isDayZero
                  ? "No client engagements or active campaigns registered yet. When client reviews are pending or tool expenses accrue, they will appear here as actionable triage items."
                  : "Zero pending approval bottlenecks, unbilled pass-through expenses, or emergency holds detected."}
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
                  className="card-interactive rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white border border-zinc-700">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-white">
                          {alert.title}
                        </h4>
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                          {alert.reason}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerAction(alert.id, alert.next_action, "Dismissed alert")}
                      className="btn-pressable shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black border border-white hover:bg-zinc-200 transition-colors"
                    >
                      {alert.next_action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Rail: Agency Operations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-white" />
            <h2 className="font-display text-base font-bold text-white">
              Agency Operations
            </h2>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              System Health &amp; Sync
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Database Engine:</span>
                <span className="font-medium text-white flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Supabase Live
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Client Portal:</span>
                <span className="font-medium text-white font-mono">Zero-Login PWA</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Automation Core:</span>
                <span className="font-medium text-white font-mono">Manual by Exception</span>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-4 space-y-2">
              <Link
                href="/clients"
                className="btn-pressable flex w-full items-center justify-between rounded-lg bg-zinc-900 p-2.5 text-xs font-semibold text-white hover:bg-zinc-800 border border-zinc-800 transition-all"
              >
                <span>View Clients Directory</span>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
