"use client";

import { ShieldAlert } from "lucide-react";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

export interface EditorFeedbackBannerProps {
  showQaReturnInput: boolean;
  onCloseQaReturnInput: () => void;
  qaReturnNote: string;
  onQaReturnNoteChange: (val: string) => void;
  onReturnToDraftWithQaNote: () => void;
  isPending: boolean;
  flaggedWords: string[];
  onRemoveTabooWord: (word: string) => void;
  unresolvedFeedback: any[];
  hasRevisions: boolean;
  authoringMode: "write" | "diff";
  onToggleAuthoringMode: () => void;
  status: string;
  onStatusTransition: (newStatus: string) => void;
  resolvedFeedback: any[];
}

export function EditorFeedbackBanner({
  showQaReturnInput,
  onCloseQaReturnInput,
  qaReturnNote,
  onQaReturnNoteChange,
  onReturnToDraftWithQaNote,
  isPending,
  flaggedWords,
  onRemoveTabooWord,
  unresolvedFeedback,
  hasRevisions,
  authoringMode,
  onToggleAuthoringMode,
  status,
  onStatusTransition,
  resolvedFeedback,
}: EditorFeedbackBannerProps) {
  return (
    <div className="space-y-4">
      {/* Inline Internal QA Return Drawer (When Sudeesh clicks 'Return to Draft' in internal_review) */}
      {showQaReturnInput && (
        <div className="card p-4 border border-[var(--color-warn-line)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-ink)]">
              Return to Writer with Internal QA Note
            </span>
            <button
              type="button"
              onClick={onCloseQaReturnInput}
              className="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={qaReturnNote}
              onChange={(e) => onQaReturnNoteChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onReturnToDraftWithQaNote()}
              placeholder="e.g. Hook is too generic — anchor it in the Q3 latency incident from their Story Vault..."
              className="input text-xs flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={onReturnToDraftWithQaNote}
              disabled={isPending || !qaReturnNote.trim()}
              className="btn btn-primary text-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>Send Back to Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Taboo Words Linter (Only expands when a forbidden word is actually detected) */}
      {flaggedWords.length > 0 && (
        <div className="border-l-2 border-[var(--color-danger)] pl-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[var(--color-base-subtle)]/40">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[var(--color-danger-text)] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--color-danger-text)]">
                Taboo Buzzwords Flagged ({flaggedWords.length}) &middot;{" "}
                <span className="text-[var(--color-ink-secondary)] font-normal">
                  Click any term to strip it from the draft:
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {flaggedWords.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => onRemoveTabooWord(word)}
                    className="inline-flex items-center gap-1 font-sans tabular-nums text-[11px] text-[var(--color-danger-text)] border-b border-[var(--color-danger-line)] pb-0.5 hover:text-[var(--color-ink)] cursor-pointer"
                    title="Click to remove from draft"
                  >
                    <span>&ldquo;{word}&rdquo;</span>
                    <span>&times;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PINNED ACTIVE REVISION NOTES (Founder or Internal QA) — Right Above the Editor */}
      {unresolvedFeedback.length > 0 && (
        <div className="card p-4 space-y-3 border border-[var(--color-warn-line)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" />
              <span>
                {unresolvedFeedback[0].author_type === "operator"
                  ? `Internal QA Revision · ${unresolvedFeedback[0].author_name}`
                  : `Founder Revision Note · ${unresolvedFeedback[0].author_name}`}
              </span>
            </div>
            <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              {formatDisplayDateTimeIST(unresolvedFeedback[0].created_at, true)}
            </span>
          </div>

          <div className="space-y-2">
            {unresolvedFeedback.map((fb) => (
              <p
                key={fb.id}
                className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 text-xs text-[var(--color-ink)] leading-relaxed"
              >
                {fb.comment}
              </p>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-line-subtle)] text-[11px] text-[var(--color-ink-tertiary)]">
            <span>
              Revising and sending this post forward automatically resolves this note.
            </span>
            <div className="flex items-center gap-2">
              {hasRevisions && (
                <button
                  type="button"
                  onClick={onToggleAuthoringMode}
                  className="btn btn-secondary text-[11px] py-1 px-2.5 cursor-pointer shrink-0"
                >
                  {authoringMode === "diff" ? "Back to Writing" : "Compare Changes"}
                </button>
              )}
              {status === "draft" && (
                <button
                  type="button"
                  onClick={() =>
                    onStatusTransition(
                      unresolvedFeedback[0].author_type === "operator"
                        ? "internal_review"
                        : "client_review"
                    )
                  }
                  disabled={isPending}
                  className="btn btn-primary text-[11px] py-1 px-2.5 cursor-pointer shrink-0"
                >
                  <span>
                    {unresolvedFeedback[0].author_type === "operator"
                      ? "Re-submit to QA →"
                      : "Re-send to Founder ↗"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorResolvedFeedback({
  resolvedFeedback,
}: {
  resolvedFeedback: any[];
}) {
  if (resolvedFeedback.length === 0) return null;

  return (
    <div className="card p-4 space-y-2.5">
      <span className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
        Resolved Revision History
      </span>
      <div className="divide-y divide-[var(--color-line-subtle)]">
        {resolvedFeedback.map((fb) => (
          <div key={fb.id} className="py-2 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              <span>
                {fb.author_name} ({fb.author_type === "operator" ? "Internal QA" : "Founder"})
              </span>
              <span>{formatDisplayDateTimeIST(fb.created_at, true)}</span>
            </div>
            <p className="border-l-2 border-[var(--color-line)] pl-3 py-0.5 text-[var(--color-ink-secondary)] leading-relaxed">
              {fb.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
