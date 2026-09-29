"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { CommandCenterAlert } from "@/types/domain";

interface RequestInspectorProps {
  selectedAlert: CommandCenterAlert;
  isPending: boolean;
  onResolveClientRequest: (alert: CommandCenterAlert) => void;
}

export function RequestInspector({
  selectedAlert,
  isPending,
  onResolveClientRequest,
}: RequestInspectorProps) {
  return (
    <>
      {/* Sleek Header */}
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 text-[10.5px] font-sans tracking-widest text-rose-500 dark:text-rose-400 font-semibold uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0" />
              <span>Founder Direct Note &middot; Active Hold</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
              {selectedAlert.title}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 space-y-4 overflow-y-auto min-h-0">
        <div className="max-w-3xl card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-line)]">
            <span className="text-[10px] uppercase font-sans tracking-widest text-rose-500 dark:text-rose-400 font-medium">
              Direct Founder Memo
            </span>
            <span className="text-[11px] text-[var(--color-ink-muted)]">
              {selectedAlert.client_name || "Account"}
            </span>
          </div>
          <div className="border-l-2 border-rose-500/80 dark:border-rose-400/80 pl-3.5 py-1">
            <p className="font-serif italic text-[14px] text-[var(--color-ink)] leading-relaxed select-text font-normal">
              &ldquo;{selectedAlert.reason}&rdquo;
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-2.5 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto flex items-center gap-2.5 shrink-0">
        {selectedAlert.client_id && (
          <Link
            href={`/clients/${selectedAlert.client_id}`}
            className="inline-flex items-center gap-1.5 btn btn-primary text-xs px-3 py-1.5 shadow-xs"
          >
            <span>Open Client 360</span>
          </Link>
        )}

        <button
          onClick={() => onResolveClientRequest(selectedAlert)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span>{isPending ? "Resolving..." : "Resolve & Resume"}</span>
        </button>
      </div>
    </>
  );
}
