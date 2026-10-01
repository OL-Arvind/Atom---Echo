"use client";

import React from "react";
import { Plus } from "lucide-react";

interface QuickTaskInputProps {
  onOpenModal: () => void;
}

export function QuickTaskInput({ onOpenModal }: QuickTaskInputProps) {
  return (
    <div className="border-b border-[var(--color-line-subtle)] bg-[var(--color-surface)] shrink-0">
      <button
        type="button"
        onClick={onOpenModal}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0 group-hover:rotate-90 transition-transform duration-150" />
          <span className="font-sans text-[12px]">Add a quick task for today...</span>
        </div>
        <kbd className="hidden sm:inline-block text-[10px] font-mono text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)] border border-[var(--color-line-subtle)] px-1.5 py-0.5 rounded">
          N
        </kbd>
      </button>
    </div>
  );
}
