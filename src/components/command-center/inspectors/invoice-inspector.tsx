"use client";

import React from "react";
import Link from "next/link";
import { FileCheck, ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";
import type { CommandCenterAlert, InvoiceLineItem } from "@/types/domain";

interface InvoiceInspectorProps {
  selectedAlert: CommandCenterAlert;
  isPending: boolean;
  onApproveInvoice: (alert: CommandCenterAlert) => void;
  onOpenInvoiceWhatsAppPing: (alert: CommandCenterAlert) => void;
}

export function InvoiceInspector({
  selectedAlert,
  isPending,
  onApproveInvoice,
  onOpenInvoiceWhatsAppPing,
}: InvoiceInspectorProps) {
  return (
    <>
      {/* Sleek Header */}
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-semibold text-[var(--color-ink)]">{selectedAlert.client_name || "Client"}</span>
              {selectedAlert.founder_name && (
                <>
                  <span className="text-[var(--color-line-strong)]">&middot;</span>
                  <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.founder_name}</span>
                </>
              )}
              {selectedAlert.due_date && (
                <>
                  <span className="text-[var(--color-line-strong)]">&middot;</span>
                  <span className="text-[var(--color-ink-muted)]">Due {formatDisplayDateIST(selectedAlert.due_date)}</span>
                </>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
              {selectedAlert.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Reading Canvas */}
      <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 space-y-4 overflow-y-auto min-h-0">
        {/* Executive Invoice Document Card */}
        <div className="max-w-3xl card p-5 space-y-4">
          {/* Card Header: Invoice Metadata */}
          <div className="flex items-start justify-between pb-3 border-b border-[var(--color-line-subtle)]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                Invoice Amount Due
              </span>
              <div className="text-xl sm:text-2xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-[var(--color-ink-tertiary)] font-sans">
                {selectedAlert.client_name} {selectedAlert.due_date ? `· Due ${formatDisplayDateIST(selectedAlert.due_date)}` : ""}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--color-ink-muted)]">
                Status
              </span>
              <div className="flex items-center gap-1.5 justify-end text-xs font-sans text-amber-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Draft &middot; Sign-Off</span>
              </div>
              <div className="text-[11px] text-[var(--color-ink-muted)] font-sans tabular-nums">
                {selectedAlert.invoice_number}
              </div>
            </div>
          </div>

          {/* Line Items Table with Proximity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] pb-1.5 border-b border-[var(--color-line-subtle)]">
              <span>Scope &amp; Tool Infrastructure</span>
              <span>Amount</span>
            </div>

            <div className="divide-y divide-[var(--color-line-subtle)]">
              {selectedAlert.line_items && selectedAlert.line_items.length > 0 ? (
                selectedAlert.line_items.map((item: InvoiceLineItem, idx: number) => (
                  <div key={item.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-4">
                      <p className="font-medium text-[var(--color-ink)]">{item.description}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="font-sans font-semibold text-[var(--color-ink)] tabular-nums text-[13px] shrink-0">
                      ₹{Number(item.total_price || item.unit_price || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[var(--color-ink-muted)]">
                  {selectedAlert.reason || "Monthly Retainer draft pending dispatch."}
                </div>
              )}
            </div>

            {/* Subtotal / Total Summary */}
            <div className="pt-3 border-t border-[var(--color-line-subtle)] flex items-center justify-between text-xs font-sans">
              <span className="text-[var(--color-ink-secondary)]">Total Retainer &amp; Tooling</span>
              <span className="font-semibold text-[var(--color-ink)] tabular-nums text-[14px]">
                ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onApproveInvoice(selectedAlert)}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3.5 py-1.5 shadow-xs cursor-pointer"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>{isPending ? "Approving..." : "Approve & Dispatch"}</span>
          </button>

          <Link
            href={`/billing/invoices/${selectedAlert.entity_id}`}
            className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>Printable Invoice</span>
          </Link>

          <button
            onClick={() => onOpenInvoiceWhatsAppPing(selectedAlert)}
            className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
          >
            <WhatsAppIcon size={13} className="text-[#25D366]" />
            <span>WhatsApp Summary</span>
          </button>
        </div>

        <Link
          href="/billing"
          className="text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors shrink-0"
        >
          Billing &rarr;
        </Link>
      </div>
    </>
  );
}
