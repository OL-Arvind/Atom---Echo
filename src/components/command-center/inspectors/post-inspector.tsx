"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import { ContentDiffView } from "@/components/content/content-diff-view";
import type { CommandCenterAlert } from "@/types/domain";

interface PostInspectorProps {
  selectedAlert: CommandCenterAlert;
  copiedToken: string | null;
  isPending: boolean;
  onCopyReviewLink: (alert: CommandCenterAlert) => void;
  onOpenWhatsAppPing: (alert: CommandCenterAlert) => void;
  onQuickApprove: (alert: CommandCenterAlert) => void;
}

export function PostInspector({
  selectedAlert,
  copiedToken,
  isPending,
  onCopyReviewLink,
  onOpenWhatsAppPing,
  onQuickApprove,
}: PostInspectorProps) {
  const [isShowingDiff, setIsShowingDiff] = useState(false);
  const hasPriorVersion = Boolean(selectedAlert.previous_body_markdown);

  const bodyText = selectedAlert.body_markdown || "";
  const isInternalQa = selectedAlert.post_status === "internal_review";
  const isOverdueDraft = selectedAlert.post_status === "draft";
  const postTargetId = selectedAlert.post_id || selectedAlert.entity_id;
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
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  isOverdueDraft ? "bg-rose-400" : "bg-[var(--color-accent)]"
                }`}
              />
              <span className="font-semibold text-[var(--color-ink)]">{selectedAlert.founder_name}</span>
              <span className="text-[var(--color-ink-ghost)]">&middot;</span>
              {selectedAlert.client_id ? (
                <Link
                  href={`/clients/${selectedAlert.client_id}`}
                  className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:underline underline-offset-2 transition-colors"
                >
                  {selectedAlert.client_name || "Account"}
                </Link>
              ) : (
                <span className="text-[var(--color-ink-tertiary)]">{selectedAlert.client_name || "Account"}</span>
              )}
              <span className="text-[var(--color-ink-ghost)]">&middot;</span>
              <span
                className={`font-medium ${
                  isOverdueDraft ? "text-rose-400" : "text-[var(--color-accent-text)]"
                }`}
              >
                {isInternalQa
                  ? "Needs Internal Review"
                  : isOverdueDraft
                  ? "Draft Overdue"
                  : "With Founder for Review"}
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
            <LinkedInFeedCard
              authorName={selectedAlert.founder_name || "Founder"}
              authorTitle={`Founder at ${selectedAlert.client_name || "Client"}${
                selectedAlert.target_pillar ? ` · ${selectedAlert.target_pillar}` : ""
              }`}
              authorAvatarSeed={selectedAlert.founder_name || "Founder"}
              linkedinUrl={selectedAlert.linkedin_url || undefined}
              bodyMarkdown={bodyText}
              statusLabel={
                isInternalQa
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
          {isInternalQa ? (
            <>
              <button
                onClick={() => onCopyReviewLink(selectedAlert)}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold px-3.5 py-1.5 shadow-xs cursor-pointer"
              >
                {copiedToken === selectedAlert.id ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Sent &amp; Link Copied</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{isPending ? "Sending..." : "Approve & Send to Founder ↗"}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenWhatsAppPing(selectedAlert)}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                <WhatsAppIcon size={13} className="text-[#25D366]" />
                <span>Send on WhatsApp</span>
              </button>

              {postTargetId && (
                <Link
                  href={`/content/${postTargetId}?from=command-center`}
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
                <span>Nudge on WhatsApp</span>
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
                  href={`/content/${postTargetId}?from=command-center`}
                  className="inline-flex items-center justify-center gap-1.5 btn btn-ghost text-xs px-2.5 py-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                >
                  <span>Open Studio</span>
                </Link>
              )}
            </>
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
}
