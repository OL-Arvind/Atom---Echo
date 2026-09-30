"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { publishContentPostAction } from "@/lib/actions/content";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
  toDatetimeLocalIST,
  parseDatetimeLocalIST,
  formatDisplayDateTimeIST,
} from "@/lib/date-utils";

interface MarkPublishedModalProps {
  post: {
    id: string;
    title: string;
    body_markdown?: string | null;
    status?: string | null;
    scheduled_publish_date?: string | null;
    published_at?: string | null;
    linkedin_post_url?: string | null;
    engagements?: {
      clients?: {
        name?: string;
        founder_name?: string;
        linkedin_url?: string;
      };
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data?: { linkedin_post_url?: string; published_at?: string }) => void;
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
  const [copiedBody, setCopiedBody] = useState(false);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen && post) {
      setLinkedinUrl(post.linkedin_post_url || "");
      setPublishedAt(
        post.published_at
          ? toDatetimeLocalIST(post.published_at)
          : toDatetimeLocalIST()
      );
      setError(null);
      setCopiedBody(false);
    }
  }, [isOpen, post]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const isAlreadyPublished = post.status === "published";
  const clientName = post.engagements?.clients?.name || "Client";
  const founderName = post.engagements?.clients?.founder_name || "Founder";
  const founderLinkedinUrl =
    post.engagements?.clients?.linkedin_url || "https://www.linkedin.com/feed/";

  const handleCopyBody = async () => {
    if (!post.body_markdown) return;
    try {
      await navigator.clipboard.writeText(post.body_markdown);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

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
        if (onSuccess) {
          onSuccess({
            linkedin_post_url: linkedinUrl.trim() || undefined,
            published_at: publishedAt
              ? parseDatetimeLocalIST(publishedAt)
              : new Date().toISOString(),
          });
        }
      } else {
        setError(res.error || "Failed to mark post as published.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs select-none animate-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-5 sm:p-6 shadow-dialog space-y-4 text-[var(--color-ink)] animate-in select-text">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-3">
          <div>
            <h3 className="font-medium text-sm text-[var(--color-ink)]">
              {isAlreadyPublished
                ? "Attach Live LinkedIn URL"
                : "Confirm LinkedIn Publication"}
            </h3>
            <p className="text-[11px] text-[var(--color-ink-tertiary)]">
              {isAlreadyPublished
                ? "Link the live LinkedIn post to this perspective."
                : "Copy final perspective text, publish on LinkedIn, and log the live URL."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="border-l-2 border-[var(--color-danger)] pl-3 py-1 text-xs text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        {/* Post Context Summary + 1-Click Copy Helper */}
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs min-w-0">
              <BrandLogo
                nameOrDomain={clientName}
                size={14}
                className="rounded-[2px] shrink-0"
              />
              <span className="font-medium text-[var(--color-ink)] truncate">
                {clientName}
              </span>
              <span className="text-[var(--color-ink-tertiary)] font-sans tabular-nums text-[11px] shrink-0">
                ({founderName})
              </span>
            </div>
            {post.scheduled_publish_date && (
              <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] shrink-0">
                {formatDisplayDateTimeIST(post.scheduled_publish_date, true)}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] line-clamp-2">
            &ldquo;{post.title}&rdquo;
          </p>
          {post.body_markdown && (
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-line-subtle)]">
              <button
                type="button"
                onClick={handleCopyBody}
                className="btn btn-secondary text-[11px] py-1 px-2.5 flex-1 cursor-pointer"
              >
                {copiedBody ? (
                  <>
                    <Check className="h-3 w-3 text-[var(--color-ok)]" />
                    <span>Copied Post Copy</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                    <span>Copy Post Text</span>
                  </>
                )}
              </button>
              <a
                href={founderLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-[11px] py-1 px-2.5 inline-flex items-center gap-1 border border-[var(--color-line)]"
              >
                <span>Open LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* Live LinkedIn URL */}
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Live LinkedIn Post URL
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
            <CustomDatePicker
              value={publishedAt}
              onChange={setPublishedAt}
              showTime
              presetMode="past"
              placeholder="Select published timestamp"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-line-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs cursor-pointer"
            >
              <span>
                {isPending
                  ? "Saving..."
                  : isAlreadyPublished
                  ? "Save LinkedIn URL"
                  : "Confirm Published"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
