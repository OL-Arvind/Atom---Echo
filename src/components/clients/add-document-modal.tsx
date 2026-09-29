"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addClientDocumentAction } from "@/lib/actions/documents";
import type { ClientDocument, DocumentCategory, DocumentType } from "@/types/domain";
import {
  detectPlatformLabel,
  inferCategoryFromText,
  extractTitleFromUrl,
} from "./documents/document-modal-utils";
import { DocumentSourceInput } from "./documents/document-source-input";
import { DocumentMetadataFields } from "./documents/document-metadata-fields";

interface AddDocumentModalProps {
  clientId: string;
  clientName: string;
  defaultCategory?: DocumentCategory;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string, newDoc?: ClientDocument) => void;
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

            {/* Unified Source Surface */}
            <DocumentSourceInput
              selectedFile={selectedFile}
              fileUrl={fileUrl}
              fileExt={fileExt}
              detectedPlatform={detectedPlatform}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              urlInputRef={urlInputRef}
              onClearFile={() => applySelectedFile(null)}
              onUrlChange={handleUrlChange}
              onPasteClipboard={handlePasteClipboardUrl}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            />

            {/* Title, Category, Status Tags, Notes */}
            <DocumentMetadataFields
              title={title}
              category={category}
              version={version}
              notes={notes}
              showNoteInput={showNoteInput}
              onTitleChange={handleTitleChange}
              onCategoryChange={setCategory}
              onVersionChange={setVersion}
              onNotesChange={setNotes}
              onShowNoteInput={setShowNoteInput}
            />
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
