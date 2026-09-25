"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface CustomDatePickerProps {
  name?: string;
  value?: string; // YYYY-MM-DD
  defaultValue?: string; // YYYY-MM-DD
  onChange?: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  className?: string;
  allowClear?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function toIsoString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function CustomDatePicker({
  name,
  value: controlledValue,
  defaultValue = "",
  onChange,
  placeholder = "Select date",
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
  allowClear = false,
}: CustomDatePickerProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const selectedDate = isControlled ? controlledValue || "" : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Initialize viewing month & year based on selected date or today
  const initDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initDate.getFullYear()) ? new Date().getFullYear() : initDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initDate.getMonth()) ? new Date().getMonth() : initDate.getMonth()
  );

  // Sync viewing month when selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getFullYear())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [selectedDate]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectDate = (isoStr: string) => {
    if (!isControlled) {
      setInternalValue(isoStr);
    }
    if (onChange) {
      onChange(isoStr);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) {
      setInternalValue("");
    }
    if (onChange) {
      onChange("");
    }
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calendar math (Monday-based weeks: 0 = Mon, 6 = Sun)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Convert JS Sunday-first (0=Sun) to Monday-first (0=Mon, 6=Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const todayIso = toIsoString(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Quick Preset actions
  const setQuickDate = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const iso = toIsoString(target.getFullYear(), target.getMonth() + 1, target.getDate());
    handleSelectDate(iso);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Hidden input for Native Form Submissions / FormData */}
      {name && <input type="hidden" name={name} value={selectedDate} required={required} />}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 text-xs text-left flex items-center justify-between transition-all focus:border-[var(--color-accent-dim)] focus:outline-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[var(--color-line-strong)]"
        } ${isOpen ? "border-[var(--color-accent-dim)] ring-1 ring-[var(--color-accent-dim)]" : ""}`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <CalendarIcon className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
          {selectedDate ? (
            <span className="text-[var(--color-ink)] font-sans tabular-nums font-medium truncate">
              {formatDisplayDate(selectedDate)}
            </span>
          ) : (
            <span className="text-[var(--color-ink-muted)] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {allowClear && selectedDate && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-[var(--radius-xs)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
              title="Clear date"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </div>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-72 rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-3.5 shadow-dialog text-[var(--color-ink)] animate-in">
          {/* Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-line-subtle)]">
            <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 py-1.5 border-b border-[var(--color-line-subtle)]">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="px-2 py-0.5 text-[11px] font-sans rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="px-2 py-0.5 text-[11px] font-sans rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(7)}
              className="px-2 py-0.5 text-[11px] font-sans rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(30)}
              className="px-2 py-0.5 text-[11px] font-sans rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              +30 Days
            </button>
          </div>

          {/* Weekday Labels Header */}
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
              const iso = toIsoString(prevYearVal, prevMonthIdx + 1, dayNum);

              return (
                <button
                  type="button"
                  key={`prev-${i}`}
                  onClick={() => handleSelectDate(iso)}
                  className="h-7 w-7 text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]/40 rounded-[var(--radius-xs)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink-secondary)] transition-colors flex items-center justify-center cursor-pointer"
                >
                  {dayNum}
                </button>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iso = toIsoString(viewYear, viewMonth + 1, dayNum);
              const isSelected = selectedDate === iso;
              const isToday = todayIso === iso;

              return (
                <button
                  type="button"
                  key={`curr-${dayNum}`}
                  onClick={() => handleSelectDate(iso)}
                  className={`h-7 w-7 text-[11px] font-sans tabular-nums rounded-[var(--radius-xs)] transition-all flex items-center justify-center cursor-pointer relative ${
                    isSelected
                      ? "bg-[var(--color-ink)] text-[var(--color-base)] font-bold shadow-xs"
                      : isToday
                      ? "border border-[var(--color-line-strong)] bg-[var(--color-base-subtle)] text-[var(--color-ink)] font-semibold"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {dayNum}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[var(--color-accent-dim)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
