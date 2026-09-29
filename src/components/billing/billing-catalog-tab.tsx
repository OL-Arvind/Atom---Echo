"use client";

import React from "react";
import { Wrench, Plus, Trash2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

interface BillingCatalogTabProps {
  toolSubscriptions: any[];
  onAddTool: () => void;
  onDeleteTool: (toolId: string) => void;
  isPending: boolean;
}

export function BillingCatalogTab({
  toolSubscriptions,
  onAddTool,
  onDeleteTool,
  isPending,
}: BillingCatalogTabProps) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
        <div className="flex items-center gap-2.5">
          <Wrench className="h-4 w-4 text-[var(--color-accent)]" />
          <div>
            <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
              Agency Tool Subscriptions ({toolSubscriptions.length})
            </h2>
            <p className="text-[11px] text-[var(--color-ink-secondary)]">
              Active software licenses, renewal cycles, and pass-through defaults.
            </p>
          </div>
        </div>
        <button
          onClick={onAddTool}
          className="btn btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Tool</span>
        </button>
      </div>

      {toolSubscriptions.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
          <p>No tools in the catalog yet.</p>
          <button
            onClick={onAddTool}
            className="btn btn-secondary text-xs"
          >
            Add Your First Tool
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {toolSubscriptions.map((tool) => {
            const today = new Date().toISOString().split("T")[0];
            const fiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
            const isRenewingSoon = tool.next_renewal_date >= today && tool.next_renewal_date <= fiveDays;

            return (
              <div
                key={tool.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BrandLogo
                    nameOrDomain={tool.tool_name}
                    size={32}
                    className="rounded-md object-contain shrink-0"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-[var(--color-ink)]">{tool.tool_name}</span>
                      <span className="text-[10px] font-sans tabular-nums uppercase text-[var(--color-ink-muted)]">
                        {tool.billing_cycle}
                      </span>
                      {tool.default_pass_through && (
                        <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-muted)]">
                          · Pass-Through
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      <span>Next Renewal: {tool.next_renewal_date}</span>
                      {isRenewingSoon && (
                        <span className="flex items-center gap-1.5 text-[11px] font-sans tabular-nums text-[var(--color-warn-text)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" />
                          Renews in &le; 5 days
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-display text-base font-normal text-[var(--color-ink)] tabular-nums block">
                      {tool.currency} {Number(tool.cost_amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                      per {tool.billing_cycle}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTool(tool.id)}
                    disabled={isPending}
                    className="btn btn-ghost text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] p-2 cursor-pointer"
                    title="Delete Tool Subscription"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
