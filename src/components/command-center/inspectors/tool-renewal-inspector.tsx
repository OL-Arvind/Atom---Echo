"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { CommandCenterAlert } from "@/types/domain";

interface ToolRenewalInspectorProps {
  selectedAlert: CommandCenterAlert;
  isPending: boolean;
  onAdvanceToolRenewal: (alert: CommandCenterAlert) => void;
}

export function ToolRenewalInspector({
  selectedAlert,
  isPending,
  onAdvanceToolRenewal,
}: ToolRenewalInspectorProps) {
  return (
    <>
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
              <span className="font-semibold text-[var(--color-ink)]">Agency Tooling Renewal</span>
              {selectedAlert.next_renewal_date && (
                <>
                  <span className="text-[var(--color-line-strong)]">&middot;</span>
                  <span className="text-[var(--color-ink-muted)] tabular-nums">Renews {selectedAlert.next_renewal_date}</span>
                </>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
              {selectedAlert.tool_name || selectedAlert.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 space-y-4 overflow-y-auto min-h-0">
        <div className="max-w-3xl card p-5 space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-[var(--color-line-subtle)]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                Renewal Cost
              </span>
              <div className="text-xl sm:text-2xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                {selectedAlert.currency || "INR"}{" "}
                {Number(selectedAlert.cost_amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <span className="text-[10.5px] uppercase font-sans tracking-wider text-violet-500 font-medium tabular-nums">
              Renews {selectedAlert.next_renewal_date}
            </span>
          </div>
          <div className="space-y-2 text-xs divide-y divide-[var(--color-line-subtle)]">
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--color-ink-secondary)]">Allocation</span>
              <span className="font-medium text-[var(--color-ink)]">
                {selectedAlert.default_pass_through ? "Client Pass-through" : "Agency Overhead"}
              </span>
            </div>
            {selectedAlert.reason && (
              <div className="pt-2 text-[var(--color-ink-muted)] leading-relaxed">
                {selectedAlert.reason}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => onAdvanceToolRenewal(selectedAlert)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 btn btn-accent text-xs font-semibold px-3.5 py-1.5 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          <span>{isPending ? "Updating..." : "Confirm Renewal · Advance Cycle"}</span>
        </button>

        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5"
        >
          <span>Tool Infrastructure Catalog</span>
        </Link>
      </div>
    </>
  );
}
