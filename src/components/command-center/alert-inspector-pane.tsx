"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Receipt,
  Check,
  X,
  ArrowUpRight,
  FileCheck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";
import type {
  CommandCenterAlert,
  CommandCenterExpenseItem,
  InvoiceLineItem,
} from "@/types/domain";

interface AlertInspectorPaneProps {
  selectedAlert: CommandCenterAlert | null;
  unbilledExpensesTotal: number;
  unbilledExpenses: CommandCenterExpenseItem[];
  copiedToken: string | null;
  isPending: boolean;
  onDismissAlert: (alertId: string) => void;
  onCopyReviewLink: (alert: CommandCenterAlert) => void;
  onOpenWhatsAppPing: (alert: CommandCenterAlert) => void;
  onQuickApprove: (alert: CommandCenterAlert) => void;
  onResolveFeedback: (alert: CommandCenterAlert) => void;
  onOpenFeedbackWhatsAppPing: (alert: CommandCenterAlert) => void;
  onQuickDraftInvoice: (clientId?: string) => void;
  onApproveInvoice: (alert: CommandCenterAlert) => void;
  onOpenInvoiceWhatsAppPing: (alert: CommandCenterAlert) => void;
}

function getExpenseClientName(exp: CommandCenterExpenseItem): string {
  if (exp.client) return exp.client;
  if (!exp.engagements) return "Client";
  const eng = Array.isArray(exp.engagements) ? exp.engagements[0] : exp.engagements;
  if (!eng || typeof eng !== "object") return "Client";
  const clients = (eng as Record<string, unknown>).clients;
  if (!clients) return "Client";
  const client = Array.isArray(clients) ? clients[0] : clients;
  if (!client || typeof client !== "object") return "Client";
  return ((client as Record<string, unknown>).name as string) || "Client";
}

export function AlertInspectorPane({
  selectedAlert,
  unbilledExpensesTotal,
  unbilledExpenses,
  copiedToken,
  isPending,
  onDismissAlert,
  onCopyReviewLink,
  onOpenWhatsAppPing,
  onQuickApprove,
  onResolveFeedback,
  onOpenFeedbackWhatsAppPing,
  onQuickDraftInvoice,
  onApproveInvoice,
  onOpenInvoiceWhatsAppPing,
}: AlertInspectorPaneProps) {
  if (!selectedAlert) {
    return (
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] p-12 text-center space-y-3 shadow-xs">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Every founder account is on track
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 max-w-sm mx-auto leading-relaxed">
            No pending founder reviews, editorial revisions, or unbilled tooling right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] p-6 space-y-5 sticky top-6 shadow-xs">
      {/* CASE 0: CLIENT CONTENT REVISION FEEDBACK */}
      {selectedAlert.entity_type === "content_feedback" && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                  Founder Revision &amp; Voice Refinement
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
                {selectedAlert.post_title}
              </h2>
              <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                <span className="text-[var(--color-ink)] font-medium">
                  {selectedAlert.founder_name} ({selectedAlert.client_name})
                </span>
                <span>&middot;</span>
                <span>{selectedAlert.target_pillar || "Thought Leadership"}</span>
              </div>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Feedback Note - Clean Inset */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)]">
              Founder Note &middot; {selectedAlert.founder_name}
            </div>

            <div className="border-l-2 border-amber-500/80 bg-[var(--color-base-subtle)] rounded-r-md px-4 py-3">
              <p className="text-[13px] text-[var(--color-ink)] font-sans leading-relaxed select-text font-normal">
                {selectedAlert.comment}
              </p>
            </div>
          </div>

          {/* Post Draft Content Preview */}
          {selectedAlert.body_markdown && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
                <span className="font-medium text-[var(--color-ink-secondary)]">Working Story Draft</span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  Stage:{" "}
                  {selectedAlert.post_status === "internal_review"
                    ? "Internal Voice QA"
                    : selectedAlert.post_status === "client_review"
                    ? "Founder Review"
                    : "Draft"}
                </span>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 max-h-52 overflow-y-auto">
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-line select-text font-sans">
                  {selectedAlert.body_markdown}
                </p>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {selectedAlert.post_id && (
                <Link
                  href={`/content/${selectedAlert.post_id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-primary text-xs"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Refine in Story Editor</span>
                </Link>
              )}

              <button
                onClick={() => onOpenFeedbackWhatsAppPing(selectedAlert)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Ack on WhatsApp</span>
              </button>

              <button
                onClick={() => onResolveFeedback(selectedAlert)}
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isPending ? "Updating..." : "Mark as Resolved"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)] text-xs">
              {selectedAlert.review_token ? (
                <Link
                  href={`/review/${selectedAlert.review_token}`}
                  target="_blank"
                  className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Preview Founder Desk ↗</span>
                </Link>
              ) : (
                <span className="text-[var(--color-ink-muted)]">Portal active</span>
              )}

              <Link
                href="/operations"
                className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
              >
                <span>Editorial audit stream &rarr;</span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* CASE 1: CONTENT ITEM REVIEW */}
      {selectedAlert.entity_type === "content_item" && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                  Awaiting Founder Sign-Off
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
                {selectedAlert.post_title || selectedAlert.title}
              </h2>
              <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                <span className="text-[var(--color-ink)] font-medium">{selectedAlert.founder_name}</span>
                <span>&middot;</span>
                <span>{selectedAlert.target_pillar || "Thought Leadership"}</span>
              </div>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* LinkedIn Live Post Preview Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
              <span className="font-medium text-[var(--color-ink-secondary)]">Founder Voice Preview</span>
              <span className="text-[11px] text-[var(--color-ink-muted)]">Simulated LinkedIn Format</span>
            </div>

            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4.5 space-y-3">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--color-line)]">
                <div className="h-8 w-8 rounded-full bg-[var(--color-base-subtle)] border border-[var(--color-line)] flex items-center justify-center text-xs text-[var(--color-accent)] font-semibold">
                  {(selectedAlert.founder_name || "F")[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-ink)]">{selectedAlert.founder_name}</div>
                  <div className="text-[11px] text-[var(--color-ink-tertiary)]">
                    Founder Profile &middot; Thought Leadership
                  </div>
                </div>
              </div>

              <div className="text-[13px] text-[var(--color-ink)] leading-relaxed whitespace-pre-line select-text font-sans">
                {selectedAlert.body_markdown || "No draft content written yet."}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => onCopyReviewLink(selectedAlert)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-primary text-xs"
              >
                {copiedToken === selectedAlert.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Founder Desk Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenWhatsAppPing(selectedAlert)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Ping Founder on WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)] text-xs">
              {selectedAlert.review_token ? (
                <Link
                  href={`/review/${selectedAlert.review_token}`}
                  target="_blank"
                  className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Preview Client View</span>
                </Link>
              ) : (
                <span className="text-[var(--color-ink-muted)]">No review link generated</span>
              )}

              <button
                onClick={() => onQuickApprove(selectedAlert)}
                disabled={isPending}
                className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isPending ? "Approving..." : "Approve Post"}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* CASE 2: UNBILLED TOOL EXPENSES */}
      {selectedAlert.entity_type === "billing" && (
        <>
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                  Dedicated Client Tooling
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                {selectedAlert.title}
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)]">{selectedAlert.reason}</p>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tool List */}
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-ink-tertiary)] flex justify-between">
              <span className="font-medium text-[var(--color-ink-secondary)]">Transparent Tool Pass-Throughs</span>
              <span className="text-[var(--color-ink)] font-semibold font-sans tabular-nums">
                Total: ₹{unbilledExpensesTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] divide-y divide-[var(--color-line-subtle)]">
              {unbilledExpenses && unbilledExpenses.length > 0 ? (
                unbilledExpenses.map((exp, i) => (
                  <div key={exp.id || i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[var(--color-ink)] font-medium">{exp.description}</div>
                      <div className="text-[11px] text-[var(--color-ink-tertiary)]">
                        Client: {getExpenseClientName(exp)}
                      </div>
                    </div>
                    <div className="font-sans text-[var(--color-ink)] font-semibold tabular-nums">
                      ₹{Number(exp.amount).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[var(--color-ink-tertiary)]">
                  No unbilled client tooling recorded.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onQuickDraftInvoice()}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold py-2.5"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>{isPending ? "Drafting..." : "Draft Retainer & Tooling Invoice"}</span>
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-tertiary)]">
              <span>Transparent pass-through tooling (zero agency markup)</span>
              <Link
                href="/billing"
                className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors"
              >
                Retainers &amp; Invoices &rarr;
              </Link>
            </div>
          </div>
        </>
      )}

      {/* CASE 3: CLIENT REQUEST / EMERGENCY HOLD */}
      {selectedAlert.entity_type === "client_request" && (
        <>
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                  Founder Note &middot; Active Hold
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                {selectedAlert.title}
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                Founder: {selectedAlert.founder_name || "Client"}
              </p>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4">
            <p className="text-xs text-[var(--color-ink)] leading-relaxed select-text font-sans">
              {selectedAlert.reason}
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            {selectedAlert.client_id && (
              <Link
                href={`/clients/${selectedAlert.client_id}`}
                className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
              >
                <span>Open Founder Desk</span>
              </Link>
            )}

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-secondary text-xs"
            >
              <span>Resolve &amp; Resume</span>
            </button>
          </div>
        </>
      )}

      {/* CASE 4: DRAFT INVOICE AWAITING SIGN-OFF */}
      {selectedAlert.entity_type === "invoice_draft" && (
        <>
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] text-emerald-400 font-medium font-sans tabular-nums uppercase tracking-wider">
                  Retainer Invoice &middot; Ready for Dispatch
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                {selectedAlert.title}
              </h2>
              <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                <span className="text-[var(--color-ink)] font-medium">
                  {selectedAlert.client_name || "Client"}
                </span>
                {selectedAlert.founder_name && (
                  <>
                    <span>&middot;</span>
                    <span>Founder: {selectedAlert.founder_name}</span>
                  </>
                )}
                {selectedAlert.due_date && (
                  <>
                    <span>&middot;</span>
                    <span>Due: {formatDisplayDateIST(selectedAlert.due_date)}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Invoice Summary Banner */}
          <div className="flex items-baseline justify-between p-4 rounded-lg bg-[var(--color-base-subtle)] border border-[var(--color-line)]">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-ink-muted)] block">
                Total Invoice Amount
              </span>
              <div className="text-2xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[var(--color-ink-muted)] block">Status</span>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                Draft &middot; Founder Sign-Off
              </span>
            </div>
          </div>

          {/* Line Items Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
              <span className="font-medium text-[var(--color-ink-secondary)]">
                Retainer Scope &amp; Tool Infrastructure
              </span>
              <span className="text-[11px] text-[var(--color-ink-muted)]">
                {selectedAlert.line_items?.length || 0} line item
                {selectedAlert.line_items?.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] divide-y divide-[var(--color-line-subtle)]">
              {selectedAlert.line_items && selectedAlert.line_items.length > 0 ? (
                selectedAlert.line_items.map((item: InvoiceLineItem, idx: number) => (
                  <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-[var(--color-ink)] truncate">{item.description}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <div className="font-sans font-semibold text-[var(--color-ink)] tabular-nums shrink-0">
                      ₹{Number(item.total_price || item.unit_price || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[var(--color-ink-tertiary)]">
                  {selectedAlert.reason || "Monthly Retainer draft pending dispatch."}
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => onApproveInvoice(selectedAlert)}
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold py-2.5"
              >
                <FileCheck className="h-3.5 w-3.5 text-[var(--color-base)]" />
                <span>{isPending ? "Approving..." : "Approve & Ready for Client"}</span>
              </button>

              <Link
                href={`/billing/invoices/${selectedAlert.entity_id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs py-2.5"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                <span>View Printable Invoice</span>
              </Link>

              <button
                onClick={() => onOpenInvoiceWhatsAppPing(selectedAlert)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs py-2.5"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Send WhatsApp Summary</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-tertiary)]">
              <span>Confirms retainer &amp; software totals for client dispatch</span>
              <Link
                href="/billing"
                className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors"
              >
                Retainers &amp; Billing &rarr;
              </Link>
            </div>
          </div>
        </>
      )}

      {/* CASE 5: TOOL SUBSCRIPTION RENEWAL */}
      {selectedAlert.entity_type === "tool_renewal" && (
        <>
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                <span className="text-[11px] text-violet-400 font-medium font-sans tabular-nums uppercase tracking-wider">
                  Agency Tooling Renewal
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                {selectedAlert.tool_name || selectedAlert.title}
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                Renews on {selectedAlert.next_renewal_date}
              </p>
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-tertiary)]">Subscription Cost:</span>
              <span className="font-sans tabular-nums font-semibold text-[var(--color-ink)]">
                {selectedAlert.currency || "INR"}{" "}
                {Number(selectedAlert.cost_amount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-tertiary)]">Allocation:</span>
              <span className="font-medium text-[var(--color-ink)]">
                {selectedAlert.default_pass_through ? "Client Pass-through" : "Agency Overhead"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] pt-1 border-t border-[var(--color-line)]">
              {selectedAlert.reason}
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
            >
              <span>Tool Infrastructure Catalog</span>
            </Link>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-secondary text-xs"
            >
              <span>Acknowledge Renewal</span>
            </button>
          </div>
        </>
      )}

      {/* FALLBACK FOR ANY OTHER OPERATIONAL ALERT */}
      {![
        "content_feedback",
        "content_item",
        "billing",
        "client_request",
        "invoice_draft",
        "tool_renewal",
      ].includes(selectedAlert.entity_type) && (
        <>
          <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                <span className="text-[11px] text-[var(--color-ink-secondary)] font-medium font-sans tabular-nums uppercase tracking-wider">
                  Operational Alert
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                {selectedAlert.title}
              </h2>
              {selectedAlert.waiting_on && (
                <p className="text-xs text-[var(--color-ink-tertiary)]">
                  Waiting on: {selectedAlert.waiting_on}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4">
            <p className="text-xs text-[var(--color-ink)] leading-relaxed select-text font-sans">
              {selectedAlert.reason || "Operational item requiring review."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
            >
              <span>Mark as Resolved</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
