"use client";

import React from "react";
import Link from "next/link";
import { Send, ChevronRight } from "lucide-react";
import { formatDisplayDateIST, formatDisplayDateTimeIST } from "@/lib/date-utils";
import { getScheduledPostFounder } from "./command-center-utils";
import type { CommandCenterScheduledPost } from "@/types/domain";

interface UpcomingReleasesTopBarProps {
  scheduledPosts?: CommandCenterScheduledPost[];
}

export function UpcomingReleasesTopBar({ scheduledPosts = [] }: UpcomingReleasesTopBarProps) {
  if (!scheduledPosts || scheduledPosts.length === 0) {
    return null;
  }

  const nextPost = scheduledPosts[0];
  const moreCount = scheduledPosts.length - 1;

  return (
    <div className="border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/40 px-4 sm:px-5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
      <div className="min-w-0 flex items-center gap-2">
        <Send className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
        <span className="text-[11px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] shrink-0 font-medium">
          Next to publish
        </span>
        <span className="text-[11px] font-mono text-[var(--color-accent)] font-semibold tabular-nums shrink-0">
          {formatDisplayDateIST(nextPost.scheduled_publish_date, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-[11.5px] text-[var(--color-ink-secondary)] truncate">
          {getScheduledPostFounder(nextPost)} &middot; {nextPost.title}
        </span>
        {moreCount > 0 && (
          <span className="text-[10px] text-[var(--color-ink-muted)] shrink-0">
            (+{moreCount} more)
          </span>
        )}
      </div>

      <Link
        href="/content"
        className="text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-0.5 shrink-0"
      >
        <span>Calendar</span>
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
