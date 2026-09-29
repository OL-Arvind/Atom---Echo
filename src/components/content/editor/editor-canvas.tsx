"use client";

import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { ContentDiffView } from "@/components/content/content-diff-view";
import type { ContentRevision } from "@/types/domain";
import { formatTriggerLabel, type StudioClientOption } from "./types";

export interface EditorCanvasProps {
  isNew: boolean;
  currentPostId: string | null;
  clientOptions: StudioClientOption[];
  selectedEngagementId: string;
  onClientSwitch: (newEngagementId: string) => void;
  pillars: string[];
  targetPillar: string;
  onTargetPillarChange: (pillar: string) => void;
  scheduledDate: string;
  onScheduledDateChange: (date: string) => void;
  authoringMode: "write" | "diff";
  onAuthoringModeChange: (mode: "write" | "diff") => void;
  latestVersionNumber: number;
  readingTimeMin: number;
  revisionList: ContentRevision[];
  bodyMarkdown: string;
  onBodyMarkdownChange: (text: string) => void;
  selectedOldRevision: ContentRevision | null;
  selectedNewRevision: ContentRevision | null;
  compareToTarget: "live" | number;
  onCompareToTargetChange: (target: "live" | number) => void;
  compareFromVersion: number;
  onCompareFromVersionChange: (ver: number) => void;
  onRestoreVersion: (ver: number) => void;
  isRestoringVersion: boolean;
  wordCount: number;
  charCount: number;
}

export function EditorCanvas({
  isNew,
  currentPostId,
  clientOptions,
  selectedEngagementId,
  onClientSwitch,
  pillars,
  targetPillar,
  onTargetPillarChange,
  scheduledDate,
  onScheduledDateChange,
  authoringMode,
  onAuthoringModeChange,
  latestVersionNumber,
  readingTimeMin,
  revisionList,
  bodyMarkdown,
  onBodyMarkdownChange,
  selectedOldRevision,
  selectedNewRevision,
  compareToTarget,
  onCompareToTargetChange,
  onCompareFromVersionChange,
  onRestoreVersion,
  isRestoringVersion,
  wordCount,
  charCount,
}: EditorCanvasProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xs overflow-hidden">
      {/* Band 1: Metadata Strip */}
      <div
        className={`p-4 sm:px-5 sm:py-4 border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/30 grid grid-cols-1 ${
          isNew && !currentPostId ? "sm:grid-cols-3" : "sm:grid-cols-2"
        } gap-3`}
      >
        {isNew && !currentPostId && (
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1 font-medium">
              Founder Account
            </label>
            <CustomSelect
              options={clientOptions.map((o) => ({
                value: o.engagementId,
                label: o.client.name,
                description: o.client.founder_name,
                brandName: o.client.website_url || o.client.name,
              }))}
              value={selectedEngagementId}
              onChange={onClientSwitch}
              placeholder="Select Founder Account"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1 font-medium">
            Editorial Pillar
          </label>
          <CustomSelect
            options={pillars.map((p) => ({ value: p, label: p }))}
            value={targetPillar}
            onChange={onTargetPillarChange}
            placeholder="Select Editorial Pillar"
          />
        </div>

        <div>
          <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1 font-medium">
            Target Release Slot (IST)
          </label>
          <CustomDatePicker
            value={scheduledDate}
            onChange={onScheduledDateChange}
            showTime
            presetMode="future"
            placeholder="Pick date & time"
            allowClear
          />
        </div>
      </div>

      {/* Band 2 Header: Writing Canvas vs Compare Changes Toggle */}
      <div className="px-4 py-2.5 sm:px-5 border-b border-[var(--color-line-subtle)] bg-[var(--color-surface)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            {authoringMode === "write"
              ? "Perspective Copy (First line becomes the hook & label)"
              : "Version Redline & Retention Comparison"}
          </label>
          {currentPostId && (
            <span className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums text-[var(--color-ink-muted)]">
              <span>·</span>
              <span>v{latestVersionNumber}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            {readingTimeMin} min read
          </span>

          {currentPostId && revisionList.length > 0 && (
            <div
              role="tablist"
              aria-label="Authoring mode"
              className="inline-flex items-center border border-[var(--color-line)] rounded-[var(--radius-sm)] bg-[var(--color-canvas)] p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={authoringMode === "write"}
                onClick={() => onAuthoringModeChange("write")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                  authoringMode === "write"
                    ? "bg-[var(--color-elevated)] text-[var(--color-ink)] font-semibold"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authoringMode === "diff"}
                onClick={() => onAuthoringModeChange("diff")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  authoringMode === "diff"
                    ? "bg-[var(--color-elevated)] text-[var(--color-ink)] font-semibold"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
                }`}
              >
                <span>Compare Changes</span>
                {revisionList.length > 1 && (
                  <span className="font-sans tabular-nums text-[10px] text-[var(--color-accent)]">
                    {revisionList.length}v
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Band 2 Body: Either Seamless Textarea OR Flush ContentDiffView */}
      {authoringMode === "write" ? (
        <div className="p-4 sm:p-5 bg-[var(--color-surface)]">
          <textarea
            value={bodyMarkdown}
            onChange={(e) => onBodyMarkdownChange(e.target.value)}
            placeholder="Start with a sharp, contrarian opening hook (under 140 characters to beat the mobile fold)...&#10;&#10;Then ground it in a real founder story, decision, or metric from the Vault on the right."
            rows={18}
            autoFocus={isNew}
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-0 font-sans text-[14px] leading-relaxed resize-y min-h-[390px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />
        </div>
      ) : (
        <ContentDiffView
          oldBody={selectedOldRevision?.body_markdown || ""}
          newBody={
            compareToTarget === "live"
              ? bodyMarkdown
              : selectedNewRevision?.body_markdown || bodyMarkdown
          }
          oldLabel={`v${selectedOldRevision?.version_number || 1}`}
          newLabel={
            compareToTarget === "live"
              ? `Live Draft (v${latestVersionNumber})`
              : `v${selectedNewRevision?.version_number || latestVersionNumber}`
          }
          feedbackNote={selectedOldRevision?.feedback_note || null}
          feedbackAuthor={selectedOldRevision?.author_name || null}
          onRestoreOld={
            selectedOldRevision
              ? () => onRestoreVersion(selectedOldRevision.version_number)
              : undefined
          }
          isRestoring={isRestoringVersion}
          headerSelectorSlot={
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans tabular-nums">
              <span className="text-[var(--color-ink-muted)] uppercase tracking-wider text-[10px]">
                Base:
              </span>
              <select
                value={selectedOldRevision?.version_number || 1}
                onChange={(e) => onCompareFromVersionChange(Number(e.target.value))}
                aria-label="Select base version"
                className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[4px] px-2 py-1 text-[11px] text-[var(--color-ink)] font-medium focus:outline-none focus:border-[var(--color-line-strong)]"
              >
                {revisionList.map((rev) => (
                  <option key={rev.id} value={rev.version_number}>
                    v{rev.version_number} · {formatTriggerLabel(rev.trigger_type)}
                  </option>
                ))}
              </select>

              <span className="text-[var(--color-ink-muted)]">→</span>

              <span className="text-[var(--color-ink-muted)] uppercase tracking-wider text-[10px]">
                Target:
              </span>
              <select
                value={String(compareToTarget)}
                onChange={(e) => {
                  const val = e.target.value;
                  onCompareToTargetChange(val === "live" ? "live" : Number(val));
                }}
                aria-label="Select target version"
                className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[4px] px-2 py-1 text-[11px] text-[var(--color-ink)] font-medium focus:outline-none focus:border-[var(--color-line-strong)]"
              >
                <option value="live">
                  Live Working Canvas (v{latestVersionNumber})
                </option>
                {revisionList.map((rev) => (
                  <option key={rev.id} value={rev.version_number}>
                    v{rev.version_number} · {formatTriggerLabel(rev.trigger_type)}
                  </option>
                ))}
              </select>
            </div>
          }
        />
      )}

      {/* Band 3: Telemetry Footer Bar */}
      <div className="px-4 py-3 sm:px-5 border-t border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/25 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 font-sans tabular-nums text-[11.5px] text-[var(--color-ink-secondary)]">
          <span>
            Words: <strong className="text-[var(--color-ink)]">{wordCount}</strong>
          </span>
          <span>
            Characters: <strong className="text-[var(--color-ink)]">{charCount}</strong> / 3,000
          </span>
        </div>

        {/* LinkedIn Character Range Meter */}
        <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums">
          <span className="text-[var(--color-ink-tertiary)]">Sweet spot: 1,200–1,800 chars</span>
          <div className="w-24 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
            <div
              className={`h-full transition-all ${
                charCount > 3000
                  ? "bg-[var(--color-danger)]"
                  : charCount >= 1200 && charCount <= 1800
                  ? "bg-[var(--color-ok)]"
                  : "bg-[var(--color-accent)]"
              }`}
              style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
