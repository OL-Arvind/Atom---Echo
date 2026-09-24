"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X, Feather, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createContentAction } from "@/lib/actions/content";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

interface NewContentModalProps {
  engagements: {
    id: string;
    clientName: string;
    founderName: string;
    serviceType: string;
    tabooWords?: string[];
  }[];
  isOpen: boolean;
  onClose: () => void;
}

export function NewContentModal({ engagements, isOpen, onClose }: NewContentModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedEngId, setSelectedEngId] = useState(engagements[0]?.id || "");
  const [title, setTitle] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [targetPillar, setTargetPillar] = useState("Founder Insights");
  const [status, setStatus] = useState("draft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentEngagement = engagements.find((e) => e.id === selectedEngId) || engagements[0];
  const tabooWords = currentEngagement?.tabooWords || [];

  // Real-time Taboo Words Linter
  const detectedTabooWords = useMemo(() => {
    if (!bodyMarkdown) return [];
    const lower = bodyMarkdown.toLowerCase();
    return tabooWords.filter((w) => lower.includes(w.toLowerCase()));
  }, [bodyMarkdown, tabooWords]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("engagement_id", selectedEngId || engagements[0]?.id || "");
    formData.append("title", title);
    formData.append("body_markdown", bodyMarkdown);
    formData.append("target_pillar", targetPillar);
    formData.append("status", status);
    if (scheduledDate) {
      formData.append("scheduled_publish_date", scheduledDate);
    }

    startTransition(async () => {
      const res = await createContentAction(formData);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to create post.");
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-4 text-[var(--color-ink)] max-h-[90vh] overflow-y-auto animate-in">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <Feather className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Create New Post
              </h2>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Draft a LinkedIn post matching the founder&apos;s voice and avoided words.
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
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
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Content Topic / Pillar
              </label>
              <input
                value={targetPillar}
                onChange={(e) => setTargetPillar(e.target.value)}
                placeholder="e.g. Founder Journey, Lessons Learned"
                className="input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Post Title / Topic Hook *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Why most B2B outbound fails in month 2"
              className="input text-xs font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)]">
                Post Copy *
              </label>
              <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                {bodyMarkdown.length} characters
              </span>
            </div>

            <textarea
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              required
              rows={8}
              placeholder="Write the post content here..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 text-xs leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans resize-y"
            />

            {/* Live Words to Avoid Warning */}
            {detectedTabooWords.length > 0 && (
              <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-warn-line)] bg-[var(--color-warn-bg)] p-3 flex items-start gap-2.5 text-xs text-[var(--color-warn-text)]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-medium block">Words to Avoid Detected:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedTabooWords.map((w) => (
                      <span
                        key={w}
                        className="rounded-[var(--radius-xs)] bg-[var(--color-base)] border border-[var(--color-warn-line)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--color-warn-text)]"
                      >
                        &ldquo;{w}&rdquo;
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--color-warn-text)]/80 pt-0.5">
                    Consider replacing these terms before sharing with the client.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Status
              </label>
              <CustomSelect
                options={[
                  { value: "draft", label: "Draft", statusDotColor: "bg-[var(--color-ink-muted)]" },
                  { value: "internal_review", label: "Internal Review", statusDotColor: "bg-[var(--color-warn)]" },
                  { value: "client_review", label: "Ready for Client Review", statusDotColor: "bg-[var(--color-accent)]" },
                  { value: "scheduled", label: "Approved / Scheduled", statusDotColor: "bg-[var(--color-ok)]" },
                  { value: "published", label: "Published Live", statusDotColor: "bg-[var(--color-ok)]" },
                ]}
                value={status}
                onChange={setStatus}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Scheduled Date (Optional)
              </label>
              <CustomDatePicker
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Pick publication date"
                allowClear
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim() || !bodyMarkdown.trim()}
              className="btn btn-primary text-xs disabled:opacity-50"
            >
              <span>{isPending ? "Saving..." : "Save Post"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
