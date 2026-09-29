"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowUpRight,
  FileText,
  Check,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { updateInvoiceStatusAction } from "@/lib/actions/billing";
import type { Invoice, ToolExpense } from "@/types/domain";

interface ClientBillingTabProps {
  clientId: string;
  clientName: string;
  invoices: Invoice[];
  tools: ToolExpense[];
  monthlyRetainer: number;
  billingAnchorDay: number;
  onDraftInvoice: () => void;
  onOpenAddExpense: () => void;
  isDrafting?: boolean;
  onToast?: (msg: string) => void;
}

export function ClientBillingTab({
  clientName,
  invoices,
  tools,
  monthlyRetainer,
  billingAnchorDay,
  onDraftInvoice,
  onOpenAddExpense,
  isDrafting = false,
  onToast,
}: ClientBillingTabProps) {
  const [isUpdating, startTransition] = useTransition();
  const router = useRouter();

  const handleMarkPaid = (invoice: Invoice) => {
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(invoice.id, "paid");
      if (res.success) {
        onToast?.(`Marked ${invoice.invoice_number} as paid.`);
        router.refresh();
      } else {
        onToast?.(res.error || "Failed to update invoice status.");
      }
    });
  };

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + Number(i.total_amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((acc, i) => acc + Number(i.total_amount || 0), 0);

  const unbilledToolsTotal = tools
    .filter((t) => t.status === "unbilled")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <div className="space-y-7">
      {/* ─── 1. HEADER & PRIMARY BILLING ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">
              Invoices &amp; Dedicated Tooling
            </h2>
            <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
              ({invoices.length} invoices · {tools.length} tools)
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
            Retainer billing history, payment statuses, and pass-through software seats for {clientName}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="btn btn-secondary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Tool Expense</span>
          </button>
          <button
            type="button"
            onClick={onDraftInvoice}
            disabled={isDrafting}
            className="btn btn-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isDrafting ? "Drafting..." : "Draft Invoice"}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FINANCIAL SUMMARY STRIP ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3.5">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
            Collected Revenue (Paid)
          </span>
          <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3.5">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
            Open / Drafted Invoices
          </span>
          <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3.5">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
            Unbilled Software Pass-Through
          </span>
          <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
            ₹{unbilledToolsTotal.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">
              (Anchor Day {billingAnchorDay})
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. INVOICES HISTORY ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)]">
            Client Invoices ({invoices.length})
          </h3>
          <Link
            href="/billing"
            className="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
          >
            <span>All Agency Billing</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-8 text-center space-y-2.5">
            <p className="text-xs text-[var(--color-ink-secondary)]">
              No invoices have been drafted for {clientName} yet.
            </p>
            <p className="text-[11px] text-[var(--color-ink-tertiary)]">
              Monthly retainer (₹{monthlyRetainer.toLocaleString("en-IN")}) plus unbilled software seats will be bundled automatically.
            </p>
            <button
              type="button"
              onClick={onDraftInvoice}
              disabled={isDrafting}
              className="btn btn-secondary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Draft First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] overflow-hidden">
            {invoices.map((inv) => {
              const statusDot =
                inv.status === "paid"
                  ? "bg-emerald-500"
                  : inv.status === "overdue"
                  ? "bg-red-500"
                  : inv.status === "sent"
                  ? "bg-blue-500"
                  : "bg-amber-500";

              return (
                <div
                  key={inv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-sans tabular-nums tracking-wider text-[var(--color-ink-secondary)]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-ink)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                        <span>{inv.status.toUpperCase()}</span>
                      </span>
                      <span className="text-[var(--color-ink-muted)]">·</span>
                      <span>Issued {inv.issue_date}</span>
                      <span className="text-[var(--color-ink-muted)]">·</span>
                      <span>Due {inv.due_date}</span>
                    </div>

                    <div className="flex items-baseline gap-2.5">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="text-sm font-semibold text-[var(--color-ink)] hover:underline font-sans tabular-nums"
                      >
                        {inv.invoice_number}
                      </Link>
                      <span className="text-xs text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                        {inv.line_items && inv.line_items.length > 0
                          ? `${inv.line_items.length} line item${inv.line_items.length > 1 ? "s" : ""}`
                          : "Retainer invoice"}
                      </span>
                    </div>

                    {inv.line_items && inv.line_items.length > 0 && (
                      <p className="text-xs text-[var(--color-ink-secondary)] truncate">
                        {inv.line_items.map((li) => li.description).join(" + ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right mr-1">
                      <span className="font-sans text-sm font-semibold text-[var(--color-ink)] block tabular-nums">
                        ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {inv.status !== "paid" && inv.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(inv)}
                        disabled={isUpdating}
                        className="btn btn-secondary text-xs"
                        title="Mark invoice as paid"
                      >
                        <Check className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                        <span>Mark Paid</span>
                      </button>
                    )}

                    <Link
                      href={`/billing/invoices/${inv.id}`}
                      className="btn btn-secondary text-xs"
                      title="Open print-ready invoice sheet"
                    >
                      <FileText className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                      <span>View / Print</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. DEDICATED SOFTWARE EXPENSES ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)]">
              Dedicated Tooling &amp; Pass-Through Expenses ({tools.length})
            </h3>
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-6 text-center space-y-2">
            <p className="text-xs text-[var(--color-ink-tertiary)]">
              No dedicated software tools allocated to this account yet.
            </p>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="btn btn-secondary text-xs"
            >
              Log First Tool Expense
            </button>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {tools.map((tool: ToolExpense) => (
                <div
                  key={tool.id}
                  className="p-3.5 flex items-center justify-between text-xs hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BrandLogo
                      nameOrDomain={tool.tool_name || tool.description}
                      size={28}
                      className="rounded-md object-contain"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-medium text-[var(--color-ink)] block truncate">
                        {tool.description}
                      </span>
                      <span className="text-[var(--color-ink-tertiary)] text-[11px] font-sans tabular-nums">
                        Date: {tool.incurred_date}
                        {tool.tool_name ? ` · Tool: ${tool.tool_name}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-sm font-medium text-[var(--color-ink)] block tabular-nums">
                      ₹{Number(tool.amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10.5px] font-sans tabular-nums uppercase text-[var(--color-ink-muted)]">
                      {tool.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
