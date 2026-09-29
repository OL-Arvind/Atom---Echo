"use client";

import React from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { getScheduledPostFounder } from "./command-center-utils";
import type { CommandCenterScheduledPost } from "@/types/domain";

interface CommandCenterUpcomingHorizonProps {
  scheduledPosts?: CommandCenterScheduledPost[];
}

export function CommandCenterUpcomingHorizon({
  scheduledPosts,
}: CommandCenterUpcomingHorizonProps) {
  return (
    <div className="border-t border-[var(--color-line)] p-4 sm:p-4.5 bg-[var(--color-base-subtle)]/60 mt-auto shrink-0">
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)] tracking-tight">
          <Calendar className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span>Upcoming Releases</span>
        </div>
        <Link
          href="/content"
          className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
        >
          Pipeline &rarr;
        </Link>
      </div>

      {scheduledPosts && scheduledPosts.length > 0 ? (
        <div className="space-y-1">
          {scheduledPosts.slice(0, 3).map((post: CommandCenterScheduledPost) => (
            <Link
              key={post.id}
              href={`/content/${post.id}`}
              className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-hover)] text-xs gap-3 transition-colors group"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-sans text-[var(--color-accent)] font-semibold tabular-nums">
                    {formatDisplayDateIST(post.scheduled_publish_date, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-[var(--color-ink-tertiary)] truncate">
                    &middot; {getScheduledPostFounder(post)}
                  </span>
                </div>
                <p className="text-[var(--color-ink)] group-hover:text-[var(--color-accent-text)] font-medium truncate text-[12px] transition-colors">
                  {post.title}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] shrink-0 font-medium">
                {post.target_pillar || "Perspective"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-[var(--color-ink-muted)] py-2 text-center">
          No approved perspectives are locked into a publishing slot.
        </p>
      )}
    </div>
  );
}
