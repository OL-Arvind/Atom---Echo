"use client";

import React from "react";
import type { CalendarDaySlot, CalendarEvent } from "./types";

export interface CalendarMonthGridProps {
  calendarDays: CalendarDaySlot[];
  eventsByDate: Record<string, CalendarEvent[]>;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarMonthGrid({
  calendarDays,
  eventsByDate,
  onSelectEvent,
}: CalendarMonthGridProps) {
  return (
    <div className="card overflow-hidden border border-[var(--color-line)]">
      {/* Day Headers (Mon - Sun) */}
      <div className="grid grid-cols-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)] text-center text-[11px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] py-2.5">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
        <div>Sun</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[var(--color-line-subtle)] bg-[var(--color-base)]">
        {calendarDays.map((day, idx) => {
          const events = eventsByDate[day.dateString] || [];
          const hasEvents = events.length > 0;

          return (
            <div
              key={day.dateString + idx}
              className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors ${
                !day.isCurrentMonth
                  ? "bg-[var(--color-base-subtle)]/30 text-[var(--color-ink-muted)]"
                  : "hover:bg-[var(--color-surface-hover)]/30"
              } ${day.isToday ? "bg-[var(--color-accent-dim)]/5" : ""}`}
            >
              {/* Date Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center font-sans tabular-nums text-xs rounded-[4px] h-5 w-5 ${
                    day.isToday
                      ? "bg-[var(--color-accent)] text-black font-bold"
                      : day.isCurrentMonth
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-ink-tertiary)]"
                  }`}
                >
                  {day.date.getDate()}
                </span>
                {hasEvents && (
                  <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                    {events.length}
                  </span>
                )}
              </div>

              {/* Operational Chips */}
              <div className="mt-1.5 space-y-1 overflow-hidden">
                {events.slice(0, 3).map((ev) => {
                  const isContent = ev.type === "content";
                  const isBilling = ev.type === "billing";

                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="w-full text-left truncate px-2 py-1 text-[11px] font-sans transition-colors flex items-center gap-1.5 cursor-pointer rounded-[var(--radius-xs)] border border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-surface-hover)] group"
                      title={`${ev.title} (${ev.clientName})`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isContent
                            ? "var(--color-accent)"
                            : isBilling
                            ? "var(--color-ok)"
                            : "var(--color-warn)",
                        }}
                      />
                      <span className="truncate text-[var(--color-ink-secondary)] group-hover:text-[var(--color-ink)] font-normal">
                        {ev.title}
                      </span>
                    </button>
                  );
                })}

                {events.length > 3 && (
                  <span className="block text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] pl-1">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
