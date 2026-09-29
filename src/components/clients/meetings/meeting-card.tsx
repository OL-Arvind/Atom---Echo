"use client";

import React from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import type { ClientMeeting } from "@/types/domain";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import { getChannelMeta } from "./meeting-utils";
import { FormattedTranscriptView } from "./formatted-transcript-view";

interface MeetingCardProps {
  meeting: ClientMeeting;
  isTranscriptOpen: boolean;
  isCopied: boolean;
  onToggleTranscript: () => void;
  onCopyTranscript: () => void;
  onDraftPerspective: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MeetingCard({
  meeting,
  isTranscriptOpen,
  isCopied,
  onToggleTranscript,
  onCopyTranscript,
  onDraftPerspective,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const meta = getChannelMeta(meeting.channel);
  const decisions = meeting.key_decisions || [];
  const actions = meeting.action_items || [];
  const hasBullets = decisions.length > 0 || actions.length > 0;
  const transcriptLines = meeting.raw_transcript
    ? meeting.raw_transcript.split("\n").length
    : 0;

  return (
    <div className="group card p-5 space-y-3 transition-colors hover:border-[var(--color-line-strong)]">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-tertiary)] font-sans tabular-nums">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink)]">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
            <span>{meta.label}</span>
          </span>
          <span>·</span>
          <span>{formatDisplayDateTimeIST(meeting.meeting_date, true)}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDraftPerspective}
            className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
            title="Open Content Studio with this conversation pre-loaded"
          >
            <span>Draft Perspective</span>
            <ArrowUpRight className="h-3 w-3 opacity-60" />
          </button>

          {meeting.fathom_recording_url && (
            <a
              href={meeting.fathom_recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
            >
              <span>Watch Recording</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
            title="Edit conversation"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-base-subtle)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)] leading-snug">
        {meeting.title}
      </h3>

      {/* Summary / Notes */}
      <p className="text-[13px] text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-wrap max-w-[78ch]">
        {meeting.summary}
      </p>

      {/* Takeaways & Action Items */}
      {hasBullets && (
        <div className="pt-2 border-t border-[var(--color-line-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decisions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Key Takeaways
              </span>
              <ul className="space-y-1">
                {decisions.map((dec, idx) => (
                  <li
                    key={`dec-${idx}`}
                    className="flex items-start gap-2 text-xs text-[var(--color-ink-secondary)]"
                  >
                    <span className="text-[var(--color-ink-muted)] select-none mt-0.5">
                      •
                    </span>
                    <span className="leading-relaxed">{dec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Next Steps
              </span>
              <ul className="space-y-1">
                {actions.map((act, idx) => (
                  <li
                    key={`act-${idx}`}
                    className="flex items-start gap-2 text-xs text-[var(--color-ink)]"
                  >
                    <span className="text-[var(--color-ink-tertiary)] select-none mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bottom Footer: Transcript Toggle */}
      {meeting.raw_transcript && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-line-subtle)]">
          <button
            type="button"
            onClick={onToggleTranscript}
            className="flex items-center gap-1.5 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer font-sans tabular-nums"
          >
            {isTranscriptOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>
              {isTranscriptOpen
                ? "Hide transcript"
                : `Read transcript (${transcriptLines} lines)`}
            </span>
          </button>
        </div>
      )}

      {/* Expanded Formatted Transcript Reader */}
      {isTranscriptOpen && meeting.raw_transcript && (
        <div className="pt-2 space-y-2 animate-in">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
              Verbatim Transcript
            </span>
            <button
              type="button"
              onClick={onCopyTranscript}
              className="btn btn-ghost text-[11px] py-1 px-2 inline-flex items-center gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 text-[var(--color-ok-text)]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-[8px] bg-[var(--color-base-subtle)]/40 border border-[var(--color-line)] p-4">
            <FormattedTranscriptView text={meeting.raw_transcript} />
          </div>
        </div>
      )}
    </div>
  );
}
