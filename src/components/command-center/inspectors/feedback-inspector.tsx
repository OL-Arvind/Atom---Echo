"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST, formatDisplayDateTimeIST } from "@/lib/date-utils";
import { parseFeedbackComment } from "@/lib/feedback-utils";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import { ContentDiffView } from "@/components/content/content-diff-view";
import type { CommandCenterAlert } from "@/types/domain";

interface FeedbackInspectorProps {
  selectedAlert: CommandCenterAlert;
  isPending: boolean;
  onOpenFeedbackWhatsAppPing: (alert: CommandCenterAlert) => void;
  onResolveFeedback: (alert: CommandCenterAlert) => void;
}

export function FeedbackInspector({
  selectedAlert,
  isPending,
  onOpenFeedbackWhatsAppPing,
  onResolveFeedback,
}: FeedbackInspectorProps) {
  const [isShowingDiff, setIsShowingDiff] = useState(false);
  const hasPriorVersion = Boolean(selectedAlert.previous_body_markdown);

  const { tags, note } = parseFeedbackComment(selectedAlert.comment);
  const bodyText = selectedAlert.body_markdown || "";
  const isInternalQaNote = selectedAlert.waiting_on?.includes("Internal QA") ?? false;
  const tabooWords = selectedAlert.taboo_words || [];
  const tabooViolations = tabooWords.filter((w) =>
    bodyText.toLowerCase().includes(w.toLowerCase())
  );

  return (
    <>
      {/* Sleek Executive Header */}
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-semibold text-[var(--color-ink)]">
                {selectedAlert.founder_name}
              </span>
              <span className="text-[var(--color-ink-ghost)]">&middot;</span>
              {selectedAlert.client_id ? (
                <Link
                  href={`/clients/${selectedAlert.client_id}`}
                  className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:underline underline-offset-2 transition-colors"
                >
                  {selectedAlert.client_name}
                </Link>
              ) : (
                <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name}</span>
              )}
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
              {selectedAlert.current_version_number && (
                <>
                  <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                  <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                    v{selectedAlert.current_version_number}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {hasPriorVersion && (
              <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 text-[10.5px] font-sans tabular-nums">
                <button
                  type="button"
                  onClick={() => setIsShowingDiff(false)}
                  className={`rounded-[var(--radius-xs)] px-2 py-0.5 transition-colors cursor-pointer ${
                    !isShowingDiff
                      ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                      : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
                  }`}
                >
                  LinkedIn Preview
                </button>
                <button
                  type="button"
                  onClick={() => setIsShowingDiff(true)}
                  className={`rounded-[var(--radius-xs)] px-2 py-0.5 transition-colors cursor-pointer ${
                    isShowingDiff
                      ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                      : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
                  }`}
                >
                  What Changed
                </button>
              </div>
            )}

            {selectedAlert.scheduled_publish_date && (
              <div className="flex items-center gap-1.5 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                <Calendar className="h-3 w-3 text-[var(--color-ink-muted)]" />
                <span>{formatDisplayDateTimeIST(selectedAlert.scheduled_publish_date, true)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reading Canvas & Executive Workbench */}
      <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 overflow-y-auto min-h-0">
        <div className="w-full max-w-3xl space-y-4">
          {/* Revision Hairline Inset */}
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

          {/* Loud Exception Only: Taboo Word Violation Hairline */}
          {tabooViolations.length > 0 && (
            <div className="border-l-2 border-[var(--color-danger)] pl-3.5 py-1 text-xs">
              <span className="font-medium text-[var(--color-danger-text)]">
                Flagged taboo terms in draft: {tabooViolations.join(", ")}
              </span>
            </div>
          )}

          {isShowingDiff && selectedAlert.previous_body_markdown ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
              <ContentDiffView
                oldBody={selectedAlert.previous_body_markdown}
                newBody={bodyText}
                oldLabel={`v${selectedAlert.previous_version_number || 1}`}
                newLabel={`v${selectedAlert.current_version_number || 2}`}
                compact={true}
              />
            </div>
          ) : (
            /* Authentic LinkedIn Feed Preview Card */
            <LinkedInFeedCard
              authorName={selectedAlert.founder_name || "Founder"}
              authorTitle={`Founder at ${selectedAlert.client_name || "Client"}${
                selectedAlert.target_pillar ? ` · ${selectedAlert.target_pillar}` : ""
              }`}
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
          )}
        </div>
      </div>

      {/* Sleek Docked Action Toolbar */}
      <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedAlert.post_id && (
            <Link
              href={`/content/${selectedAlert.post_id}?from=command-center`}
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
}
