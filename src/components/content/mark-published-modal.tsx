"use client";

import { useState, useTransition } from "react";
import { X, CheckCircle2, ExternalLink, Globe } from "lucide-react";
import { publishContentPostAction } from "@/lib/actions/content";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  toDatetimeLocalIST,
  parseDatetimeLocalIST,
  formatDisplayDateTimeIST,
} from "@/lib/date-utils";

interface MarkPublishedModalProps {
  post: {
    id: string;
    title: string;
    scheduled_publish_date?: string | null;
    linkedin_post_url?: string | null;
    engagements?: {
      clients?: {
        name?: string;
        founder_name?: string;
      };
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MarkPublishedModal({
  post,
  isOpen,
  onClose,
  onSuccess,
}: MarkPublishedModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState(post?.linkedin_post_url || "");
  const [publishedAt, setPublishedAt] = useState(() => toDatetimeLocalIST());

  if (!isOpen || !post) return null;

  const clientName = post.engagements?.clients?.name || "Client";
  const founderName = post.engagements?.clients?.founder_name || "Founder";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await publishContentPostAction({
        postId: post.id,
        linkedin_post_url: linkedinUrl.trim() || undefined,
        published_at: publishedAt ? parseDatetimeLocalIST(publishedAt) : undefined,
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "Failed to mark post as published.");
      }
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-md w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[var(--color-ink)]">
                Mark as Published
              </h3>
              <p className="text-[11px] text-[var(--color-ink-tertiary)]">
                Confirm post is live on LinkedIn
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

        {/* Post Context Summary */}
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <BrandLogo nameOrDomain={clientName} size={14} className="rounded-[2px]" />
            <span className="font-medium text-[var(--color-ink)]">{clientName}</span>
            <span className="text-[var(--color-ink-tertiary)] font-sans tabular-nums text-[11px]">
              ({founderName})
            </span>
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] line-clamp-2">
            &ldquo;{post.title}&rdquo;
          </p>
          {post.scheduled_publish_date && (
            <p className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              Scheduled slot: {formatDisplayDateTimeIST(post.scheduled_publish_date, true)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* Live LinkedIn URL */}
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Live LinkedIn Post URL (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/..."
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] font-sans tabular-nums placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-[var(--color-ink-tertiary)] mt-1">
              Links this post directly to the founder&apos;s live LinkedIn profile.
            </p>
          </div>

          {/* Published Timestamp */}
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Published Timestamp
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] font-sans tabular-nums focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-line-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs cursor-pointer"
            >
              <span>{isPending ? "Publishing..." : "Confirm Published"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
