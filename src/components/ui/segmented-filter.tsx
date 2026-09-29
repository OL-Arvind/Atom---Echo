"use client";

import React from "react";
import { Search } from "lucide-react";

export interface SegmentedFilterOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  dotColor?: string;
}

interface SegmentedFilterProps<T extends string = string> {
  options: SegmentedFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  showZeroCounts?: boolean;
  className?: string;
}

/**
 * Reusable Segmented Filter & View Switcher Track
 * Standardized from the Client Conversations (`client-meetings-tab.tsx`) aesthetic:
 * - Subtle recessed track (`bg-[var(--color-base-subtle)] p-1 rounded-[8px] border`)
 * - Elevated active card pill (`bg-[var(--color-surface)] border-[var(--color-line-strong)] shadow-2xs`)
 * - Un-parenthesized tabular numeral counts (`10.5px`)
 */
export function SegmentedFilter<T extends string = string>({
  options,
  value,
  onChange,
  showZeroCounts = false,
  className = "",
}: SegmentedFilterProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-0.5 rounded-[8px] bg-[var(--color-base-subtle)] p-1 border border-[var(--color-line)] overflow-x-auto no-scrollbar max-w-full self-start ${className}`}
    >
      {options.map((tab) => {
        const active = value === tab.id;
        const shouldShowCount =
          typeof tab.count === "number" && (tab.count > 0 || showZeroCounts);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`px-2.5 py-1 text-xs rounded-[6px] transition-all cursor-pointer whitespace-nowrap font-sans tabular-nums flex items-center gap-1.5 active:scale-[0.98] ${
              active
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-medium shadow-2xs border border-[var(--color-line-strong)]"
                : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] border border-transparent"
            }`}
          >
            {tab.dotColor && (
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${tab.dotColor}`}
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {shouldShowCount && (
              <span
                className={`text-[10.5px] tabular-nums ${
                  active
                    ? "text-[var(--color-ink-secondary)]"
                    : "text-[var(--color-ink-muted)]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Companion 32px (`h-8`) search input designed to sit beside `SegmentedFilter`
 */
export function FilterSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "w-full md:w-72",
}: FilterSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 rounded-[8px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] !pl-9 !pr-8 text-xs font-sans text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-line-strong)] focus:bg-[var(--color-surface)] focus:outline-none transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
        >
          &times;
        </button>
      )}
    </div>
  );
}
