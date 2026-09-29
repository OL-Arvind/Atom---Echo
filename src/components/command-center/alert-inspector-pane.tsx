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
  ShieldAlert,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { formatDisplayDateIST, formatDisplayDateTimeIST } from "@/lib/date-utils";
import { parseFeedbackComment } from "@/lib/feedback-utils";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import type {
  CommandCenterAlert,
  CommandCenterExpenseItem,
  InvoiceLineItem,
} from "@/types/domain";

interface EditorialContextRailProps {
  alert: CommandCenterAlert;
  bodyText: string;
  wordCount: number;
  charCount: number;
  readingTimeMin: number;
}

function EditorialContextRail({
  alert,
  bodyText,
  wordCount,
  charCount,
  readingTimeMin,
}: EditorialContextRailProps) {
  const tabooWords = alert.taboo_words || [];
  const tabooViolations = tabooWords.filter((w) =>
    bodyText.toLowerCase().includes(w.toLowerCase())
  );

  return (
    <div className="w-full xl:w-72 2xl:w-80 shrink-0 space-y-3.5">
      {/* Account & Content Strategy */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 space-y-3 shadow-card">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2.5">
          <span className="font-sans tabular-nums uppercase text-[10px] tracking-wider text-[var(--color-ink-muted)] font-semibold">
            Founder &amp; Account
          </span>
          <BrandLogo nameOrDomain={alert.client_name || "Client"} size={16} className="rounded-[2px]" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-semibold text-[var(--color-ink)]">
            {alert.founder_name}
          </div>
          <div className="text-[11.5px] text-[var(--color-ink-secondary)]">
            {alert.client_name}
          </div>
          {alert.linkedin_url && (
            <a
              href={alert.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[var(--color-accent-text)] hover:underline pt-0.5"
            >
              <LinkedInIcon size={12} color="brand" />
              <span>LinkedIn profile</span>
              <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
            </a>
          )}
        </div>

        <div className="pt-2 border-t border-[var(--color-line-subtle)] space-y-2">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Content Pillar
            </span>
            <span className="text-xs font-medium text-[var(--color-ink)]">
              {alert.target_pillar || "Founder Insights & Conviction"}
            </span>
          </div>

          {alert.scheduled_publish_date && (
            <div>
              <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
                Target Publish Slot
              </span>
              <span className="text-xs font-medium text-[var(--color-ink)] tabular-nums">
                {formatDisplayDateTimeIST(alert.scheduled_publish_date, true)}
              </span>
            </div>
          )}

          <div>
            <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Waiting On
            </span>
            <span className="text-xs font-medium text-[var(--color-ink)]">
              {alert.waiting_on}
            </span>
          </div>
        </div>
      </div>

      {/* Voice Guardrails & Taboo Linter */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 space-y-2.5 shadow-card">
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
          <span className="font-sans tabular-nums uppercase text-[10px] tracking-wider text-[var(--color-ink-muted)] font-semibold">
            Voice Guardrails
          </span>
          <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
        </div>

        {tabooWords.length > 0 ? (
          <div className="space-y-2 text-xs">
            <div className="text-[11px] text-[var(--color-ink-tertiary)]">
              Client taboo words list:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tabooWords.map((word) => {
                const isViolated = bodyText.toLowerCase().includes(word.toLowerCase());
                return (
                  <span
                    key={word}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-sans rounded-[var(--radius-xs)] border ${
                      isViolated
                        ? "border-[var(--color-danger-line)] text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] font-semibold"
                        : "border-[var(--color-line)] text-[var(--color-ink-secondary)] bg-[var(--color-base-subtle)]"
                    }`}
                  >
                    {isViolated && <span className="h-1 w-1 rounded-full bg-[var(--color-danger)]" />}
                    <span>{word}</span>
                  </span>
                );
              })}
            </div>
            {tabooViolations.length > 0 ? (
              <p className="text-[11px] text-[var(--color-danger-text)] pt-0.5 leading-snug">
                ⚠️ Warning: Draft contains taboo term: {tabooViolations.join(", ")}
              </p>
            ) : (
              <p className="text-[11px] text-[var(--color-ok-text)] pt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Zero taboo violations in draft</span>
              </p>
            )}
          </div>
        ) : (
          <div className="text-xs text-[var(--color-ink-secondary)] space-y-1.5">
            <p className="text-[11.5px] leading-relaxed text-[var(--color-ink-muted)]">
              {alert.voice_guidelines || "Authentic founder conviction. Avoid generic corporate buzzwords and filler phrases."}
            </p>
            <p className="text-[10.5px] text-[var(--color-ok-text)] flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>Voice parameters passing</span>
            </p>
          </div>
        )}
      </div>

      {/* Post Composition & Mechanics */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 space-y-2 shadow-card">
        <span className="font-sans tabular-nums uppercase text-[10px] tracking-wider text-[var(--color-ink-muted)] font-semibold block border-b border-[var(--color-line-subtle)] pb-2">
          Post Composition
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
          <div>
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">Words</span>
            <span className="font-semibold font-sans tabular-nums text-xs text-[var(--color-ink)]">{wordCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">Characters</span>
            <span className="font-semibold font-sans tabular-nums text-xs text-[var(--color-ink)]">{charCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">Read Time</span>
            <span className="font-semibold font-sans tabular-nums text-xs text-[var(--color-ink)]">{readingTimeMin} min</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">Fold Status</span>
            <span className="font-semibold font-sans tabular-nums text-[11px] text-[var(--color-accent-text)]">3-Line Cut</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* CASE 0: CLIENT CONTENT REVISION FEEDBACK */}
      {selectedAlert.entity_type === "content_feedback" && (() => {
        const { tags, note } = parseFeedbackComment(selectedAlert.comment);
        const bodyText = selectedAlert.body_markdown || "";
        const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).filter(Boolean).length : 0;
        const charCount = bodyText.length;
        const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
        const isInternalQaNote = selectedAlert.waiting_on?.includes("Internal QA") ?? false;

        return (
          <>
            {/* Sleek Executive Header */}
            <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-semibold text-[var(--color-ink)]">
                      {selectedAlert.founder_name}
                    </span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-amber-500 dark:text-amber-400 font-medium">
                      {isInternalQaNote ? "Internal QA revision requested" : "Revision requested by founder"}
                    </span>
                    {selectedAlert.target_pillar && (
                      <>
                        <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                        <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
                          {selectedAlert.target_pillar}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(selectedAlert.id)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reading Canvas & Executive Workbench */}
            <div className="flex-1 px-6 py-4 overflow-y-auto min-h-0">
              <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
                {/* Main Column: Editorial Hairline Note + LinkedIn Feed Simulator */}
                <div className="w-full xl:flex-1 min-w-0 max-w-2xl xl:max-w-[640px] 2xl:max-w-[700px] space-y-4">
                  {/* Revision Hairline Inset (Zero pastel background, strict BaseWorks standard) */}
                  <div className="border-l-2 border-amber-400 pl-3.5 py-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[10.5px] font-sans uppercase tracking-wider">
                      <span className="font-semibold text-amber-500 dark:text-amber-400">
                        {isInternalQaNote
                          ? "Internal QA Revision Note"
                          : `Founder Revision Note · ${selectedAlert.founder_name}`}
                      </span>
                      {selectedAlert.feedback_created_at && (
                        <span className="tabular-nums text-[var(--color-ink-muted)] font-normal">
                          {formatDisplayDateIST(selectedAlert.feedback_created_at)}
                        </span>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <p className="font-medium text-xs text-[var(--color-ink)]">
                        {tags.join(" · ")}
                      </p>
                    )}
                    {note && (
                      <p className="font-serif italic text-sm text-[var(--color-ink)] leading-relaxed select-text font-normal">
                        &ldquo;{note}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Authentic LinkedIn Feed Preview Card */}
                  <LinkedInFeedCard
                    authorName={selectedAlert.founder_name || "Founder"}
                    authorTitle={`Founder at ${selectedAlert.client_name || "Client"} · LinkedIn Perspective`}
                    authorAvatarSeed={selectedAlert.founder_name || "Founder"}
                    linkedinUrl={selectedAlert.linkedin_url || undefined}
                    bodyMarkdown={bodyText}
                    statusLabel={
                      selectedAlert.post_status === "internal_review"
                        ? "Internal Voice QA"
                        : selectedAlert.post_status === "client_review"
                        ? "Founder Review"
                        : "Working Draft"
                    }
                    showModeToggle={true}
                    initialMode="desktop"
                    showDiagnostics={true}
                    showActionButtons={false}
                  />
                </div>

                {/* Right Context Rail (Fills the wide desktop space!) */}
                <EditorialContextRail
                  alert={selectedAlert}
                  bodyText={bodyText}
                  wordCount={wordCount}
                  charCount={charCount}
                  readingTimeMin={readingTimeMin}
                />
              </div>
            </div>

            {/* Sleek Docked Action Toolbar */}
            <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAlert.post_id && (
                  <Link
                    href={`/content/${selectedAlert.post_id}`}
                    className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3 py-1.5 shadow-xs"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>Refine in Story Editor</span>
                  </Link>
                )}

                {!isInternalQaNote && (
                  <button
                    onClick={() => onOpenFeedbackWhatsAppPing(selectedAlert)}
                    className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                  >
                    <WhatsAppIcon size={13} className="text-[#25D366]" />
                    <span>Ack on WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={() => onResolveFeedback(selectedAlert)}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span>{isPending ? "Updating..." : "Mark as Resolved"}</span>
                </button>

                {selectedAlert.linkedin_url && (
                  <a
                    href={selectedAlert.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 btn btn-ghost text-xs px-2.5 py-1.5 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    title="Open founder's live LinkedIn profile in a new tab"
                  >
                    <LinkedInIcon size={14} color="brand" />
                    <span className="hidden xl:inline">LinkedIn Profile</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)] shrink-0">
                {selectedAlert.review_token && (
                  <Link
                    href={`/review/${selectedAlert.review_token}`}
                    target="_blank"
                    className="hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">Preview Portal</span>
                  </Link>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* CASE 1: CONTENT ITEM REVIEW (Internal QA, Overdue Draft, or Founder Sign-Off) */}
      {selectedAlert.entity_type === "content_item" && (() => {
        const bodyText = selectedAlert.body_markdown || "";
        const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).filter(Boolean).length : 0;
        const charCount = bodyText.length;
        const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
        const isInternalQa = selectedAlert.post_status === "internal_review";
        const isOverdueDraft = selectedAlert.post_status === "draft";
        const postTargetId = selectedAlert.post_id || selectedAlert.entity_id;

        return (
          <>
            {/* Sleek Executive Header */}
            <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        isOverdueDraft ? "bg-rose-400" : "bg-[var(--color-accent)]"
                      }`}
                    />
                    <span className="font-semibold text-[var(--color-ink)]">{selectedAlert.founder_name}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name || "Account"}</span>
                    <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                    <span
                      className={`font-medium ${
                        isOverdueDraft ? "text-rose-400" : "text-[var(--color-accent-text)]"
                      }`}
                    >
                      {isInternalQa
                        ? "Internal Voice & Hook QA"
                        : isOverdueDraft
                        ? "Draft Behind Schedule"
                        : "Awaiting Founder Sign-Off"}
                    </span>
                    {selectedAlert.target_pillar && (
                      <>
                        <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                        <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
                          {selectedAlert.target_pillar}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(selectedAlert.id)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reading Canvas & Executive Workbench */}
            <div className="flex-1 px-6 py-4 overflow-y-auto min-h-0">
              <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
                {/* Main Column: Authentic LinkedIn Feed Preview Card */}
                <div className="w-full xl:flex-1 min-w-0 max-w-2xl xl:max-w-[640px] 2xl:max-w-[700px] space-y-4">
                  <LinkedInFeedCard
                    authorName={selectedAlert.founder_name || "Founder"}
                    authorTitle={`Founder at ${selectedAlert.client_name || "Client"} · Thought Leadership`}
                    authorAvatarSeed={selectedAlert.founder_name || "Founder"}
                    linkedinUrl={selectedAlert.linkedin_url || undefined}
                    bodyMarkdown={bodyText}
                    statusLabel={
                      isInternalQa
                        ? "Internal Voice QA"
                        : isOverdueDraft
                        ? "Working Draft"
                        : "Founder Review"
                    }
                    showModeToggle={true}
                    initialMode="desktop"
                    showDiagnostics={true}
                    showActionButtons={false}
                  />
                </div>

                {/* Right Context Rail (Fills the wide desktop space!) */}
                <EditorialContextRail
                  alert={selectedAlert}
                  bodyText={bodyText}
                  wordCount={wordCount}
                  charCount={charCount}
                  readingTimeMin={readingTimeMin}
                />
              </div>
            </div>

            {/* Sleek Docked Action Toolbar */}
            <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {isOverdueDraft ? (
                  <>
                    {postTargetId && (
                      <Link
                        href={`/content/${postTargetId}`}
                        className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3 py-1.5 shadow-xs"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Finish Draft in Studio</span>
                      </Link>
                    )}
                    <button
                      onClick={() => onCopyReviewLink(selectedAlert)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                    >
                      <span>{isPending ? "Sending..." : "Send Directly to Founder ↗"}</span>
                    </button>
                  </>
                ) : isInternalQa ? (
                  <>
                    <button
                      onClick={() => onCopyReviewLink(selectedAlert)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3 py-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedToken === selectedAlert.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Dispatched & Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{isPending ? "Dispatching..." : "Approve QA · Send to Founder ↗"}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenWhatsAppPing(selectedAlert)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                    >
                      <WhatsAppIcon size={13} className="text-[#25D366]" />
                      <span>Approve & Send via WhatsApp</span>
                    </button>

                    {postTargetId && (
                      <Link
                        href={`/content/${postTargetId}`}
                        className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5"
                      >
                        <span>Open in Studio</span>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onCopyReviewLink(selectedAlert)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3 py-1.5 shadow-xs cursor-pointer"
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
                      className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
                    >
                      <WhatsAppIcon size={13} className="text-[#25D366]" />
                      <span>Ping on WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onQuickApprove(selectedAlert)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer font-medium"
                    >
                      <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      <span>{isPending ? "Approving..." : "Approve Post"}</span>
                    </button>

                    {postTargetId && (
                      <Link
                        href={`/content/${postTargetId}`}
                        className="inline-flex items-center justify-center gap-1.5 btn btn-ghost text-xs px-2.5 py-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                      >
                        <span>Open Studio</span>
                      </Link>
                    )}
                  </>
                )}

                {selectedAlert.linkedin_url && (
                  <a
                    href={selectedAlert.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 btn btn-ghost text-xs px-2.5 py-1.5 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    title="Open founder's live LinkedIn profile in a new tab"
                  >
                    <LinkedInIcon size={14} color="brand" />
                    <span className="hidden xl:inline">LinkedIn Profile</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--color-ink-muted)] shrink-0">
                {selectedAlert.review_token && (
                  <Link
                    href={`/review/${selectedAlert.review_token}`}
                    target="_blank"
                    className="hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span className="hidden sm:inline">Preview Client View</span>
                  </Link>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* CASE 2: UNBILLED TOOL EXPENSES */}
      {selectedAlert.entity_type === "billing" && (
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

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto min-h-0">
            {/* Executive Tool Ledger Card */}
            <div className="max-w-2xl card p-5 space-y-3.5">
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
      )}

      {/* CASE 3: CLIENT REQUEST / EMERGENCY HOLD */}
      {selectedAlert.entity_type === "client_request" && (
        <>
          {/* Sleek Header */}
          <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 text-[10.5px] font-sans tracking-widest text-rose-500 dark:text-rose-400 font-semibold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0" />
                  <span>Founder Direct Note &middot; Active Hold</span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
                  {selectedAlert.title}
                </h2>
              </div>

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto min-h-0">
            <div className="max-w-2xl card p-5 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-line)]">
                <span className="text-[10px] uppercase font-sans tracking-widest text-rose-500 dark:text-rose-400 font-medium">
                  Direct Founder Memo
                </span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  {selectedAlert.client_name || "Account"}
                </span>
              </div>
              <div className="border-l-2 border-rose-500/80 dark:border-rose-400/80 pl-3.5 py-1">
                <p className="font-serif italic text-[14px] text-[var(--color-ink)] leading-relaxed select-text font-normal">
                  &ldquo;{selectedAlert.reason}&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto flex items-center gap-2.5 shrink-0">
            {selectedAlert.client_id && (
              <Link
                href={`/clients/${selectedAlert.client_id}`}
                className="inline-flex items-center gap-1.5 btn btn-primary text-xs px-3 py-1.5 shadow-xs"
              >
                <span>Open Client 360</span>
              </Link>
            )}

            <button
              onClick={() => onDismissAlert(selectedAlert.id)}
              className="inline-flex items-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
            >
              <span>Resolve &amp; Resume</span>
            </button>
          </div>
        </>
      )}

      {/* CASE 4: DRAFT INVOICE AWAITING SIGN-OFF */}
      {selectedAlert.entity_type === "invoice_draft" && (
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

              <button
                onClick={() => onDismissAlert(selectedAlert.id)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto min-h-0">
            {/* Executive Invoice Document Card */}
            <div className="max-w-2xl card p-5 space-y-4">
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
      )}

      {/* CASE 5: TOOL SUBSCRIPTION RENEWAL */}
      {selectedAlert.entity_type === "tool_renewal" && (
        <>
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] shrink-0">
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
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto min-h-0">
            <div className="max-w-2xl card p-5 sm:p-6 space-y-4">
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

          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto flex items-center gap-2.5 shrink-0">
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
          <div className="p-6 sm:p-7 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] shrink-0">
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
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-7 space-y-6 overflow-y-auto min-h-0">
            <div className="border-l-2 border-[var(--color-line-strong)] pl-4.5 py-1.5 my-2">
              <p className="text-[13.5px] text-[var(--color-ink)] leading-relaxed select-text font-sans">
                {selectedAlert.reason || "Operational item requiring review."}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-xs mt-auto flex items-center gap-2.5 shrink-0">
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
