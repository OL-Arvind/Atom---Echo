"use client";

import React from "react";
import {
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  FileText,
  Link2,
} from "lucide-react";
import type { ClientDocument } from "@/types/domain";
import {
  formatBytes,
  formatShortDate,
  getCategoryMeta,
  getPlatformDisplay,
} from "./document-list-utils";

interface DocumentRowItemProps {
  doc: ClientDocument;
  isCopied: boolean;
  onCopyUrl: () => void;
  onDelete: () => void;
}

export function DocumentRowItem({
  doc,
  isCopied,
  onCopyUrl,
  onDelete,
}: DocumentRowItemProps) {
  const meta = getCategoryMeta(doc.category);
  const platformName = getPlatformDisplay(
    doc.external_platform,
    doc.document_type
  );
  const sizeLabel = formatBytes(doc.file_size_bytes);

  return (
    <div className="group px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Clean Icon Tile */}
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] group-hover:border-[var(--color-line-strong)] group-hover:text-[var(--color-ink)] transition-colors mt-0.5 sm:mt-0"
        >
          {doc.document_type === "file" ? (
            <FileText className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </a>

        {/* Title + Scannable Sub-line */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] hover:underline truncate"
            >
              {doc.title}
            </a>

            {doc.version && (
              <span className="inline-flex items-center gap-1 text-[11px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
                <span className="text-[var(--color-ink-muted)]">·</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {doc.version}
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
              <span>{meta.label}</span>
            </span>
            <span>·</span>
            <span>{platformName}</span>
            {sizeLabel && (
              <>
                <span>·</span>
                <span>{sizeLabel}</span>
              </>
            )}
            <span>·</span>
            <span>{formatShortDate(doc.created_at)}</span>
            {doc.notes && (
              <>
                <span>·</span>
                <span className="text-[var(--color-ink-secondary)] truncate max-w-[320px]">
                  {doc.notes}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onCopyUrl}
          className="btn btn-ghost text-xs p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          title="Copy document link"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-[var(--color-ok-text)]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-[11.5px] py-1 px-2.5 inline-flex items-center gap-1"
        >
          <span>Open</span>
          <ArrowUpRight className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
        </a>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-danger-text)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
          title="Remove document"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
