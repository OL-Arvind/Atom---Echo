"use client";

import React from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import type { ReviewPostItem } from "./types";

interface ReviewEmptyStateProps {
  founderName: string;
  approvedArchive: ReviewPostItem[];
  onViewArchive: () => void;
}

export function ReviewEmptyState({
  founderName,
  approvedArchive,
  onViewArchive,
}: ReviewEmptyStateProps) {
  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 text-center shadow-dialog space-y-4 animate-in">
      <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)] font-medium text-base">
        <CheckCircle2 className="h-7 w-7 text-[var(--color-ok)]" />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
          Every Edge Approved
        </h1>
        <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
          Nothing waiting for your sign-off, <span className="font-medium text-[var(--color-ink)]">{founderName}</span>. You approve every word before it carries your name.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3.5 text-left text-xs space-y-2">
        <span className="font-sans tabular-nums text-[10px] uppercase text-[var(--color-ink-tertiary)] block font-medium">
          Current Status:
        </span>
        <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
          <span>Approved &amp; Locked Perspectives</span>
          <span className="font-sans tabular-nums font-medium text-[var(--color-ink)]">
            {approvedArchive.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
          <span>Next LinkedIn Release</span>
          <span className="font-sans tabular-nums text-[var(--color-ok)]">Active</span>
        </div>
      </div>

      {approvedArchive.length > 0 && (
        <button
          onClick={onViewArchive}
          className="btn btn-secondary w-full py-2.5 text-xs cursor-pointer"
        >
          <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
          <span>View Publishing Schedule ({approvedArchive.length})</span>
        </button>
      )}

      <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
        Atom &amp; Echo &middot; Personal Branding for the Unapologetically Ambitious
      </div>
    </div>
  );
}
