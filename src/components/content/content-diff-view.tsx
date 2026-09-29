"use client";

import React, { useMemo, useState } from "react";
import { computeContentDiff, type DiffSegment } from "@/lib/revisions/diff";

export interface ContentDiffViewProps {
  oldBody: string;
  newBody: string;
  oldLabel?: string;
  newLabel?: string;
  feedbackNote?: string | null;
  feedbackAuthor?: string | null;
  compact?: boolean;
  defaultLens?: "redline" | "paragraphs" | "split";
  onRestoreOld?: () => void;
  isRestoring?: boolean;
  headerSelectorSlot?: React.ReactNode;
}

function renderDiffSegments(segments: DiffSegment[]) {
  return segments.map((seg, idx) => {
    if (seg.type === "intact") {
      return <span key={idx}>{seg.text}</span>;
    }
    if (seg.type === "added") {
      return (
        <ins
          key={idx}
          className="no-underline bg-[rgba(196,240,66,0.14)] text-[var(--color-accent)] border-b border-[rgba(196,240,66,0.45)] px-0.5 rounded-[2px]"
        >
          {seg.text}
        </ins>
      );
    }
    return (
      <del
        key={idx}
        className="line-through decoration-[rgba(239,68,68,0.65)] text-[var(--color-ink-muted)] opacity-65 px-0.5"
      >
        {seg.text}
      </del>
    );
  });
}

export function ContentDiffView({
  oldBody,
  newBody,
  oldLabel = "v1",
  newLabel = "Current",
  feedbackNote,
  feedbackAuthor,
  compact = false,
  defaultLens = "redline",
  onRestoreOld,
  isRestoring = false,
  headerSelectorSlot,
}: ContentDiffViewProps) {
  const [lens, setLens] = useState<"redline" | "paragraphs" | "split">(defaultLens);

  const diff = useMemo(
    () => computeContentDiff(oldBody || "", newBody || ""),
    [oldBody, newBody]
  );

  const isIdentical = diff.isIdentical;
  const intactParagraphs = diff.paragraphs.filter((p) => p.status === "intact").length;
  const editedParagraphs = diff.paragraphs.filter(
    (p) => p.status === "modified" || p.status === "added"
  ).length;
  const totalOldWords = diff.wordsIntact + diff.wordsRemoved;
  const totalNewWords = diff.wordsIntact + diff.wordsAdded;

  return (
    <div className="divide-y divide-[var(--color-line-subtle)] bg-[var(--color-surface)] text-[var(--color-ink)]">
      {/* Top Comparison Bar & Lens Switcher */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[var(--color-canvas)]">
        <div className="flex items-center gap-2.5 min-w-0">
          {headerSelectorSlot ? (
            headerSelectorSlot
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
              <span className="font-semibold text-[var(--color-ink)]">{oldLabel}</span>
              <span className="text-[var(--color-ink-muted)]">→</span>
              <span className="font-semibold text-[var(--color-ink)]">{newLabel}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Lens Selector */}
          <div
            role="tablist"
            aria-label="Diff view mode"
            className="inline-flex items-center border border-[var(--color-line)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={lens === "redline"}
              onClick={() => setLens("redline")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${
                lens === "redline"
                  ? "bg-[var(--color-elevated)] text-[var(--color-ink)] font-semibold"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
              }`}
            >
              Redline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={lens === "paragraphs"}
              onClick={() => setLens("paragraphs")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${
                lens === "paragraphs"
                  ? "bg-[var(--color-elevated)] text-[var(--color-ink)] font-semibold"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
              }`}
            >
              What Stayed Intact
            </button>
            {!compact && (
              <button
                type="button"
                role="tab"
                aria-selected={lens === "split"}
                onClick={() => setLens("split")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors ${
                  lens === "split"
                    ? "bg-[var(--color-elevated)] text-[var(--color-ink)] font-semibold"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
                }`}
              >
                Side-by-Side
              </button>
            )}
          </div>

          {onRestoreOld && !isIdentical && (
            <button
              type="button"
              onClick={onRestoreOld}
              disabled={isRestoring}
              className="btn btn-secondary h-7 px-2.5 text-[11px]"
            >
              {isRestoring ? "Restoring..." : `Restore ${oldLabel}`}
            </button>
          )}
        </div>
      </div>

      {/* Quantitative Retention & Change Ledger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--color-line-subtle)] bg-[var(--color-surface)]">
        <div className="px-4 py-2.5">
          <p className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
            Stayed Intact
          </p>
          <p className="text-[13px] font-semibold font-sans tabular-nums text-[var(--color-ink)] mt-0.5">
            {diff.intactPercent}%{" "}
            <span className="text-[11px] font-normal text-[var(--color-ink-secondary)]">
              ({diff.wordsIntact} words)
            </span>
          </p>
        </div>

        <div className="px-4 py-2.5">
          <p className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
            Word Delta
          </p>
          <p className="text-[13px] font-semibold font-sans tabular-nums mt-0.5 flex items-center gap-2">
            <span className="text-[var(--color-accent)]">+{diff.wordsAdded} added</span>
            <span className="text-[var(--color-ink-muted)]">·</span>
            <span className="text-[var(--color-ink-secondary)]">-{diff.wordsRemoved} cut</span>
          </p>
        </div>

        <div className="px-4 py-2.5">
          <p className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
            Opening Hook
          </p>
          <p className="text-[12px] font-medium font-sans text-[var(--color-ink)] mt-0.5 flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                diff.hookChanged ? "bg-[var(--color-accent)]" : "bg-[var(--color-ok)]"
              }`}
            />
            {diff.hookChanged ? "Hook sharpened" : "Hook kept intact"}
          </p>
        </div>

        <div className="px-4 py-2.5">
          <p className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
            Structure
          </p>
          <p className="text-[12px] font-medium font-sans tabular-nums text-[var(--color-ink-secondary)] mt-0.5">
            {intactParagraphs} intact · {editedParagraphs} edited
          </p>
        </div>
      </div>

      {/* Optional Triggering Feedback Note Context (Editorial Hairline Inset) */}
      {feedbackNote && (
        <div className="px-4 py-3 bg-[var(--color-canvas)]">
          <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-0.5">
            <p className="text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
              {feedbackAuthor ? `Revision note from ${feedbackAuthor}` : "Revision note addressed"}
            </p>
            <p className="text-[12.5px] text-[var(--color-ink-secondary)] leading-relaxed mt-0.5">
              &ldquo;{feedbackNote}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Diff Canvas Body */}
      {isIdentical ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[13px] font-medium text-[var(--color-ink)]">
            100% of this perspective is identical between {oldLabel} and {newLabel}.
          </p>
          <p className="text-[12px] text-[var(--color-ink-muted)] mt-1">
            No words were added or removed between these two snapshots.
          </p>
        </div>
      ) : lens === "redline" ? (
        <div className={compact ? "px-4 py-4" : "px-5 py-5"}>
          <div className="flex items-center justify-between gap-2 mb-3 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
            <span>{diff.humanSummary}</span>
            <span className="flex items-center gap-3 tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                Added in {newLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
                Removed from {oldLabel}
              </span>
            </span>
          </div>

          <div className="text-[14px] leading-[1.72] text-[var(--color-ink)] whitespace-pre-wrap font-sans">
            {renderDiffSegments(diff.segments)}
          </div>
        </div>
      ) : lens === "paragraphs" ? (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {diff.paragraphs.map((p, idx) => {
            const statusLabel =
              p.status === "intact"
                ? "STAYED INTACT · 100%"
                : p.status === "modified"
                ? `REFINED · ${p.intactPercent}% INTACT`
                : p.status === "added"
                ? `NEW PARAGRAPH IN ${newLabel.toUpperCase()}`
                : `REMOVED FROM ${oldLabel.toUpperCase()}`;

            const dotClass =
              p.status === "intact"
                ? "bg-[var(--color-ok)]"
                : p.status === "modified"
                ? "bg-[var(--color-accent)]"
                : p.status === "added"
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-danger)]";

            return (
              <div
                key={idx}
                className={`px-4 py-3.5 transition-colors ${
                  p.status === "intact" ? "bg-[var(--color-surface)]" : "bg-[var(--color-canvas)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums tracking-wider uppercase text-[var(--color-ink-secondary)]">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
                    {statusLabel}
                  </span>
                  <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                    {idx === 0 ? "Opening Hook" : `Block ${idx + 1}`}
                  </span>
                </div>

                <div
                  className={`text-[13.5px] leading-[1.65] whitespace-pre-wrap font-sans ${
                    p.status === "intact"
                      ? "text-[var(--color-ink-secondary)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  {renderDiffSegments(p.segments)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Side-by-Side Split View */
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-line-subtle)]">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--color-line-subtle)]">
              <span className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums tracking-wider uppercase text-[var(--color-ink-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
                Prior Snapshot ({oldLabel})
              </span>
              <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                {totalOldWords} words
              </span>
            </div>
            <div className="text-[13.5px] leading-[1.68] text-[var(--color-ink-secondary)] whitespace-pre-wrap font-sans">
              {oldBody}
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-[var(--color-canvas)]">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--color-line-subtle)]">
              <span className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums tracking-wider uppercase text-[var(--color-ink)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                Updated Perspective ({newLabel})
              </span>
              <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
                {totalNewWords} words
              </span>
            </div>
            <div className="text-[13.5px] leading-[1.68] text-[var(--color-ink)] whitespace-pre-wrap font-sans">
              {newBody}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
