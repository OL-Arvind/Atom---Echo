"use client";

import Link from "next/link";
import {
  Smartphone,
  BookOpen,
  MessageSquare,
  History,
  Plus,
  Calendar,
} from "lucide-react";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import type { ContentRevision } from "@/types/domain";
import { formatTriggerLabel } from "./types";

export interface EditorDossierPaneProps {
  activeRightTab: "preview" | "context" | "meetings" | "versions";
  onTabChange: (tab: "preview" | "context" | "meetings" | "versions") => void;
  currentPostId: string | null;
  client: any;
  bodyMarkdown: string;
  status: string;
  context: any;
  knowledgeItems: any[];
  latestMeetings: any[];
  initialMeetingId?: string;
  revisionList: ContentRevision[];
  latestVersionNumber: number;
  authoringMode: "write" | "diff";
  selectedOldRevision: ContentRevision | null;
  onSelectCompareVersion: (ver: number) => void;
  onRestoreVersion: (ver: number) => void;
  isRestoringVersion: boolean;
  onSnapshotVersion: () => void;
  isSnapshotting: boolean;
  onInsertSnippet: (snippet: string, label?: string) => void;
}

export function EditorDossierPane({
  activeRightTab,
  onTabChange,
  currentPostId,
  client,
  bodyMarkdown,
  status,
  context,
  knowledgeItems,
  latestMeetings,
  initialMeetingId,
  revisionList,
  latestVersionNumber,
  authoringMode,
  selectedOldRevision,
  onSelectCompareVersion,
  onRestoreVersion,
  isRestoringVersion,
  onSnapshotVersion,
  isSnapshotting,
  onInsertSnippet,
}: EditorDossierPaneProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xs overflow-hidden">
      {/* Integrated Architectural Tab Header (No separate floating box above the card) */}
      <div className="px-4 sm:px-5 border-b border-[var(--color-line-subtle)] bg-[var(--color-surface)] flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onTabChange("preview")}
          className={`flex items-center gap-1.5 py-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeRightTab === "preview"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] font-medium"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>LinkedIn Fold</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("context")}
          className={`flex items-center gap-1.5 py-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeRightTab === "context"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] font-medium"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Story Vault</span>
          <span className="font-sans tabular-nums text-[11px] text-[var(--color-ink-muted)]">
            {knowledgeItems.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("meetings")}
          className={`flex items-center gap-1.5 py-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeRightTab === "meetings"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] font-medium"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Meetings</span>
          <span className="font-sans tabular-nums text-[11px] text-[var(--color-ink-muted)]">
            {latestMeetings.length}
          </span>
        </button>
        {currentPostId && (
          <button
            type="button"
            onClick={() => onTabChange("versions")}
            className={`flex items-center gap-1.5 py-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
              activeRightTab === "versions"
                ? "border-[var(--color-ink)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] font-medium"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Versions</span>
            <span className="font-sans tabular-nums text-[11px] text-[var(--color-ink-muted)]">
              v{latestVersionNumber}
            </span>
          </button>
        )}
      </div>

      {/* TAB A: LIVE LINKEDIN FEED SIMULATOR */}
      {activeRightTab === "preview" && (
        <div className="p-4 sm:p-5 space-y-4">
          <LinkedInFeedCard
            authorName={client?.founder_name || client?.name || "Founder"}
            authorTitle={`${client?.founder_title || "Founder & CEO"} at ${client?.name || "Company"}`}
            authorAvatarSeed={client?.founder_name || client?.name || "Founder"}
            linkedinUrl={client?.linkedin_url || undefined}
            bodyMarkdown={bodyMarkdown}
            statusLabel={
              status === "published"
                ? "Published"
                : status === "client_review"
                ? "Founder Review"
                : status === "internal_review"
                ? "Internal QA"
                : "Draft"
            }
            showModeToggle={true}
            initialMode="desktop"
            showDiagnostics={true}
          />

          {/* Hook Optimization Rule */}
          <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 text-xs space-y-1">
            <span className="font-sans tabular-nums uppercase text-[10px] text-[var(--color-ink-tertiary)] block font-medium">
              LinkedIn Fold Rule
            </span>
            <p className="text-[var(--color-ink-secondary)] text-[12px] leading-relaxed">
              LinkedIn clamps hooks at <strong>3 lines</strong> before requiring readers to tap &ldquo;...more&rdquo; (~140 chars on Mobile, ~210 chars on Desktop). Put the contrarian edge or hard metric in line 1.
            </p>
          </div>
        </div>
      )}

      {/* TAB B: CLIENT VOICE & STORY VAULT */}
      {activeRightTab === "context" && (
        <div>
          {/* Flush 2-Column Positioning & Tone Ledger */}
          {context && (
            <div className="border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/30">
              <div className="grid grid-cols-2 divide-x divide-[var(--color-line-subtle)] text-xs">
                <div className="px-4 py-3 sm:px-5">
                  <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase tracking-wider block mb-0.5 font-medium">
                    Target ICP
                  </span>
                  <p className="text-[var(--color-ink)] font-medium line-clamp-2">
                    {context.target_audience_icp || "Not specified"}
                  </p>
                </div>
                <div className="px-4 py-3 sm:px-5">
                  <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase tracking-wider block mb-0.5 font-medium">
                    Tone Archetype
                  </span>
                  <p className="text-[var(--color-ink)] font-medium line-clamp-2">
                    {context.tone_archetype || "Not specified"}
                  </p>
                </div>
              </div>
              {context.voice_guidelines && (
                <div className="px-4 py-2.5 sm:px-5 border-t border-[var(--color-line-subtle)]">
                  <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase tracking-wider block mb-0.5 font-medium">
                    Voice Rules
                  </span>
                  <p className="text-[var(--color-ink-secondary)] text-[11.5px] leading-relaxed line-clamp-2">
                    {context.voice_guidelines}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Subheader */}
          <div className="px-4 py-2.5 sm:px-5 flex items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-surface)]">
            <span className="font-sans tabular-nums uppercase tracking-wider text-[10px] text-[var(--color-ink-tertiary)] font-medium">
              Verified Stories, Frameworks &amp; Proof Points
            </span>
            <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
              1-Click Insert
            </span>
          </div>

          {knowledgeItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
              <p>No verified stories or proof points logged for {client?.name} yet.</p>
              {client?.id && (
                <Link
                  href={`/clients/${client.id}`}
                  className="btn btn-secondary text-xs inline-flex items-center gap-1 mt-1"
                >
                  <span>Log Conversation in Client Memory</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)] max-h-[520px] overflow-y-auto">
              {knowledgeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:px-5 space-y-2 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block mb-0.5">
                        {item.category?.replace(/_/g, " ")}
                      </span>
                      <h4 className="font-semibold text-xs text-[var(--color-ink)]">
                        {item.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInsertSnippet(item.content, "story")}
                      className="btn btn-secondary text-[11px] py-1 px-2.5 shrink-0 cursor-pointer inline-flex items-center gap-1"
                      title="Insert this story directly into your draft"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Insert</span>
                    </button>
                  </div>

                  <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                    {item.content}
                  </p>

                  {item.verified_metrics && Object.keys(item.verified_metrics).length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      {Object.entries(item.verified_metrics).map(([k, v]) => (
                        <span key={k}>
                          <strong className="font-medium text-[var(--color-ink-secondary)]">{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB C: RECENT MEETING INTEL & CALL TAKEAWAYS */}
      {activeRightTab === "meetings" && (
        <div>
          <div className="px-4 py-2.5 sm:px-5 flex items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/30">
            <span className="font-sans tabular-nums uppercase tracking-wider text-[10px] text-[var(--color-ink-tertiary)] font-medium">
              Founder Call Takeaways &amp; Transcripts
            </span>
            <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
              1-Click Insert
            </span>
          </div>

          {latestMeetings.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
              <p>No conversations logged for {client?.name} yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)] max-h-[520px] overflow-y-auto">
              {latestMeetings.map((meeting: any) => {
                const isHighlighted = initialMeetingId === meeting.id;
                return (
                  <div
                    key={meeting.id}
                    className={`p-4 sm:px-5 space-y-2.5 transition-colors ${
                      isHighlighted
                        ? "bg-[var(--color-base-subtle)]/60"
                        : "hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[var(--color-accent)]" />
                          <span>{formatDisplayDateTimeIST(meeting.meeting_date, true)}</span>
                        </span>
                        <h4 className="text-xs font-semibold text-[var(--color-ink)] mt-0.5">
                          {meeting.title}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onInsertSnippet(meeting.summary, "meeting summary")}
                        className="btn btn-secondary text-[11px] py-1 px-2.5 shrink-0 cursor-pointer inline-flex items-center gap-1"
                        title="Insert summary into draft"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Use Summary</span>
                      </button>
                    </div>

                    <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5">
                      {meeting.summary}
                    </p>

                    {meeting.key_decisions && meeting.key_decisions.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[9.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                          Key Stances / Takeaways (Click to insert):
                        </span>
                        <div className="space-y-1">
                          {meeting.key_decisions.map((d: string, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => onInsertSnippet(d, "takeaway")}
                              className="w-full text-left text-[11px] text-[var(--color-ink)] hover:text-[var(--color-accent-text)] flex items-start justify-between gap-2 py-1 px-2 rounded-[var(--radius-xs)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                            >
                              <span>• {d}</span>
                              <Plus className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB D: VERSION HISTORY & DIFF LEDGER */}
      {activeRightTab === "versions" && (
        <div>
          <div className="px-4 py-3 sm:px-5 flex items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-canvas)]">
            <div>
              <span className="font-sans tabular-nums uppercase tracking-wider text-[10px] text-[var(--color-ink-tertiary)] font-medium block">
                Editorial Version Timeline
              </span>
              <p className="text-[11.5px] text-[var(--color-ink-secondary)] mt-0.5">
                {revisionList.length} saved snapshot{revisionList.length === 1 ? "" : "s"} · Auto-recorded on stage transitions &amp; checkpoints
              </p>
            </div>
            <button
              type="button"
              onClick={onSnapshotVersion}
              disabled={isSnapshotting || bodyMarkdown.trim().length < 10}
              className="btn btn-secondary text-[11px] py-1 px-2.5 shrink-0 cursor-pointer"
            >
              {isSnapshotting ? "Saving..." : "Snapshot Draft"}
            </button>
          </div>

          {revisionList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
              No versions recorded yet. Save your draft to capture v1.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)] max-h-[540px] overflow-y-auto">
              {revisionList.map((rev, index) => {
                const isLatest = index === 0;
                const isSelectedInDiff =
                  authoringMode === "diff" &&
                  selectedOldRevision?.version_number === rev.version_number;
                const canRestore =
                  (rev.body_markdown || "").trim() !== (bodyMarkdown || "").trim();

                const dotColor =
                  rev.trigger_type === "founder_returned" ||
                  rev.trigger_type === "qa_returned"
                    ? "bg-[var(--color-warn)]"
                    : rev.trigger_type === "approved" ||
                      rev.trigger_type === "published"
                    ? "bg-[var(--color-ok)]"
                    : isLatest
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-ink-muted)]";

                return (
                  <div
                    key={rev.id || rev.version_number}
                    className={`p-4 sm:px-5 space-y-2 transition-colors ${
                      isSelectedInDiff
                        ? "bg-[var(--color-canvas)]"
                        : "hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    {/* Row Header: Version Number, Trigger Label & Timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                          <span className="font-semibold text-[var(--color-ink)]">
                            v{rev.version_number}
                          </span>
                          <span>·</span>
                          <span>{formatTriggerLabel(rev.trigger_type)}</span>
                        </div>
                        <p className="text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                          {rev.author_name || "Editorial Team"} ·{" "}
                          {formatDisplayDateTimeIST(rev.created_at, true)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectCompareVersion(rev.version_number)}
                          className={`btn text-[11px] py-1 px-2 cursor-pointer ${
                            isSelectedInDiff ? "btn-primary" : "btn-secondary"
                          }`}
                        >
                          {isSelectedInDiff ? "Comparing" : "Compare"}
                        </button>
                        {canRestore && (
                          <button
                            type="button"
                            onClick={() => onRestoreVersion(rev.version_number)}
                            disabled={isRestoringVersion}
                            className="btn btn-ghost border border-[var(--color-line)] text-[11px] py-1 px-2 cursor-pointer"
                            title={`Restore v${rev.version_number} into the writing canvas`}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Change Summary */}
                    {rev.change_summary && (
                      <p className="text-[11.5px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
                        {rev.change_summary}
                      </p>
                    )}

                    {/* Opening Hook Preview */}
                    <p className="text-xs text-[var(--color-ink-tertiary)] line-clamp-2 leading-relaxed">
                      {rev.body_markdown}
                    </p>

                    {/* Attached Founder / QA Feedback Note (Editorial Hairline Inset) */}
                    {rev.feedback_note && (
                      <div className="border-l-2 border-[var(--color-line-strong)] pl-3 py-0.5 mt-1">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] block">
                          Attached Review Note
                        </span>
                        <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
                          &ldquo;{rev.feedback_note}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
