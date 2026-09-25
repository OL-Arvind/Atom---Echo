"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-raised)] p-6 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-danger-text)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            <span>Workspace Interrupted</span>
          </div>
          <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
            Unable to load operational view
          </h2>
          <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            {error.message || "A temporary connection issue interrupted the workspace data stream."}
          </p>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
