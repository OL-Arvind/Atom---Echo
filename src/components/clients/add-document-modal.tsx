"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  Link2,
  FileText,
  Check,
  ClipboardPaste,
  MessageSquare,
  Tag,
} from "lucide-react";
import { addClientDocumentAction } from "@/lib/actions/documents";
import type { ClientDocument, DocumentCategory, DocumentType } from "@/types/domain";

interface AddDocumentModalProps {
  clientId: string;
  clientName: string;
  defaultCategory?: DocumentCategory;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string, newDoc?: ClientDocument) => void;
}

const CATEGORIES: { value: DocumentCategory; label: string; dotColor: string }[] = [
  { value: "agreement", label: "Agreement / SOW", dotColor: "bg-emerald-400" },
  { value: "roadmap", label: "Roadmap", dotColor: "bg-blue-400" },
  { value: "proposal", label: "Proposal", dotColor: "bg-purple-400" },
  { value: "quotation", label: "Quotation", dotColor: "bg-amber-400" },
  { value: "asset", label: "Brand Asset", dotColor: "bg-cyan-400" },
  { value: "other", label: "Other", dotColor: "bg-gray-400" },
];

const QUICK_STATUS_TAGS = ["Signed", "Final", "v1.0", "Draft", "Active"];

function detectPlatformLabel(url: string): string | null {
  const lower = url.toLowerCase().trim();
  if (!lower) return null;
  if (lower.includes("docs.google.com/document")) return "Google Doc";
  if (lower.includes("docs.google.com/spreadsheets")) return "Google Sheet";
  if (lower.includes("docs.google.com/presentation")) return "Google Slides";
  if (lower.includes("drive.google.com")) return "Google Drive";
  if (lower.includes("notion.so") || lower.includes("notion.site")) return "Notion";
  if (lower.includes("figma.com")) return "Figma";
  if (lower.includes("pitch.com") || lower.includes("canva.com")) return "Deck";
  if (lower.includes("loom.com")) return "Loom";
  if (lower.endsWith(".pdf")) return "PDF";
  return "Web Link";
}

/**
 * Infers a clean document category from a filename, title, or URL.
 */
function inferCategoryFromText(text: string): DocumentCategory | null {
  const lower = text.toLowerCase();
  if (/\b(msa|sow|agreement|contract|nda|retainer|terms|signed)\b/.test(lower)) {
    return "agreement";
  }
  if (/\b(roadmap|strategy|plan|calendar|q[1-4]|blueprint)\b/.test(lower)) {
    return "roadmap";
  }
  if (/\b(proposal|pitch|deck|onboarding|scope)\b/.test(lower)) {
    return "proposal";
  }
  if (/\b(quote|quotation|pricing|estimate|commercial)\b/.test(lower)) {
    return "quotation";
  }
  if (/\b(brand|logo|asset|styleguide|identity|kit|font)\b/.test(lower)) {
    return "asset";
  }
  return null;
}

/**
 * Attempts to extract a readable document title from a pasted URL slug
 * (e.g., Notion or file links).
 */
function extractTitleFromUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === "edit" || last === "view" || last.length < 4) {
      return null;
    }
    // Strip trailing 32-char Notion hex IDs or hashes
    const withoutHash = last
      .replace(/-[a-f0-9]{32}$/i, "")
      .replace(/\.[a-z0-9]{2,5}$/i, "");
    if (/^[a-zA-Z0-9_-]{20,}$/.test(withoutHash) && !withoutHash.includes("-")) {
      // Looks like an opaque Google Doc ID
      return null;
    }
    const readable = decodeURIComponent(withoutHash)
      .replace(/[-_]+/g, " ")
      .trim();
    if (readable.length >= 3 && readable.length <= 80) {
      return readable;
    }
    return null;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AddDocumentModal({
  clientId,
  clientName,
  defaultCategory = "agreement",
  isOpen,
  onClose,
  onSuccess,
}: AddDocumentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Sync default category when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const docType: DocumentType = selectedFile ? "file" : "link";
  const detectedPlatform = !selectedFile ? detectPlatformLabel(fileUrl) : null;

  const applySelectedFile = (file: File | null) => {
    setSelectedFile(file);
    if (error) setError(null);
    if (file) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      if (!title.trim()) {
        setTitle(cleanName);
      }
      const inferred = inferCategoryFromText(cleanName);
      if (inferred) {
        setCategory(inferred);
      }
      if (/\bsigned\b/i.test(cleanName) && !version) {
        setVersion("Signed");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applySelectedFile(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      applySelectedFile(file);
    }
  };

  const handleUrlChange = (nextUrl: string) => {
    setFileUrl(nextUrl);
    if (error) setError(null);
    if (nextUrl.trim()) {
      const extractedTitle = extractTitleFromUrl(nextUrl);
      if (extractedTitle && !title.trim()) {
        setTitle(extractedTitle);
      }
      const inferred = inferCategoryFromText(extractedTitle || nextUrl);
      if (inferred) {
        setCategory(inferred);
      }
    }
  };

  const handlePasteClipboardUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text.trim());
      }
    } catch {
      urlInputRef.current?.focus();
    }
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    const inferred = inferCategoryFromText(nextTitle);
    if (inferred) {
      setCategory(inferred);
    }
  };

  const submitForm = () => {
    setError(null);

    if (!selectedFile && !fileUrl.trim()) {
      setError("Paste a document link or drop a file to continue.");
      urlInputRef.current?.focus();
      return;
    }

    const formData = new FormData();
    formData.append("client_id", clientId);
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("document_type", docType);
    formData.append("version", version.trim());
    formData.append("notes", notes.trim());

    if (selectedFile) {
      formData.append("file", selectedFile);
      formData.append("file_name", selectedFile.name);
    } else {
      formData.append("file_url", fileUrl.trim());
    }

    startTransition(async () => {
      const res = await addClientDocumentAction(formData);
      if (res.success) {
        const savedTitle = res.document?.title || title.trim() || "Document";
        setTitle("");
        setFileUrl("");
        setSelectedFile(null);
        setVersion("");
        setNotes("");
        setShowNoteInput(false);
        onSuccess?.(`Added "${savedTitle}" to ${clientName}.`, res.document);
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Could not save document.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitForm();
    }
  };

  const fileExt = selectedFile
    ? selectedFile.name.split(".").pop()?.toUpperCase() || "FILE"
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] shadow-dialog overflow-hidden animate-in"
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          {/* ─── 1. HEADER BAR ─── */}
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/40 px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[var(--color-ink-secondary)]">
                {clientName}
              </span>
              <span className="text-[var(--color-ink-muted)]">/</span>
              <span className="font-semibold text-[var(--color-ink)]">
                Add Document
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ─── 2. UNIFIED SMART SOURCE + METADATA CANVAS ─── */}
          <div className="p-5 space-y-4">
            {error && (
              <div className="border-l-2 border-[var(--color-danger-line)] pl-3 py-1 text-xs text-[var(--color-danger-text)]">
                {error}
              </div>
            )}

            {/* Hidden Native File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv"
              className="hidden"
            />

            {/* Unified Source Surface: Either Attached File Card OR Link + Dropzone */}
            {selectedFile ? (
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
                  onClick={() => applySelectedFile(null)}
                  className="btn btn-ghost text-[11px] py-1 px-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Smart Link Bar */}
                <div className="flex items-center gap-2 rounded-[9px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 focus-within:border-[var(--color-line-strong)] focus-within:bg-[var(--color-surface)] transition-all">
                  <Link2 className="h-4 w-4 text-[var(--color-ink-tertiary)] shrink-0" />
                  <input
                    ref={urlInputRef}
                    type="url"
                    autoFocus
                    value={fileUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
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
                      onClick={handlePasteClipboardUrl}
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
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
            )}

            {/* Borderless Document Title Input */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line-subtle)] pb-2 pt-1">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
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
                      onClick={() => setCategory(cat.value)}
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
                        onClick={() => setVersion(isSelected ? "" : tag)}
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
                    onClick={() => setShowNoteInput(true)}
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
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short note (e.g. Approved by Aravind on Sep 26 call)..."
                    className="w-full bg-transparent border-0 p-0 text-xs font-sans text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNotes("");
                      setShowNoteInput(false);
                    }}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                    title="Clear note"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── 3. GROUNDED FOOTER BAR ─── */}
          <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 px-5 py-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--color-ink-tertiary)]">
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 text-[10px] font-sans text-[var(--color-ink-secondary)] shadow-2xs">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 text-[10px] font-sans text-[var(--color-ink-secondary)] shadow-2xs">
                ↵
              </kbd>
              <span className="ml-0.5 text-[var(--color-ink-muted)]">to save</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary text-xs px-4"
              >
                {isPending ? "Saving..." : "Save Document"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
