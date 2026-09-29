"use client";

import React from "react";
import { MessageSquare, ThumbsUp } from "lucide-react";

interface ReviewBottomBarProps {
  isPending: boolean;
  onToggleFeedback: () => void;
  onApprove: () => void;
}

export function ReviewBottomBar({
  isPending,
  onToggleFeedback,
  onApprove,
}: ReviewBottomBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 p-3.5 backdrop-blur-md pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <button
          type="button"
          onClick={onToggleFeedback}
          disabled={isPending}
          className="btn btn-secondary flex-1 h-11 text-xs cursor-pointer active:scale-[0.98] transition-transform"
        >
          <MessageSquare className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
          <span>Refine Edge / Notes</span>
        </button>

        <button
          type="button"
          onClick={onApprove}
          disabled={isPending}
          className="btn btn-accent flex-[1.4] h-11 text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>{isPending ? "Locking..." : "Approve for Publishing ↗"}</span>
        </button>
      </div>
    </footer>
  );
}
