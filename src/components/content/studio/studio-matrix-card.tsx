"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  Check,
  Copy,
  ChevronRight,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";

export interface StudioMatrixCardProps {
  post: any;
  isPending: boolean;
  copiedId: string | null;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioMatrixCard({
  post,
  isPending,
  copiedId,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioMatrixCardProps) {
  const isDraft = post.status === "draft";
  const isQA = post.status === "internal_review";
  const isReview = post.status === "client_review";
  const isApproved = post.status === "approved";
  const isScheduled = post.status === "scheduled";
  const isPublished = post.status === "published";

  // Unresolved feedback note
  const unresolvedNotes = (post.content_feedback || [])
    .filter((fb: any) => !fb.is_resolved && fb.comment)
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const latestUnresolved = unresolvedNotes[0];

  // Aging calculation for Founder Desk items
  let waitingDays = 0;
  if (isReview && post.created_at) {
    const days = Math.floor(
      (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    waitingDays = Math.max(0, days);
  }

  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 space-y-2.5 shadow-2xs hover:border-[var(--color-line-strong)] transition-all flex flex-col justify-between">
      <div className="space-y-2">
        {/* Top Meta: Status & Target Pillar */}
        <div className="flex items-center justify-between gap-2 text-[10.5px] font-sans tabular-nums">
          <span className="flex items-center gap-1.5 uppercase tracking-wider font-medium text-[var(--color-ink-secondary)]">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isReview
                  ? "bg-[var(--color-warn)]"
                  : isApproved || isScheduled
                  ? "bg-[var(--color-ok)]"
                  : isPublished
                  ? "bg-[var(--color-ok)]"
                  : "bg-[var(--color-ink-muted)]"
              }`}
            />
            <span>{post.status?.replace("_", " ")}</span>
          </span>

          {isReview && waitingDays >= 2 && (
            <span className="inline-flex items-center gap-1 text-[var(--color-warn-text)] font-semibold">
              <Clock className="h-3 w-3" />
              <span>{waitingDays}d waiting</span>
            </span>
          )}

          {post.target_pillar && (
            <span className="uppercase tracking-wider text-[var(--color-ink-tertiary)] truncate">
              {post.target_pillar}
            </span>
          )}
        </div>

        {/* Title (Link to Studio) */}
        <Link
          href={`/content/${post.id}?from=content`}
          className="font-display font-medium text-[13.5px] text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-2 block leading-snug"
        >
          {post.title}
        </Link>

        {/* Unresolved feedback excerpt */}
        {latestUnresolved && (
          <div className="space-y-0.5 border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5">
            <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] block">
              {latestUnresolved.author_type === "operator" ? "QA Note" : "Founder Note"}
            </span>
            <p className="text-[11px] text-[var(--color-ink-secondary)] line-clamp-1">
              {latestUnresolved.comment}
            </p>
          </div>
        )}

        {/* Schedule Slot */}
        {post.scheduled_publish_date && (
          <div className="flex items-center gap-1.5 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            <Calendar className="h-3 w-3 text-[var(--color-accent)]" />
            <span>Slot: {formatDisplayDateIST(post.scheduled_publish_date)}</span>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-2 border-t border-[var(--color-line-subtle)] flex items-center justify-between gap-1.5">
        <Link
          href={`/content/${post.id}?from=content`}
          className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 font-medium active:scale-[0.98] transition-transform"
        >
          <span>Studio</span>
          <ChevronRight className="h-3 w-3" />
        </Link>

        <div className="flex items-center gap-1">
          {isDraft && (
            <button
              type="button"
              onClick={() => onStatusTransition(post, "internal_review")}
              disabled={isPending}
              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer active:scale-[0.98] transition-transform"
              title="Move to Internal Voice QA"
            >
              <span>Ready for QA &rarr;</span>
            </button>
          )}

          {isQA && (
            <button
              type="button"
              onClick={() => onStatusTransition(post, "client_review")}
              disabled={isPending}
              className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer active:scale-[0.98] transition-transform"
              title="Send to Founder Desk & copy link"
            >
              <span>Send to Founder &rarr;</span>
            </button>
          )}

          {isReview && (
            <>
              <button
                type="button"
                onClick={() => onCopyReviewLink(post)}
                className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
                title="Copy private review link"
              >
                {copiedId === post.id ? (
                  <>
                    <Check className="h-2.5 w-2.5 text-[var(--color-ok)]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-2.5 w-2.5 text-[var(--color-ink-tertiary)]" />
                    <span>Link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onOpenWhatsApp(post)}
                className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
                title="Ping founder on WhatsApp"
              >
                <WhatsAppIcon size={11} className="text-[#25D366]" />
                <span>Ping</span>
              </button>
            </>
          )}

          {isApproved && (
            <button
              type="button"
              onClick={() => onStatusTransition(post, "scheduled")}
              disabled={isPending}
              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer active:scale-[0.98] transition-transform"
              title="Lock Scheduled Slot"
            >
              <span>Lock Schedule &rarr;</span>
            </button>
          )}

          {isScheduled && (
            <button
              type="button"
              onClick={() => onSetPublishingPost(post)}
              className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
              title="Mark as Published on LinkedIn"
            >
              <span>Publish &rarr;</span>
            </button>
          )}

          {isPublished && post.linkedin_post_url && (
            <a
              href={post.linkedin_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-[10.5px] py-0.5 px-2 inline-flex items-center gap-1 active:scale-[0.98] transition-transform"
              title="View live LinkedIn post"
            >
              <span>Live</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
