"use client";

import { useState, useTransition, useEffect } from "react";
import { X } from "lucide-react";
import { createKnowledgeItemAction } from "@/lib/actions/meetings";
import type { KnowledgeCategory } from "@/types/domain";

interface AddKnowledgeModalProps {
  clientId: string;
  clientName?: string;
  sourceMeetingId?: string | null;
  sourceMeetingTitle?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: Array<{ value: KnowledgeCategory; label: string }> = [
  { value: "origin_story", label: "Origin Story" },
  { value: "metric_proof", label: "Metric / Proof" },
  { value: "case_study", label: "Customer Win" },
  { value: "contrarian_opinion", label: "Contrarian Take" },
  { value: "framework", label: "Framework" },
];

export function AddKnowledgeModal({
  clientId,
  clientName,
  sourceMeetingId,
  sourceMeetingTitle,
  isOpen,
  onClose,
  onSuccess,
}: AddKnowledgeModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<KnowledgeCategory>("origin_story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submitForm = () => {
    if (!title.trim() || !content.trim()) {
      setError("Enter a short headline and the story or metric details.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("client_id", clientId);
      formData.set("category", category);
      formData.set("title", title.trim());
      formData.set("content", content.trim());
      if (sourceMeetingId) {
        formData.set("source_meeting_id", sourceMeetingId);
      }

      const res = await createKnowledgeItemAction(formData);
      if (res.success) {
        setTitle("");
        setContent("");
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || "Could not save story.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitForm();
    }
  };

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
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Top Composer Header */}
          <div className="flex flex-col gap-3 border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/40 px-5 pt-4 pb-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                {clientName && (
                  <>
                    <span className="font-medium text-[var(--color-ink-secondary)]">
                      {clientName}
                    </span>
                    <span className="text-[var(--color-ink-muted)]">/</span>
                  </>
                )}
                <span className="font-semibold text-[var(--color-ink)]">
                  Save to Story Vault
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

            {sourceMeetingTitle && (
              <p className="text-[11px] text-[var(--color-ink-tertiary)] line-clamp-1 -mt-1">
                Source: {sourceMeetingTitle}
              </p>
            )}

            {/* Category Segmented Track */}
            <div className="flex flex-wrap gap-1 rounded-[8px] bg-[var(--color-base-subtle)] p-1 border border-[var(--color-line)]">
              {CATEGORIES.map((opt) => {
                const active = category === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setCategory(opt.value)}
                    className={`flex-1 py-1 px-2 rounded-[6px] text-[11.5px] font-sans transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-medium shadow-2xs border border-[var(--color-line-strong)]"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] border border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seamless Sheet Canvas */}
          <div className="px-5 pt-4 pb-4 space-y-3">
            {error && (
              <div className="border-l-2 border-[var(--color-danger-line)] pl-3 py-1 text-xs text-[var(--color-danger-text)]">
                {error}
              </div>
            )}

            {/* Borderless Title */}
            <div className="border-b border-[var(--color-line-subtle)] pb-2.5">
              <input
                type="text"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story headline (e.g. $0 to $1M ARR in 9 months)..."
                className="w-full bg-transparent border-0 p-0 text-[15px] font-semibold tracking-tight text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] placeholder:font-normal focus:outline-none focus:ring-0"
              />
            </div>

            {/* Borderless Story Content */}
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write or paste the exact story, metric, or quote from the founder..."
              className="w-full bg-transparent border-0 p-0 text-[13.5px] font-sans leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-0 resize-none"
            />
          </div>

          {/* Grounded Footer */}
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
                {isPending ? "Saving..." : "Save Story"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
