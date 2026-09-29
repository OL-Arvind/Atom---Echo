"use client";

import React from "react";
import Link from "next/link";
import {
  Feather,
  Plus,
  Copy,
  ExternalLink,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

export interface StudioListViewProps {
  filteredPosts: any[];
  isPending: boolean;
  copiedId: string | null;
  newPerspectiveHref: string;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioListView({
  filteredPosts,
  isPending,
  copiedId,
  newPerspectiveHref,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioListViewProps) {
  if (filteredPosts.length === 0) {
    return (
      <EmptyState
        icon={Feather}
        title="No perspectives found"
        description="Draft a perspective to capture founder conviction and shape it for LinkedIn."
        action={
          <Link
            href={newPerspectiveHref}
            className="btn btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Draft Perspective</span>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {filteredPosts.map((post) => {
        const client = post.engagements?.clients;
        const isDraft = post.status === "draft";
        const isQA = post.status === "internal_review";
        const isReview = post.status === "client_review";
        const isApproved = post.status === "approved";
        const isScheduled = post.status === "scheduled";
        const isPaused = post.status === "paused";

        const unresolvedNotes = (post.content_feedback || [])
          .filter((fb: any) => !fb.is_resolved && fb.comment)
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        const latestUnresolved = unresolvedNotes[0];

        return (
          <div
            key={post.id}
            className="card p-5 space-y-3 hover:border-[var(--color-line-strong)] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/content/${post.id}`}
                    className="font-medium text-sm text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors"
                  >
                    {post.title}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isReview || latestUnresolved
                          ? "bg-[var(--color-warn)]"
                          : isApproved || isScheduled
                          ? "bg-[var(--color-ok)]"
                          : isPaused
                          ? "bg-[var(--color-danger)]"
                          : "bg-[var(--color-ink-muted)]"
                      }`}
                    />
                    {latestUnresolved
                      ? latestUnresolved.author_type === "operator"
                        ? "QA Revision"
                        : "Founder Revision"
                      : post.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <BrandLogo
                      nameOrDomain={
                        client?.website_url ||
                        client?.founder_email ||
                        client?.name ||
                        "Client"
                      }
                      size={14}
                      className="rounded-[2px]"
                    />
                    <span>
                      <strong className="text-[var(--color-ink)] font-medium">
                        {client?.name || "Client"}
                      </strong>{" "}
                      ({client?.founder_name || "Founder"})
                    </span>
                  </div>
                  {post.target_pillar && (
                    <>
                      <span className="text-[var(--color-ink-tertiary)]">·</span>
                      <span>{post.target_pillar}</span>
                    </>
                  )}
                  {post.scheduled_publish_date && (
                    <>
                      <span className="text-[var(--color-ink-tertiary)]">·</span>
                      <span className="font-sans tabular-nums text-[11px] text-[var(--color-accent-text)]">
                        Scheduled: {formatDisplayDateTimeIST(post.scheduled_publish_date, true)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={`/content/${post.id}`}
                  className="btn btn-secondary text-xs inline-flex items-center gap-1"
                >
                  <span>Open Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                {isDraft && (
                  <button
                    onClick={() =>
                      onStatusTransition(
                        post,
                        latestUnresolved?.author_type === "client"
                          ? "client_review"
                          : "internal_review"
                      )
                    }
                    disabled={isPending}
                    className="btn btn-primary text-xs cursor-pointer"
                  >
                    <span>
                      {latestUnresolved?.author_type === "client"
                        ? "Re-send to Founder ↗"
                        : "Ready for QA →"}
                    </span>
                  </button>
                )}

                {isQA && (
                  <button
                    onClick={() => onStatusTransition(post, "client_review")}
                    disabled={isPending}
                    className="btn btn-primary text-xs cursor-pointer"
                  >
                    <span>Send to Founder ↗</span>
                  </button>
                )}

                {isReview && (
                  <>
                    <button
                      onClick={() => onCopyReviewLink(post)}
                      className="btn btn-secondary text-xs cursor-pointer"
                      title="Copy Review Link"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedId === post.id ? "Copied" : "Copy Link"}</span>
                    </button>
                    <button
                      onClick={() => onOpenWhatsApp(post)}
                      className="btn btn-primary text-xs cursor-pointer"
                      title="Nudge founder on WhatsApp"
                    >
                      <WhatsAppIcon size={13} className="text-[#25D366]" />
                      <span>WhatsApp</span>
                    </button>
                  </>
                )}

                {isScheduled && (
                  <button
                    onClick={() => onSetPublishingPost(post)}
                    className="btn btn-primary text-xs cursor-pointer"
                  >
                    <span>Publish</span>
                  </button>
                )}

                {post.status === "published" &&
                  (post.linkedin_post_url ? (
                    <a
                      href={post.linkedin_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-xs inline-flex items-center gap-1"
                    >
                      <span>Live on LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onSetPublishingPost(post)}
                      className="btn btn-secondary text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add URL</span>
                    </button>
                  ))}
              </div>
            </div>

            {latestUnresolved && (
              <p className="border-l-2 border-[var(--color-line-strong)] pl-3 py-1 text-xs text-[var(--color-ink)] leading-relaxed">
                <span className="font-medium text-[var(--color-warn-text)] mr-1.5">
                  {latestUnresolved.author_name}:
                </span>
                {latestUnresolved.comment}
              </p>
            )}

            {/* Body Snippet */}
            <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-2 leading-relaxed font-sans">
              {post.body_markdown || "No body draft."}
            </p>
          </div>
        );
      })}
    </div>
  );
}
