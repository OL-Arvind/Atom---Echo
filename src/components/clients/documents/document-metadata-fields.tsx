"use client";

import React from "react";
import { Tag, MessageSquare, X } from "lucide-react";
import type { DocumentCategory } from "@/types/domain";
import { CATEGORIES, QUICK_STATUS_TAGS } from "./document-modal-utils";

interface DocumentMetadataFieldsProps {
  title: string;
  category: DocumentCategory;
  version: string;
  notes: string;
  showNoteInput: boolean;
  onTitleChange: (title: string) => void;
  onCategoryChange: (category: DocumentCategory) => void;
  onVersionChange: (version: string) => void;
  onNotesChange: (notes: string) => void;
  onShowNoteInput: (show: boolean) => void;
}

export function DocumentMetadataFields({
  title,
  category,
  version,
  notes,
  showNoteInput,
  onTitleChange,
  onCategoryChange,
  onVersionChange,
  onNotesChange,
  onShowNoteInput,
}: DocumentMetadataFieldsProps) {
  return (
    <>
      {/* Borderless Document Title Input */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line-subtle)] pb-2 pt-1">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Document title (e.g. Master Services Agreement 2026)..."
          className="w-full bg-transparent border-0 p-0 text-[14.5px] font-semibold tracking-tight text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] placeholder:font-normal focus:outline-none focus:ring-0"
        />
        {!title && (
          <span className="text-[10.5px] font-sans text-[var(--color-ink-muted)] whitespace-nowrap select-none">
            Auto-titled if blank
          </span>
        )}
      </div>

      {/* Compact Single-Surface Category Pills */}
      <div className="space-y-1.5">
        <span className="text-[10.5px] font-sans text-[var(--color-ink-tertiary)] block">
          Type
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onCategoryChange(cat.value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-sans transition-all cursor-pointer active:scale-[0.98] ${
                  active
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium shadow-2xs"
                    : "bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] border border-[var(--color-line)]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-[var(--color-base)]" : cat.dotColor
                  }`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Property Bar: 1-Click Status Tags + Optional Note */}
      <div className="pt-1 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Status / Version Pills */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-[var(--color-ink-muted)] mr-1 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Status:</span>
            </span>
            {QUICK_STATUS_TAGS.map((tag) => {
              const isSelected = version === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onVersionChange(isSelected ? "" : tag)}
                  className={`px-2 py-0.5 rounded-[5px] text-[11px] font-sans transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--color-surface)] border border-[var(--color-line-strong)] text-[var(--color-ink)] font-medium shadow-2xs"
                      : "bg-[var(--color-base-subtle)]/70 hover:bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] border border-transparent"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Add Note Trigger */}
          {!showNoteInput && !notes && (
            <button
              type="button"
              onClick={() => onShowNoteInput(true)}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              <MessageSquare className="h-3 w-3" />
              <span>+ Add note</span>
            </button>
          )}
        </div>

        {/* Optional Inline Note Input */}
        {(showNoteInput || notes) && (
          <div className="flex items-center gap-2 rounded-[7px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-1.5 animate-in">
            <MessageSquare className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
            <input
              type="text"
              autoFocus
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Short note (e.g. Approved by Aravind on Sep 26 call)..."
              className="w-full bg-transparent border-0 p-0 text-xs font-sans text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onNotesChange("");
                onShowNoteInput(false);
              }}
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              title="Clear note"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
