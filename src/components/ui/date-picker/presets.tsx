"use client";

import React from "react";

interface DatePickerPresetsProps {
  presetMode: "future" | "past";
  showTime: boolean;
  onApplyOffset: (daysOffset: number, setToCurrentTime?: boolean) => void;
}

export function DatePickerPresets({
  presetMode,
  showTime,
  onApplyOffset,
}: DatePickerPresetsProps) {
  return (
    <div className="flex items-center gap-1 py-2 border-b border-[var(--color-line-subtle)]">
      {presetMode === "past" ? (
        <>
          <button
            type="button"
            onClick={() => onApplyOffset(0, true)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            {showTime ? "Right Now" : "Today"}
          </button>
          <button
            type="button"
            onClick={() => onApplyOffset(-1)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => onApplyOffset(-2)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            2d Ago
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onApplyOffset(0)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onApplyOffset(1)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => onApplyOffset(7)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            +1 Week
          </button>
          <button
            type="button"
            onClick={() => onApplyOffset(30)}
            className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            +30d
          </button>
        </>
      )}
    </div>
  );
}
