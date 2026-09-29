"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
} from "lucide-react";

export interface CustomDatePickerProps {
  name?: string;
  /**
   * Supports either "YYYY-MM-DD" (when showTime=false)
   * or "YYYY-MM-DDTHH:mm" (when showTime=true)
   */
  value?: string;
  defaultValue?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  allowClear?: boolean;
  /** Enable time picker (outputs YYYY-MM-DDTHH:mm) */
  showTime?: boolean;
  /** Visual trigger style: standard input or compact composer pill */
  variant?: "default" | "pill";
  /** Contextual quick presets: "future" (Today, Tomorrow, +1w) or "past" (Now/Today, Yesterday, 2d ago) */
  presetMode?: "future" | "past";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month1Based: number, day: number): string {
  return `${year}-${pad2(month1Based)}-${pad2(day)}`;
}

function parseValueParts(
  raw: string,
  showTime: boolean
): {
  datePart: string; // YYYY-MM-DD
  hours: number; // 0-23
  minutes: number; // 0-59
} {
  const now = new Date();
  if (!raw) {
    return {
      datePart: "",
      hours: now.getHours(),
      minutes: now.getMinutes(),
    };
  }

  // Handle YYYY-MM-DDTHH:mm or ISO string
  if (raw.includes("T")) {
    const [dPart, tPart] = raw.split("T");
    const [hh, mm] = (tPart || "").split(":").map((v) => parseInt(v, 10));
    return {
      datePart: dPart || "",
      hours: !isNaN(hh) ? hh : now.getHours(),
      minutes: !isNaN(mm) ? mm : now.getMinutes(),
    };
  }

  return {
    datePart: raw.slice(0, 10),
    hours: showTime ? now.getHours() : 9,
    minutes: showTime ? now.getMinutes() : 0,
  };
}

function formatTriggerLabel(
  raw: string,
  showTime: boolean,
  variant: "default" | "pill"
): string {
  if (!raw) return "";
  try {
    const { datePart, hours, minutes } = parseValueParts(raw, showTime);
    if (!datePart) return "";
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return raw;

    const d = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate();

    const dateLabel =
      variant === "pill" && isToday
        ? "Today"
        : variant === "pill" && isYesterday
        ? "Yesterday"
        : variant === "pill" && isTomorrow
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(d.getFullYear() !== now.getFullYear() || variant === "default"
              ? { year: "numeric" }
              : {}),
          });

    if (!showTime) return dateLabel;

    const timeLabel = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${dateLabel}, ${timeLabel}`;
  } catch {
    return raw;
  }
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
  showTime = false,
  variant = "default",
  presetMode = "future",
}: CustomDatePickerProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const currentValue = isControlled ? controlledValue || "" : internalValue;

  const { datePart: selectedDate, hours, minutes } = parseValueParts(
    currentValue,
    showTime
  );

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
    placement: "bottom" | "top";
  }>({ top: 0, left: 0, placement: "bottom" });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize viewing month & year based on selected date or today
  const baseDate = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(baseDate.getFullYear()) ? new Date().getFullYear() : baseDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(baseDate.getMonth()) ? new Date().getMonth() : baseDate.getMonth()
  );

  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [selectedDate]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72
    const estimatedHeight = showTime ? 380 : 310;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placement: "bottom" | "top" =
      spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "top" : "bottom";

    const top =
      placement === "bottom"
        ? rect.bottom + 6
        : Math.max(12, rect.top - estimatedHeight - 6);

    const left = Math.min(
      Math.max(12, rect.left),
      viewportWidth - popoverWidth - 12
    );

    setPopoverCoords({ top, left, placement });
  }, [showTime]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const emitValue = (nextDatePart: string, nextHours: number, nextMinutes: number) => {
    if (!nextDatePart) {
      if (!isControlled) setInternalValue("");
      onChange?.("");
      return;
    }
    const formatted = showTime
      ? `${nextDatePart}T${pad2(nextHours)}:${pad2(nextMinutes)}`
      : nextDatePart;
    if (!isControlled) setInternalValue(formatted);
    onChange?.(formatted);
  };

  const handleSelectDate = (isoDate: string) => {
    emitValue(isoDate, hours, minutes);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (nextHours: number, nextMinutes: number) => {
    const activeDate =
      selectedDate ||
      toIsoDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate()
      );
    emitValue(activeDate, nextHours, nextMinutes);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    emitValue("", hours, minutes);
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
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const todayIso = toIsoDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  const applyDayOffset = (daysOffset: number, setToCurrentTime = false) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const iso = toIsoDate(
      target.getFullYear(),
      target.getMonth() + 1,
      target.getDate()
    );
    const h = setToCurrentTime ? target.getHours() : hours;
    const m = setToCurrentTime ? target.getMinutes() : minutes;
    emitValue(iso, h, m);
    if (!showTime) {
      setIsOpen(false);
    }
  };

  // 12-hour display helpers for the time picker
  const isPM = hours >= 12;
  const displayHour12 = hours % 12 === 0 ? 12 : hours % 12;

  const stepHour = (delta: number) => {
    const next = (hours + delta + 24) % 24;
    handleTimeChange(next, minutes);
  };

  const stepMinute = (delta: number) => {
    const snapped = Math.round(minutes / 5) * 5;
    const next = (snapped + delta + 60) % 60;
    handleTimeChange(hours, next);
  };

  const toggleAmPm = () => {
    const next = isPM ? hours - 12 : hours + 12;
    handleTimeChange(next, minutes);
  };

  const displayLabel = formatTriggerLabel(currentValue, showTime, variant);

  return (
    <div className={`relative inline-block ${variant === "pill" ? "w-auto" : "w-full"} ${className}`}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      {variant === "pill" ? (
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-xs)] border text-[11.5px] font-sans tabular-nums transition-all cursor-pointer active:scale-[0.98] ${
            isOpen
              ? "bg-[var(--color-surface)] border-[var(--color-line-strong)] text-[var(--color-ink)] shadow-2xs"
              : "bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] border-[var(--color-line)] text-[var(--color-ink-secondary)]"
          }`}
        >
          <CalendarIcon className="h-3 w-3 text-[var(--color-ink-tertiary)] shrink-0" />
          <span>{displayLabel || placeholder}</span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((o) => !o)}
          className={`w-full h-9 rounded-[var(--radius-sm)] border bg-[var(--color-base-subtle)] px-3 text-xs text-left flex items-center justify-between transition-all focus:outline-none ${
            disabled
              ? "opacity-50 cursor-not-allowed border-[var(--color-line)]"
              : "cursor-pointer hover:border-[var(--color-line-strong)]"
          } ${
            isOpen
              ? "border-[var(--color-line-strong)] bg-[var(--color-surface)] shadow-2xs"
              : "border-[var(--color-line)]"
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <CalendarIcon className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
            {displayLabel ? (
              <span className="text-[var(--color-ink)] font-sans tabular-nums font-medium truncate">
                {displayLabel}
              </span>
            ) : (
              <span className="text-[var(--color-ink-muted)] truncate">
                {placeholder}
              </span>
            )}
          </div>

          {allowClear && currentValue && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-[var(--radius-xs)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors ml-1 shrink-0"
              title="Clear date"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      )}

      {/* Portal Calendar Popover */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${popoverCoords.top}px`,
              left: `${popoverCoords.left}px`,
              transformOrigin:
                popoverCoords.placement === "bottom" ? "top left" : "bottom left",
            }}
            className="z-[9999] w-72 rounded-[12px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-3.5 shadow-dialog text-[var(--color-ink)] animate-in select-none"
          >
            {/* 1. Month / Year Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-line-subtle)]">
              <span className="font-sans tabular-nums text-xs font-semibold tracking-tight text-[var(--color-ink)]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer active:scale-95"
                  title="Previous month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                  }}
                  className="px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-sans text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                  title="Jump to current month"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer active:scale-95"
                  title="Next month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Contextual Quick Presets */}
            <div className="flex items-center gap-1 py-2 border-b border-[var(--color-line-subtle)]">
              {presetMode === "past" ? (
                <>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(0, true)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    {showTime ? "Right Now" : "Today"}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(-1)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(-2)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    2d Ago
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(0)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(1)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(7)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDayOffset(30)}
                    className="flex-1 py-1 text-[11px] font-sans rounded-[5px] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  >
                    +30d
                  </button>
                </>
              )}
            </div>

            {/* 3. Weekday Header */}
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

            {/* 4. Days Grid */}
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
                    onClick={() => handleSelectDate(iso)}
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
                    onClick={() => handleSelectDate(iso)}
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

            {/* 5. Optional Time Selector */}
            {showTime && (
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
                          onClick={() => handleTimeChange(slot.h, slot.m)}
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
                    onClick={() => setIsOpen(false)}
                    className="btn btn-primary text-[11px] py-1 px-2.5 h-6 inline-flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
