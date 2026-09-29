"use client";

import React from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { formatDisplayDateTimeIST, formatDisplayDateIST } from "@/lib/date-utils";
import type { ReviewPostItem } from "./types";

interface ReviewArchiveTabProps {
  approvedArchive: ReviewPostItem[];
  publishedPosts: ReviewPostItem[];
  pendingCount: number;
  onGoToQueue: () => void;
}

export function ReviewArchiveTab({
  approvedArchive,
  publishedPosts,
  pendingCount,
  onGoToQueue,
}: ReviewArchiveTabProps) {
  return (
    <main className="mx-auto max-w-md px-3.5 pt-3 space-y-3.5">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--color-line-subtle)]">
        <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
          Locked Publishing Calendar
        </span>
        <span className="text-xs font-sans tabular-nums text-[var(--color-ok)]">
          {approvedArchive.length} Locked
        </span>
      </div>

      {approvedArchive.length === 0 && publishedPosts.length === 0 ? (
        <div className="card p-6 text-center text-xs text-[var(--color-ink-secondary)] space-y-2">
          <Calendar className="h-6 w-6 mx-auto text-[var(--color-ink-tertiary)]" />
          <p>No perspectives locked or scheduled yet.</p>
          {pendingCount > 0 && (
            <button
              onClick={onGoToQueue}
              className="btn btn-secondary text-xs mt-2"
            >
              Review Pending Perspectives ({pendingCount})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {approvedArchive.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
                  Scheduled
                </span>
                {item.scheduled_publish_date && (
                  <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDisplayDateTimeIST(item.scheduled_publish_date, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              <h2 className="font-medium text-xs text-[var(--color-ink)] leading-snug">
                {item.title}
              </h2>

              <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                {item.body_markdown}
              </p>

              {item.target_pillar && (
                <div className="pt-1 text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                  Pillar: {item.target_pillar}
                </div>
              )}
            </div>
          ))}

          {publishedPosts.map((item) => (
            <div
              key={item.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]/60 p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
                  Published
                </span>
                {item.published_at && (
                  <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                    {formatDisplayDateIST(item.published_at, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              <h2 className="font-medium text-xs text-[var(--color-ink)] leading-snug">
                {item.title}
              </h2>

              {item.linkedin_post_url && (
                <a
                  href={item.linkedin_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline pt-1"
                >
                  <span>Live on LinkedIn ↗</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
