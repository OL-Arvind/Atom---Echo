"use client";

import React from "react";
import Link from "next/link";
import { Filter, ArrowRight, Columns3, LayoutGrid, List } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { SegmentedFilter } from "@/components/ui/segmented-filter";

export interface StudioMastheadProps {
  draftCount: number;
  reviewCount: number;
  scheduledCount: number;
  totalCount: number;
  clientOptions: { id: string; name: string; brandName?: string }[];
  selectedClientId: string;
  onSelectClient: (id: string) => void;
  viewMode: "matrix" | "kanban" | "list";
  onViewModeChange?: (mode: "matrix" | "kanban" | "list") => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

export function StudioMasthead({
  draftCount,
  reviewCount,
  scheduledCount,
  totalCount,
  clientOptions,
  selectedClientId,
  onSelectClient,
  viewMode,
  onViewModeChange,
  filter,
  onFilterChange,
}: StudioMastheadProps) {
  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* Band 1: 4-Column Pipeline Vitals Ledger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/35">
        <div className="px-5 py-4 lg:px-7">
          <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1">
            Capture &amp; Voice QA
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
              {draftCount}
            </span>
            <span className="text-xs font-sans text-[var(--color-ink-muted)]">in drafting</span>
          </div>
        </div>

        <div className="px-5 py-4 lg:px-7">
          <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1">
            Founder Desk Review
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-display text-[22px] font-semibold tabular-nums tracking-tight leading-none ${
                reviewCount > 0 ? "text-[var(--color-warn-text)]" : "text-[var(--color-ink)]"
              }`}
            >
              {reviewCount}
            </span>
            <span className="text-xs font-sans text-[var(--color-ink-muted)]">
              {reviewCount > 0 ? "pending 1-tap sign-off" : "desk is clear"}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 lg:px-7">
          <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1">
            Locked &amp; Scheduled
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-display text-[22px] font-semibold tabular-nums tracking-tight leading-none ${
                scheduledCount > 0 ? "text-[var(--color-ok-text)]" : "text-[var(--color-ink)]"
              }`}
            >
              {scheduledCount}
            </span>
            <span className="text-xs font-sans text-[var(--color-ink-muted)]">ready on timeline</span>
          </div>
        </div>

        <div className="px-5 py-4 lg:px-7">
          <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1">
            Pipeline Volume
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
              {totalCount}
            </span>
            <span className="text-xs font-sans text-[var(--color-ink-muted)]">total perspectives</span>
          </div>
        </div>
      </div>

      {/* Band 2: Integrated View & Filter Toolbar */}
      <div className="px-5 py-2.5 lg:px-7 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Integrated 3-Way Architectural View Switcher */}
          {onViewModeChange && (
            <div className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 text-xs font-sans">
              <button
                type="button"
                onClick={() => onViewModeChange("matrix")}
                className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium flex items-center gap-1.5 active:scale-[0.98] ${
                  viewMode === "matrix"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-2xs font-semibold"
                    : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span>Client Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("kanban")}
                className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium flex items-center gap-1.5 active:scale-[0.98] ${
                  viewMode === "kanban"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-2xs font-semibold"
                    : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium flex items-center gap-1.5 active:scale-[0.98] ${
                  viewMode === "list"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-2xs font-semibold"
                    : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-[var(--color-line-strong)]/20 hidden sm:block" />

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
            <div className="w-52">
              <CustomSelect
                size="sm"
                options={[
                  { value: "all", label: `All Clients (${clientOptions.length})` },
                  ...clientOptions.map((c) => ({
                    value: c.id,
                    label: c.name,
                    brandName: c.brandName || c.name,
                  })),
                ]}
                value={selectedClientId}
                onChange={onSelectClient}
              />
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <SegmentedFilter
            options={[
              { id: "all", label: "All", count: totalCount },
              { id: "draft", label: "Drafts", count: draftCount },
              { id: "review", label: "Founder Review", count: reviewCount },
              { id: "scheduled", label: "Scheduled", count: scheduledCount },
            ]}
            value={filter}
            onChange={onFilterChange}
          />
        ) : (
          <div className="text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)] flex items-center gap-2">
            <span>
              {viewMode === "matrix" ? "Grouped by Client Cadence" : "Editorial Flow"}
            </span>
            <span>·</span>
            <Link
              href="/calendar"
              className="hover:text-[var(--color-ink)] underline flex items-center gap-1"
            >
              <span>Publishing Schedule</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
