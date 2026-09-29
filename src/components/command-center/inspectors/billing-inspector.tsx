"use client";

import React from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { getExpenseClientName } from "../command-center-utils";
import type { CommandCenterAlert, CommandCenterExpenseItem } from "@/types/domain";

interface BillingInspectorProps {
  selectedAlert: CommandCenterAlert;
  unbilledExpensesTotal: number;
  unbilledExpenses: CommandCenterExpenseItem[];
  isPending: boolean;
  onQuickDraftInvoice: (clientId?: string) => void;
}

export function BillingInspector({
  selectedAlert,
  unbilledExpensesTotal,
  unbilledExpenses,
  isPending,
  onQuickDraftInvoice,
}: BillingInspectorProps) {
  return (
    <>
      {/* Sleek Header */}
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="font-semibold text-[var(--color-ink)]">Client Pass-Through Tooling</span>
              <span className="text-[var(--color-ink-ghost)]">&middot;</span>
              <span className="text-[var(--color-ink-muted)]">Zero Agency Markup</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
              {selectedAlert.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Reading Canvas */}
      <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 space-y-4 overflow-y-auto min-h-0">
        {/* Executive Tool Ledger Card */}
        <div className="max-w-3xl card p-5 space-y-3.5">
          <div className="flex items-baseline justify-between pb-3 border-b border-[var(--color-line)]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                Unbilled Tool Expenses
              </span>
              <div className="text-xl sm:text-2xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                ₹{unbilledExpensesTotal.toLocaleString("en-IN")}
              </div>
            </div>
            <span className="text-[10.5px] uppercase font-sans tracking-wider text-sky-500 dark:text-sky-400 font-medium">
              {unbilledExpenses.length} pass-through {unbilledExpenses.length === 1 ? "cost" : "costs"}
            </span>
          </div>

          <div className="divide-y divide-[var(--color-line-subtle)]">
            {unbilledExpenses && unbilledExpenses.length > 0 ? (
              unbilledExpenses.map((exp, i) => (
                <div key={exp.id || i} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-4">
                    <div className="text-[var(--color-ink)] font-medium">{exp.description}</div>
                    <div className="text-[11px] text-[var(--color-ink-muted)]">
                      Client: {getExpenseClientName(exp)}
                    </div>
                  </div>
                  <div className="font-sans text-[var(--color-ink)] font-semibold tabular-nums text-[13px] shrink-0">
                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-[var(--color-ink-muted)]">
                No unbilled client tooling recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
        <button
          onClick={() => onQuickDraftInvoice()}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3.5 py-1.5 shadow-xs cursor-pointer"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>{isPending ? "Drafting..." : "Draft Retainer & Tooling Invoice"}</span>
        </button>

        <Link
          href="/billing"
          className="text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors"
        >
          Retainers &amp; Invoices &rarr;
        </Link>
      </div>
    </>
  );
}
