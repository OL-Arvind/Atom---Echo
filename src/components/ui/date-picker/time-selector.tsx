"use client";

import React from "react";
import { Clock, Check } from "lucide-react";
import { pad2 } from "./utils";

interface TimeSelectorProps {
  hours: number;
  minutes: number;
  onTimeChange: (nextHours: number, nextMinutes: number) => void;
  onClose: () => void;
}

export function TimeSelector({
  hours,
  minutes,
  onTimeChange,
  onClose,
}: TimeSelectorProps) {
  const isPM = hours >= 12;
  const displayHour12 = hours % 12 === 0 ? 12 : hours % 12;

  const stepHour = (delta: number) => {
    const next = (hours + delta + 24) % 24;
    onTimeChange(next, minutes);
  };

  const stepMinute = (delta: number) => {
    const snapped = Math.round(minutes / 5) * 5;
    const next = (snapped + delta + 60) % 60;
    onTimeChange(hours, next);
  };

  const toggleAmPm = () => {
    const next = isPM ? hours - 12 : hours + 12;
    onTimeChange(next, minutes);
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-[var(--color-line-subtle)] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-tertiary)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Time</span>
        </div>

        {/* Tactile Hour : Minute + AM/PM Control */}
        <div className="flex items-center gap-1">
          <div className="inline-flex items-center rounded-[6px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 font-sans tabular-nums text-xs">
            <button
              type="button"
              onClick={() => stepHour(-1)}
              className="px-1.5 py-0.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              title="Previous hour"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold text-[var(--color-ink)]">
              {pad2(displayHour12)}
            </span>
            <button
              type="button"
              onClick={() => stepHour(1)}
              className="px-1.5 py-0.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              title="Next hour"
            >
              +
            </button>
          </div>

          <span className="text-xs font-bold text-[var(--color-ink-muted)]">
            :
          </span>

          <div className="inline-flex items-center rounded-[6px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 font-sans tabular-nums text-xs">
            <button
              type="button"
              onClick={() => stepMinute(-5)}
              className="px-1.5 py-0.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              title="−5 minutes"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold text-[var(--color-ink)]">
              {pad2(minutes)}
            </span>
            <button
              type="button"
              onClick={() => stepMinute(5)}
              className="px-1.5 py-0.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              title="+5 minutes"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={toggleAmPm}
            className="h-7 px-2 rounded-[6px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[11px] font-sans font-semibold text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            {isPM ? "PM" : "AM"}
          </button>
        </div>
      </div>

      {/* Quick Time Slots + Done Button */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <div className="flex items-center gap-1">
          {[
            { label: "9 AM", h: 9, m: 0 },
            { label: "12 PM", h: 12, m: 0 },
            { label: "3 PM", h: 15, m: 0 },
            { label: "6 PM", h: 18, m: 0 },
          ].map((slot) => {
            const isActiveSlot = hours === slot.h && minutes === slot.m;
            return (
              <button
                key={slot.label}
                type="button"
                onClick={() => onTimeChange(slot.h, slot.m)}
                className={`px-2 py-0.5 rounded-[4px] text-[10.5px] font-sans tabular-nums transition-colors cursor-pointer ${
                  isActiveSlot
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium"
                    : "bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary text-[11px] py-1 px-2.5 h-6 inline-flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
