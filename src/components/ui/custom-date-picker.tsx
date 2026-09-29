"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { CustomDatePickerProps } from "./date-picker/types";
import { MONTH_NAMES } from "./date-picker/types";
import {
  pad2,
  toIsoDate,
  parseValueParts,
  formatTriggerLabel,
} from "./date-picker/utils";
import { DatePickerPresets } from "./date-picker/presets";
import { CalendarGrid } from "./date-picker/calendar-grid";
import { TimeSelector } from "./date-picker/time-selector";

export type { CustomDatePickerProps };

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
            <DatePickerPresets
              presetMode={presetMode}
              showTime={showTime}
              onApplyOffset={applyDayOffset}
            />

            {/* 3 & 4. Weekday Header and Days Grid */}
            <CalendarGrid
              viewYear={viewYear}
              viewMonth={viewMonth}
              selectedDate={selectedDate}
              todayIso={todayIso}
              minDate={minDate}
              maxDate={maxDate}
              onSelectDate={handleSelectDate}
            />

            {/* 5. Optional Time Selector */}
            {showTime && (
              <TimeSelector
                hours={hours}
                minutes={minutes}
                onTimeChange={handleTimeChange}
                onClose={() => setIsOpen(false)}
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
