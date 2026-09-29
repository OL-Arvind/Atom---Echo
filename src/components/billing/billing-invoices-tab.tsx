"use client";

import React from "react";
import Link from "next/link";
import { Receipt, FileCheck, ExternalLink } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { BrandLogo } from "@/components/ui/brand-logo";

interface BillingInvoicesTabProps {
  clients: any[];
  initialInvoices: any[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  onDraftInvoice: () => void;
  isPending: boolean;
}

export function BillingInvoicesTab({
  clients,
  initialInvoices,
  selectedClientId,
  setSelectedClientId,
  onDraftInvoice,
  isPending,
}: BillingInvoicesTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Draft Generator Card */}
      <div className="card p-5 space-y-3 bg-[var(--color-base-raised)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-display text-base font-normal text-[var(--color-ink)] block">
              Generate Retainer &amp; Tooling Invoice
            </span>
            <p className="text-xs text-[var(--color-ink-secondary)]">
              Generates a client invoice bundling the monthly thought leadership retainer and unbilled pass-through tools.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-56">
              <CustomSelect
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.name,
                  description: c.founder_name,
                  brandName: c.website_url || c.name,
                }))}
                value={selectedClientId}
                onChange={setSelectedClientId}
                placeholder="Select Client"
              />
            </div>

            <button
              onClick={onDraftInvoice}
              disabled={isPending || clients.length === 0}
              className="btn btn-primary text-xs"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>{isPending ? "Generating..." : "Generate Invoice"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Invoices List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
          <div className="flex items-center gap-2.5">
            <Receipt className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
              Client Invoice Registry ({initialInvoices.length})
            </h2>
          </div>
          <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
            Select invoice to review, dispatch, or export
          </span>
        </div>

        {initialInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
            <p>No invoices drafted yet.</p>
            <p className="text-[11px]">Select a client above and click &quot;Create Invoice&quot;, or run the anchor cycle.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line-subtle)]">
            {initialInvoices.map((inv) => {
              const client = inv.engagements?.clients;
              const items = inv.invoice_line_items || [];

              return (
                <Link
                  key={inv.id}
                  href={`/billing/invoices/${inv.id}`}
                  className="block p-5 space-y-3 hover:bg-[var(--color-surface-hover)] transition-colors group cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs font-semibold text-[var(--color-ink)] tabular-nums">
                        {inv.invoice_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <BrandLogo nameOrDomain={client?.name || ""} size={18} className="rounded-[2px]" />
                        <span className="text-xs font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                          {client?.name}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          inv.status === "paid"
                            ? "bg-[var(--color-ok)]"
                            : inv.status === "sent"
                            ? "bg-[var(--color-accent)]"
                            : "bg-[var(--color-ink-muted)]"
                        }`} />
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums block">
                          ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                          Due: {inv.due_date}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-ink)] transition-colors shrink-0" />
                    </div>
                  </div>

                  {/* Line Items Preview */}
                  <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)] space-y-1.5 text-xs">
                    {items.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-[var(--color-ink-secondary)]">
                        <span>{it.description}</span>
                        <span className="font-sans font-medium text-[var(--color-ink)] tabular-nums">
                          ₹{Number(it.total_price).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
