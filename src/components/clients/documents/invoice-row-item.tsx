"use client";

import React from "react";
import Link from "next/link";
import { Receipt, ArrowUpRight, Copy, Check } from "lucide-react";
import type { Invoice } from "@/types/domain";
import { formatShortDate } from "./document-list-utils";

interface InvoiceRowItemProps {
  inv: Invoice;
  isCopied: boolean;
  onCopyUrl: () => void;
}

export function InvoiceRowItem({ inv, isCopied, onCopyUrl }: InvoiceRowItemProps) {
  const statusDot =
    inv.status === "paid"
      ? "bg-emerald-400"
      : inv.status === "overdue"
      ? "bg-red-400"
      : inv.status === "sent"
      ? "bg-blue-400"
      : "bg-amber-400";

  const statusLabel =
    inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
  const invoiceUrl = `/billing/invoices/${inv.id}`;
  const summaryText =
    inv.line_items && inv.line_items.length > 0
      ? inv.line_items.map((li) => li.description).join(" + ")
      : null;

  return (
    <div className="group px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <Link
          href={invoiceUrl}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] group-hover:border-[var(--color-line-strong)] group-hover:text-[var(--color-ink)] transition-colors mt-0.5 sm:mt-0"
        >
          <Receipt className="h-4 w-4" />
        </Link>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 font-sans tabular-nums">
            <Link
              href={invoiceUrl}
              className="text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] hover:underline"
            >
              Invoice {inv.invoice_number}
            </Link>
            <span className="text-xs font-medium text-[var(--color-ink-secondary)]">
              ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
              <span>{statusLabel}</span>
            </span>
            <span>·</span>
            <span>Issued {formatShortDate(inv.issue_date)}</span>
            {inv.due_date && (
              <>
                <span>·</span>
                <span>Due {formatShortDate(inv.due_date)}</span>
              </>
            )}
            {summaryText && (
              <>
                <span>·</span>
                <span className="text-[var(--color-ink-secondary)] truncate max-w-[280px]">
                  {summaryText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCopyUrl}
          className="btn btn-ghost text-xs p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          title="Copy invoice link"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-[var(--color-ok-text)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <Link
          href={invoiceUrl}
          className="btn btn-secondary text-[11.5px] py-1 px-2.5 inline-flex items-center gap-1"
        >
          <span>Invoice</span>
          <ArrowUpRight className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
        </Link>
      </div>
    </div>
  );
}
