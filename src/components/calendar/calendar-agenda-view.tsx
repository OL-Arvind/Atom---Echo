"use client";

import React from "react";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import type { CalendarEvent } from "./types";

export interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarAgendaView({ events, onSelectEvent }: CalendarAgendaViewProps) {
  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-3">
        <h3 className="font-display text-base font-normal text-[var(--color-ink)]">
          Timeline Schedule
        </h3>
        <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
          {events.length} scheduled milestones
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
          <CalendarIcon className="h-8 w-8 mx-auto text-[var(--color-ink-muted)] opacity-60" />
          <p>No publishing releases or retainer milestones scheduled for this period.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {events
            .slice()
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-hover)] px-2 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-2 text-center min-w-[50px]">
                    <span className="text-[10px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block">
                      {ev.date.toLocaleString("en-US", { month: "short" })}
                    </span>
                    <span className="font-display text-lg font-bold text-[var(--color-ink)] block leading-tight">
                      {ev.date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-[var(--color-ink)]">
                        {ev.title}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ev.type === "content"
                              ? "bg-[var(--color-accent)]"
                              : ev.type === "billing"
                              ? "bg-[var(--color-ok)]"
                              : "bg-[var(--color-warn)]"
                          }`}
                        />
                        {ev.type === "billing" ? "Retainer" : ev.type === "content" ? "Release" : "Tool"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-secondary)]">
                      {ev.clientName} {ev.subtitle ? `· ${ev.subtitle}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                  <span>{ev.date.toLocaleDateString("en-IN")}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
