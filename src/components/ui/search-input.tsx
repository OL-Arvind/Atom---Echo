"use client";

import { Search, X } from "lucide-react";
import { type ChangeEvent } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  shortcut?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  shortcut,
  autoFocus = false,
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={14}
        strokeWidth={1.8}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-[var(--color-base-subtle)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] border border-[var(--color-line)] focus:border-[var(--color-line-strong)] rounded-[var(--radius-sm)] pl-9 pr-8 py-1.5 text-xs transition-colors outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-0.5 rounded-[var(--radius-xs)] cursor-pointer transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={12} strokeWidth={2} />
        </button>
      ) : shortcut ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans tabular-nums text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] text-[var(--color-ink-muted)] pointer-events-none">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
}
