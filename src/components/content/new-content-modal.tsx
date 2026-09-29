"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Feather } from "lucide-react";
import { createContentAction } from "@/lib/actions/content";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { parseDatetimeLocalIST } from "@/lib/date-utils";

const DEFAULT_PILLARS = [
  "Thought Leadership",
  "Founder Journey & Origin",
  "Engineering & Tech Contrarian",
  "Customer Case Study",
  "Hiring & Culture",
];

interface NewContentModalProps {
  engagements: {
    id: string;
    clientName: string;
    founderName: string;
    serviceType: string;
    tabooWords?: string[];
    corePillars?: string[];
  }[];
  isOpen: boolean;
  onClose: () => void;
}

export function NewContentModal({ engagements, isOpen, onClose }: NewContentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedEngId, setSelectedEngId] = useState(engagements[0]?.id || "");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [targetPillar, setTargetPillar] = useState("");
  const [status, setStatus] = useState("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const writeNowRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset pillar when client changes
  useEffect(() => {
    setTargetPillar("");
  }, [selectedEngId]);

  const currentEngagement = engagements.find((e) => e.id === selectedEngId) || engagements[0];
  const tabooWords = currentEngagement?.tabooWords || [];
  const pillars: string[] =
    currentEngagement?.corePillars && currentEngagement.corePillars.length > 0
      ? currentEngagement.corePillars
      : DEFAULT_PILLARS;

  // Real-time metrics
  const charCount = bodyMarkdown.length;
  const wordCount = bodyMarkdown.trim() ? bodyMarkdown.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Real-time Taboo Words Linter (word-boundary regex on body)
  const detectedTabooWords = useMemo(() => {
    if (!bodyMarkdown) return [];
    return tabooWords.filter((w) => {
      const reg = new RegExp(`\\b${w.toLowerCase()}\\b`, "i");
      return reg.test(bodyMarkdown);
    });
  }, [bodyMarkdown, tabooWords]);

  const handleRemoveTabooWord = (word: string) => {
    const reg = new RegExp(`\\b${word}\\b`, "gi");
    setBodyMarkdown((prev) => prev.replace(reg, "").replace(/\s{2,}/g, " "));
  };

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const writeNow = writeNowRef.current;
    writeNowRef.current = false; // reset immediately

    const formData = new FormData();
    formData.append("engagement_id", selectedEngId || engagements[0]?.id || "");
    formData.append("body_markdown", bodyMarkdown);
    formData.append("target_pillar", targetPillar || pillars[0] || "Thought Leadership");
    formData.append("status", status);
    if (scheduledDate) {
      formData.append("scheduled_publish_date", parseDatetimeLocalIST(scheduledDate));
    }

    startTransition(async () => {
      const res = await createContentAction(formData);
      if (res.success) {
        onClose();
        if (writeNow && res.post?.id) {
          router.push(`/content/${res.post.id}`);
        } else {
          router.refresh();
        }
      } else {
        setError(res.error || "Failed to create post.");
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-4 text-[var(--color-ink)] max-h-[90vh] overflow-y-auto animate-in">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <Feather className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Draft New Perspective
              </h2>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Shape a founder conviction into an authentic, high-impact LinkedIn perspective.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-2.5 text-xs text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Row 1: Client + Pillar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Client *
              </label>
              <CustomSelect
                options={engagements.map((eng) => ({
                  value: eng.id,
                  label: eng.clientName,
                  description: eng.founderName,
                  brandName: eng.clientName,
                }))}
                value={selectedEngId}
                onChange={setSelectedEngId}
                required
                placeholder="Select Client"
              />
            </div>

            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Editorial Pillar
              </label>
              <CustomSelect
                options={pillars.map((p) => ({ value: p, label: p }))}
                value={targetPillar}
                onChange={setTargetPillar}
                placeholder="Select Editorial Pillar"
              />
            </div>
          </div>

          {/* Row 2: Post Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)]">
                Perspective Draft *
              </label>
              <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                {readingTimeMin} min read
              </span>
            </div>

            <textarea
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              required
              rows={9}
              placeholder={"Hook goes here. Most CTOs think microservices scale best...\n\nThey are wrong. In 2024, our database crashed..."}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 text-xs leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans resize-y"
            />

            {/* LinkedIn metrics bar */}
            <div className="flex items-center justify-between gap-3 mt-2 text-[11px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
              <div className="flex items-center gap-3">
                <span>
                  Words: <strong className="text-[var(--color-ink)]">{wordCount}</strong>
                </span>
                <span>
                  Characters: <strong className="text-[var(--color-ink)]">{charCount}</strong> / 3,000
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10.5px]">
                <span className="text-[var(--color-ink-tertiary)]">Sweet spot: 1,200–1,800</span>
                <div className="w-20 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      charCount > 3000
                        ? "bg-[var(--color-danger)]"
                        : charCount >= 1200 && charCount <= 1800
                        ? "bg-[var(--color-ok)]"
                        : "bg-[var(--color-accent)]"
                    }`}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Taboo Words Linter */}
            {detectedTabooWords.length > 0 && (
              <div className="mt-2 border-l-2 border-[var(--color-warn-line)] pl-3 py-1.5 space-y-1.5 text-xs text-[var(--color-warn-text)]">
                <span className="font-medium text-[11.5px] block">
                  Words to avoid per founder voice rules:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedTabooWords.map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1 font-sans tabular-nums text-[11px] font-semibold text-[var(--color-warn-text)] border-b border-[var(--color-warn-line)] pb-0.5"
                    >
                      <span>&ldquo;{w}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTabooWord(w)}
                        className="text-xs hover:text-[var(--color-ink)] cursor-pointer leading-none"
                        title="Remove from text"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-[10.5px] text-[var(--color-warn-text)]/80">
                  Consider refining before sending to the founder desk.
                </p>
              </div>
            )}
          </div>

          {/* Row 4: Status + Release Slot */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Status
              </label>
              <CustomSelect
                options={[
                  { value: "draft", label: "Draft", statusDotColor: "bg-[var(--color-ink-muted)]" },
                  { value: "internal_review", label: "Internal Voice QA", statusDotColor: "bg-[var(--color-warn)]" },
                  { value: "client_review", label: "Ready for Founder Review", statusDotColor: "bg-[var(--color-accent)]" },
                  { value: "scheduled", label: "Approved & Scheduled", statusDotColor: "bg-[var(--color-ok)]" },
                  { value: "published", label: "Live on LinkedIn", statusDotColor: "bg-[var(--color-ok)]" },
                ]}
                value={status}
                onChange={setStatus}
              />
            </div>

            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Target Release Slot (Optional)
              </label>
              <CustomDatePicker
                value={scheduledDate}
                onChange={setScheduledDate}
                showTime
                presetMode="future"
                placeholder="Select release slot"
                allowClear
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost text-xs"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {/* Save to draft — stays in kanban */}
              <button
                type="submit"
                disabled={isPending || !bodyMarkdown.trim()}
                className="btn btn-secondary text-xs disabled:opacity-50"
              >
                <span>{isPending ? "Saving..." : "Save to Draft"}</span>
              </button>

              {/* Write Now — saves + immediately opens the full Perspective Editor */}
              <button
                type="button"
                disabled={isPending || !bodyMarkdown.trim()}
                onClick={() => {
                  writeNowRef.current = true;
                  formRef.current?.requestSubmit();
                }}
                className="btn btn-primary text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <span>{isPending ? "Opening..." : "Write Now"}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
