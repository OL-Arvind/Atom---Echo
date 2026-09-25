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
  Sparkles,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { parseFeedbackComment } from "@/lib/feedback-utils";
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
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)] font-display">
            Editorial Desk is Clear
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 max-w-sm mx-auto leading-relaxed">
            No pending founder reviews, editorial revisions, or unbilled tooling right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* CASE 0: CLIENT CONTENT REVISION FEEDBACK */}
      {selectedAlert.entity_type === "content_feedback" && (() => {
        const { tags, note } = parseFeedbackComment(selectedAlert.comment);
        const bodyText = selectedAlert.body_markdown || "";
        const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).filter(Boolean).length : 0;
        const charCount = bodyText.length;
        const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

        return (
          <>
            {/* Header */}
            <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/60">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-semibold text-[var(--color-ink)]">
                      {selectedAlert.founder_name}
                    </span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-muted)]">
                      {selectedAlert.target_pillar || "Thought Leadership"}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)] leading-snug">
                    {selectedAlert.post_title}
                  </h2>

                  <div className="flex items-center gap-2 text-[11px] text-amber-500 dark:text-amber-400 font-sans">
                    <span>Revision requested by founder</span>
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(selectedAlert.id)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reading Canvas & Executive Workbench */}
            <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
              <div className="max-w-3xl space-y-6">
                {/* Founder Direction - Editorial Hairline Inset (Zero pill badges, zero tinted boxes) */}
                <div className="space-y-2">
                <div className="flex items-center justify-between text-[10.5px] font-sans tracking-widest uppercase text-[var(--color-ink-muted)]">
                  <span>Founder Direction &middot; {selectedAlert.founder_name}</span>
                  {selectedAlert.feedback_created_at && (
                    <span className="tabular-nums text-[var(--color-ink-muted)]">
                      {formatDisplayDateIST(selectedAlert.feedback_created_at)}
                    </span>
                  )}
                </div>

                <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 space-y-1">
                  {tags.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-sans text-[var(--color-ink)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="font-medium tracking-tight">
                        {tags.join(" · ")}
                      </span>
                    </div>
                  )}

                  {note && (
                    <p className="font-serif italic text-[14.5px] text-[var(--color-ink)] leading-relaxed select-text font-normal pt-0.5">
                      &ldquo;{note}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* LinkedIn Executive Preview Card Container (Forest Green Anchor from atomnecho.com) */}
              <div className="rounded-xl card-forest p-5 shadow-sm space-y-4">
                {/* Simulated Post Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-forest-border)]">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      seed={selectedAlert.founder_name || "Founder"}
                      size={36}
                      className="rounded-full"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-forest-ink)] font-display flex items-center gap-1.5">
                        <span>{selectedAlert.founder_name}</span>
                        <span className="text-[10.5px] font-sans text-[var(--color-forest-muted)] font-normal">&middot; 1st</span>
                      </div>
                      <div className="text-[11px] text-[var(--color-forest-muted)] truncate max-w-xs">
                        Founder at {selectedAlert.client_name} &middot; LinkedIn Perspective
                      </div>
                    </div>
                  </div>

                  <span className="text-[10.5px] uppercase font-sans tracking-wider text-[var(--color-forest-muted)] font-medium">
                    {selectedAlert.post_status === "internal_review"
                      ? "Internal Voice QA"
                      : selectedAlert.post_status === "client_review"
                      ? "Founder Review"
                      : "Working Draft"}
                  </span>
                </div>

                {/* Post Body Preview */}
                <div className="py-1">
                  {bodyText ? (
                    <p className="text-[14px] text-[var(--color-forest-ink)] leading-relaxed whitespace-pre-line select-text font-sans font-normal">
                      {bodyText}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-forest-muted)] italic">
                      No draft content written yet.
                    </p>
                  )}
                </div>

                {/* Post Metrics Footer */}
                <div className="pt-3 border-t border-[var(--color-forest-border)] flex items-center justify-between text-[11px] font-sans tabular-nums text-[var(--color-forest-muted)]">
                  <span>
                    {wordCount} {wordCount === 1 ? "word" : "words"} &middot; {charCount} characters
                  </span>
                  <span>{readingTimeMin} min read</span>
                </div>
              </div>
            </div>
          </div>

            {/* Docked Action Toolbar */}
            <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {selectedAlert.post_id && (
                  <Link
                    href={`/content/${selectedAlert.post_id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-4 py-2.5 shadow-sm"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Refine in Story Editor</span>
                  </Link>
                )}

                <button
                  onClick={() => onOpenFeedbackWhatsAppPing(selectedAlert)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2.5 cursor-pointer"
                >
                  <WhatsAppIcon size={14} className="text-[#25D366]" />
                  <span>Ack on WhatsApp</span>
                </button>

                <button
                  onClick={() => onResolveFeedback(selectedAlert)}
                  disabled={isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span>{isPending ? "Updating..." : "Mark as Resolved"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-line)] text-xs">
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
        );
      })()}

      {/* CASE 1: CONTENT ITEM REVIEW */}
      {selectedAlert.entity_type === "content_item" && (() => {
        const bodyText = selectedAlert.body_markdown || "";
        const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).filter(Boolean).length : 0;
        const charCount = bodyText.length;
        const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

        return (
          <>
            {/* Header */}
            <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/60">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                    <span className="font-semibold text-[var(--color-ink)]">{selectedAlert.founder_name}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name || "Account"}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-muted)]">{selectedAlert.target_pillar || "Thought Leadership"}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)] leading-snug">
                    {selectedAlert.post_title || selectedAlert.title}
                  </h2>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-accent)] font-sans">
                    <span>Awaiting Founder Sign-Off</span>
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(selectedAlert.id)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reading Canvas */}
            <div className="flex-1 p-6 sm:p-8 space-y-5 overflow-y-auto">
              <div className="max-w-3xl space-y-5">
                {/* LinkedIn Executive Preview Card Container */}
              <div className="rounded-xl card-forest p-5 shadow-sm space-y-4">
                {/* Author Info */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-forest-border)]">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      seed={selectedAlert.founder_name || "Founder"}
                      size={36}
                      className="rounded-full"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-forest-ink)] font-display flex items-center gap-1.5">
                        <span>{selectedAlert.founder_name}</span>
                        <span className="text-[10.5px] font-sans text-[var(--color-forest-muted)] font-normal">&middot; 1st</span>
                      </div>
                      <div className="text-[11px] text-[var(--color-forest-muted)] truncate max-w-xs">
                        Executive Profile &middot; Thought Leadership
                      </div>
                    </div>
                  </div>

                  <span className="text-[10.5px] uppercase font-sans tracking-wider text-[var(--color-forest-muted)] font-medium">
                    LinkedIn Architecture
                  </span>
                </div>

                {/* Draft Content */}
                <div className="py-1">
                  {bodyText ? (
                    <p className="text-[14px] text-[var(--color-forest-ink)] leading-relaxed whitespace-pre-line select-text font-sans font-normal">
                      {bodyText}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-forest-muted)] italic">
                      No draft content written yet.
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="pt-3 border-t border-[var(--color-forest-border)] flex items-center justify-between text-[11px] font-sans tabular-nums text-[var(--color-forest-muted)]">
                  <span>
                    {wordCount} {wordCount === 1 ? "word" : "words"} &middot; {charCount} characters
                  </span>
                  <span>{readingTimeMin} min read</span>
                </div>
              </div>
            </div>
          </div>

            {/* Docked Action Toolbar */}
            <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={() => onCopyReviewLink(selectedAlert)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-4 py-2.5 shadow-sm cursor-pointer"
                >
                  {copiedToken === selectedAlert.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Review Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onOpenWhatsAppPing(selectedAlert)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2.5 cursor-pointer"
                >
                  <WhatsAppIcon size={14} className="text-[#25D366]" />
                  <span>Ping on WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--color-line)] text-xs">
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
                  className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span>{isPending ? "Approving..." : "Approve Post"}</span>
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* CASE 2: UNBILLED TOOL EXPENSES */}
      {selectedAlert.entity_type === "billing" && (
        <>
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/60">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                  <span className="font-semibold text-[var(--color-ink)]">Client Pass-Through Tooling</span>
                  <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                  <span className="text-[var(--color-ink-muted)]">Zero Agency Markup</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)] leading-snug">
                  {selectedAlert.title}
                </h2>
                <div className="text-[11px] text-[var(--color-ink-tertiary)] font-sans">
                  {selectedAlert.reason}
                </div>
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 p-6 sm:p-7 space-y-6 overflow-y-auto">
            {/* Executive Tool Ledger Card */}
            <div className="max-w-2xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-baseline justify-between pb-3 border-b border-[var(--color-line)]">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                    Unbilled Tool Expenses
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
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
                    <div key={exp.id || i} className="py-3 flex items-center justify-between text-xs">
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
          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto space-y-4">
            <button
              onClick={() => onQuickDraftInvoice()}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold py-2.5 shadow-sm"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>{isPending ? "Drafting..." : "Draft Retainer & Tooling Invoice"}</span>
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-muted)]">
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
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/60">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10.5px] font-sans tracking-widest text-rose-500 dark:text-rose-400 font-semibold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0" />
                  <span>Founder Direct Note &middot; Active Hold</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">
                  {selectedAlert.title}
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  Founder: {selectedAlert.founder_name || "Client"}
                </p>
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="max-w-2xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-sans tracking-widest text-rose-500 dark:text-rose-400 font-medium">
                  Direct Founder Memo
                </span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  {selectedAlert.client_name || "Account"}
                </span>
              </div>
              <div className="border-l-2 border-rose-500/80 dark:border-rose-400/80 pl-4 py-1">
                <p className="font-serif italic text-[14.5px] text-[var(--color-ink)] leading-relaxed select-text font-normal">
                  &ldquo;{selectedAlert.reason}&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto flex items-center gap-2.5">
            {selectedAlert.client_id && (
              <Link
                href={`/clients/${selectedAlert.client_id}`}
                className="inline-flex items-center gap-1.5 btn btn-primary text-xs px-3.5 py-2"
              >
                <span>Open Client 360</span>
              </Link>
            )}

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2 cursor-pointer"
            >
              <span>Resolve &amp; Resume</span>
            </button>
          </div>
        </>
      )}

      {/* CASE 4: DRAFT INVOICE AWAITING SIGN-OFF */}
      {selectedAlert.entity_type === "invoice_draft" && (
        <>
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
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

                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)] leading-snug">
                  {selectedAlert.title}
                </h2>

                <div className="text-[11px] text-amber-500 font-sans font-medium">
                  Retainer draft awaiting sign-off
                </div>
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 p-6 sm:p-7 space-y-6 overflow-y-auto">
            {/* Executive Invoice Document Card */}
            <div className="max-w-2xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-card space-y-5">
              {/* Card Header: Invoice Metadata */}
              <div className="flex items-start justify-between pb-4 border-b border-[var(--color-line-subtle)]">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                    Invoice Amount Due
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                    ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[var(--color-ink-tertiary)] font-sans">
                    {selectedAlert.client_name} {selectedAlert.due_date ? `· Due ${formatDisplayDateIST(selectedAlert.due_date)}` : ""}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10.5px] uppercase font-sans tracking-wider text-[var(--color-ink-muted)]">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] pb-2 border-b border-[var(--color-line-subtle)]">
                  <span>Scope &amp; Tool Infrastructure</span>
                  <span>Amount</span>
                </div>

                <div className="divide-y divide-[var(--color-line-subtle)]">
                  {selectedAlert.line_items && selectedAlert.line_items.length > 0 ? (
                    selectedAlert.line_items.map((item: InvoiceLineItem, idx: number) => (
                      <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs">
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
                <div className="pt-4 border-t border-[var(--color-line-subtle)] space-y-1.5 text-xs font-sans">
                  <div className="flex items-center justify-between text-[var(--color-ink-secondary)]">
                    <span>Total Retainer &amp; Tooling</span>
                    <span className="font-semibold text-[var(--color-ink)] tabular-nums text-[14px]">
                      ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => onApproveInvoice(selectedAlert)}
                disabled={isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-4 py-2.5 shadow-sm"
              >
                <FileCheck className="h-3.5 w-3.5" />
                <span>{isPending ? "Approving..." : "Approve & Ready for Client"}</span>
              </button>

              <Link
                href={`/billing/invoices/${selectedAlert.entity_id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2.5"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                <span>View Printable Invoice</span>
              </Link>

              <button
                onClick={() => onOpenInvoiceWhatsAppPing(selectedAlert)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2.5"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Send WhatsApp Summary</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line-subtle)] text-xs text-[var(--color-ink-muted)]">
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
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)]">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10.5px] font-sans tracking-widest text-violet-500 font-semibold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  <span>Agency Tooling Renewal</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">
                  {selectedAlert.tool_name || selectedAlert.title}
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  Renews on {selectedAlert.next_renewal_date}
                </p>
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="max-w-2xl rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-baseline justify-between pb-3 border-b border-[var(--color-line-subtle)]">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                    Renewal Cost
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                    {selectedAlert.currency || "INR"}{" "}
                    {Number(selectedAlert.cost_amount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <span className="text-[10.5px] uppercase font-sans tracking-wider text-violet-500 font-medium">
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

          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto flex items-center gap-2.5">
            <Link
              href="/billing"
              className="inline-flex items-center gap-1.5 btn btn-primary text-xs px-3.5 py-2"
            >
              <span>Tool Infrastructure Catalog</span>
            </Link>

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-secondary text-xs px-3.5 py-2 cursor-pointer"
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
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)]">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10.5px] font-sans tracking-widest text-[var(--color-ink-muted)] font-semibold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                  <span>Operational Alert</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">
                  {selectedAlert.title}
                </h2>
                {selectedAlert.waiting_on && (
                  <p className="text-xs text-[var(--color-ink-secondary)]">
                    Waiting on: {selectedAlert.waiting_on}
                  </p>
                )}
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-lg hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-7 space-y-6 overflow-y-auto">
            <div className="border-l-2 border-[var(--color-line-strong)] pl-4.5 py-1.5 my-2">
              <p className="text-[13.5px] text-[var(--color-ink)] leading-relaxed select-text font-sans">
                {selectedAlert.reason || "Operational item requiring review."}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto flex items-center gap-2.5">
            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-primary text-xs px-3.5 py-2 cursor-pointer"
            >
              <span>Mark as Resolved</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
