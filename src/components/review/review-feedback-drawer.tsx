"use client";

import React from "react";
import { Send } from "lucide-react";
import { FEEDBACK_CHIPS } from "./types";

interface ReviewFeedbackDrawerProps {
  selectedChips: string[];
  commentText: string;
  isPending: boolean;
  onToggleChip: (chip: string) => void;
  onCommentChange: (text: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ReviewFeedbackDrawer({
  selectedChips,
  commentText,
  isPending,
  onToggleChip,
  onCommentChange,
  onCancel,
  onSubmit,
}: ReviewFeedbackDrawerProps) {
  const isSendDisabled = isPending || (selectedChips.length === 0 && !commentText.trim());

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-4 shadow-dialog space-y-3 animate-in">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--color-line-subtle)]">
        <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)]">
          Request Adjustments &amp; Sharpen
        </span>
        <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
          Editorial QA &amp; Writer
        </span>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block">
          Quick Direction Tags:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_CHIPS.map((chip) => {
            const isSelected = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onToggleChip(chip)}
                className={`rounded-[var(--radius-xs)] px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium"
                    : "bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-base-muted)]"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block">
          Founder Notes &amp; Direction:
        </span>
        <textarea
          value={commentText}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="What would you like sharpened? (e.g. stronger angle, tone nuance, specific story details)..."
          rows={3}
          className="input text-xs resize-y w-full"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1 py-2 text-xs cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSendDisabled}
          className="btn btn-primary flex-1 py-2 text-xs disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{isPending ? "Sending..." : "Send to Editorial Team"}</span>
        </button>
      </div>
    </div>
  );
}
