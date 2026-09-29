"use client";

import React from "react";
import { CreditCard, Plus } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

interface BillingExpensesTabProps {
  initialExpenses: any[];
  onMarkBilled: (expenseId: string) => void;
  onAddExpense: () => void;
  isPending: boolean;
}

export function BillingExpensesTab({
  initialExpenses,
  onMarkBilled,
  onAddExpense,
  isPending,
}: BillingExpensesTabProps) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
        <div className="flex items-center gap-2.5">
          <CreditCard className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
            Dedicated Client Tool Expenses ({initialExpenses.length})
          </h2>
        </div>
        <button
          onClick={onAddExpense}
          className="btn btn-secondary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Tool Expense</span>
        </button>
      </div>

      {initialExpenses.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] leading-relaxed space-y-2">
          <p>No dedicated client software expenses recorded yet.</p>
          <button
            onClick={onAddExpense}
            className="btn btn-secondary text-xs"
          >
            Add Tool Expense
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {initialExpenses.map((exp: any) => (
            <div
              key={exp.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <BrandLogo
                  nameOrDomain={exp.tool_name || exp.description}
                  size={28}
                  className="rounded-md object-contain shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-xs text-[var(--color-ink)]">{exp.description}</span>
                    <span className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        exp.status === "invoiced"
                          ? "bg-[var(--color-ok)]"
                          : exp.status === "drafted_in_invoice"
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-ink-muted)]"
                      }`} />
                      {exp.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                    Client: {exp.engagements?.clients?.name || "Client"} &middot; Incurred: {exp.incurred_date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-display text-base font-normal text-[var(--color-ink)] block tabular-nums">
                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                  </span>
                </div>

                {exp.status === "unbilled" && (
                  <button
                    onClick={() => onMarkBilled(exp.id)}
                    disabled={isPending}
                    className="btn btn-ghost text-xs"
                    title="Mark as invoiced manually"
                  >
                    Mark Billed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
