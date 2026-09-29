"use client";

import React from "react";
import { Link2, Upload, ClipboardPaste } from "lucide-react";
import { formatBytes } from "./document-modal-utils";

interface DocumentSourceInputProps {
  selectedFile: File | null;
  fileUrl: string;
  fileExt: string | null;
  detectedPlatform: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  urlInputRef: React.RefObject<HTMLInputElement | null>;
  onClearFile: () => void;
  onUrlChange: (url: string) => void;
  onPasteClipboard: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function DocumentSourceInput({
  selectedFile,
  fileUrl,
  fileExt,
  detectedPlatform,
  isDragging,
  fileInputRef,
  urlInputRef,
  onClearFile,
  onUrlChange,
  onPasteClipboard,
  onDragOver,
  onDragLeave,
  onDrop,
}: DocumentSourceInputProps) {
  if (selectedFile) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--color-line-strong)] bg-[var(--color-base-subtle)]/70 p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-[var(--color-line)] bg-[var(--color-surface)] text-[10px] font-sans font-bold tracking-wider text-[var(--color-ink)]">
            {fileExt}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
              {selectedFile.name}
            </p>
            <p className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              {formatBytes(selectedFile.size)} · Ready to upload
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearFile}
          className="btn btn-ghost text-[11px] py-1 px-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Smart Link Bar */}
      <div className="flex items-center gap-2 rounded-[9px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 focus-within:border-[var(--color-line-strong)] focus-within:bg-[var(--color-surface)] transition-all">
        <Link2 className="h-4 w-4 text-[var(--color-ink-tertiary)] shrink-0" />
        <input
          ref={urlInputRef}
          type="url"
          autoFocus
          value={fileUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Paste Google Doc, Notion, Figma, or PDF link..."
          className="w-full bg-transparent border-0 p-0 text-xs font-sans text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-0"
        />
        {detectedPlatform ? (
          <span className="shrink-0 rounded-[4px] bg-[var(--color-surface)] border border-[var(--color-line)] px-2 py-0.5 text-[10.5px] font-sans font-medium text-[var(--color-ink-secondary)]">
            {detectedPlatform}
          </span>
        ) : (
          <button
            type="button"
            onClick={onPasteClipboard}
            className="shrink-0 inline-flex items-center gap-1 rounded-[5px] bg-[var(--color-surface)] hover:bg-[var(--color-base-muted)] border border-[var(--color-line)] px-2 py-0.5 text-[11px] font-sans text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
          >
            <ClipboardPaste className="h-3 w-3" />
            <span>Paste</span>
          </button>
        )}
      </div>

      {/* Integrated File Dropzone (collapses cleanly once a URL is pasted) */}
      {!fileUrl.trim() && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-between rounded-[9px] border border-dashed px-3.5 py-2.5 transition-all cursor-pointer ${
            isDragging
              ? "border-[var(--color-ink)] bg-[var(--color-base-subtle)]"
              : "border-[var(--color-line-strong)] bg-[var(--color-base-subtle)]/35 hover:bg-[var(--color-base-subtle)]/70"
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-secondary)]">
            <Upload className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>Or drop a file here</span>
            <span className="text-[11px] text-[var(--color-ink-muted)] hidden sm:inline">
              (PDF, Word, Deck, Sheet)
            </span>
          </div>
          <span className="text-[11px] font-medium text-[var(--color-ink)] underline underline-offset-2">
            Browse file
          </span>
        </div>
      )}
    </div>
  );
}
