"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

export interface OperationsFeedbackTabProps {
  feedback: any[];
}

export function OperationsFeedbackTab({ feedback }: OperationsFeedbackTabProps) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
            Founder Desk Notes &amp; Direction
          </h2>
        </div>
        <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
          Editorial Revisions
        </span>
      </div>

      {feedback.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
          No founder revision notes recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {feedback.map((fb) => (
            <div key={fb.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-ink)]">
                    {fb.author_name}
                  </span>
                  <span className="text-[var(--color-ink-tertiary)]">
                    on &ldquo;{fb.content_items?.title || "Perspective"}&rdquo;
                  </span>
                  <span className="text-[var(--color-ink-muted)]">
                    ({fb.content_items?.engagements?.clients?.name || "Founder Account"})
                  </span>
                </div>
                <span className="font-sans tabular-nums text-[11px] text-[var(--color-ink-tertiary)]">
                  {formatDisplayDateTimeIST(fb.created_at, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)] border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1.5">
                {fb.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
