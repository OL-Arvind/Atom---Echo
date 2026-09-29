"use client";

import React from "react";
import { WEEKDAY_NAMES } from "./types";
import { toIsoDate } from "./utils";

interface CalendarGridProps {
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  todayIso: string;
  minDate?: string;
  maxDate?: string;
  onSelectDate: (isoDate: string) => void;
}

export function CalendarGrid({
  viewYear,
  viewMonth,
  selectedDate,
  todayIso,
  minDate,
  maxDate,
  onSelectDate,
}: CalendarGridProps) {
  // Calendar math (Monday-based weeks: 0 = Mon, 6 = Sun)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  return (
    <>
      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
        {WEEKDAY_NAMES.map((d) => (
          <span
            key={d}
            className="text-[10px] font-sans tabular-nums font-medium text-[var(--color-ink-muted)] uppercase tracking-wider"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Previous month filler days */}
        {Array.from({ length: startOffset }).map((_, i) => {
          const dayNum = daysInPrevMonth - startOffset + i + 1;
          const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
          const prevYearVal = viewMonth === 0 ? viewYear - 1 : viewYear;
          const iso = toIsoDate(prevYearVal, prevMonthIdx + 1, dayNum);

          return (
            <button
              type="button"
              key={`prev-${i}`}
              onClick={() => onSelectDate(iso)}
              className="h-8 w-8 mx-auto text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]/40 rounded-[6px] hover:bg-[var(--color-base-subtle)] hover:text-[var(--color-ink-secondary)] transition-colors flex items-center justify-center cursor-pointer"
            >
              {dayNum}
            </button>
          );
        })}

        {/* Current month days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const iso = toIsoDate(viewYear, viewMonth + 1, dayNum);
          const isSelected = selectedDate === iso;
          const isToday = todayIso === iso;
          const isDisabled =
            Boolean(minDate && iso < minDate) ||
            Boolean(maxDate && iso > maxDate);

          return (
            <button
              type="button"
              key={`curr-${dayNum}`}
              disabled={isDisabled}
              onClick={() => onSelectDate(iso)}
              className={`h-8 w-8 mx-auto text-[11.5px] font-sans tabular-nums rounded-[6px] transition-all flex items-center justify-center relative ${
                isDisabled
                  ? "opacity-25 cursor-not-allowed text-[var(--color-ink-muted)]"
                  : "cursor-pointer active:scale-95"
              } ${
                isSelected
                  ? "bg-[var(--color-ink)] text-[var(--color-base)] font-semibold shadow-2xs"
                  : isToday
                  ? "border border-[var(--color-line-strong)] bg-[var(--color-base-subtle)] text-[var(--color-ink)] font-semibold"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)]"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </>
  );
}
