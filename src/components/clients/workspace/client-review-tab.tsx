"use client";

import React from "react";
import Link from "next/link";
import { Share2, Copy, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export interface ClientReviewTabProps {
  clientName: string;
  founderName: string;
  reviewUrl: string | null;
  reviewToken: string | null;
  reviewPendingCount: number;
  onCopyReviewLink: () => void;
  onOpenWhatsApp: () => void;
}

export function ClientReviewTab({
  clientName,
  founderName,
  reviewUrl,
  reviewToken,
  reviewPendingCount,
  onCopyReviewLink,
  onOpenWhatsApp,
}: ClientReviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Private Founder Desk Gateway
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)]">
            Private, zero-login mobile workspace for {founderName}. Keep the edges. They approve every word before it carries their name.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
              Private Founder Desk URL
            </span>
            <div className="font-sans tabular-nums text-xs text-[var(--color-ink)] break-all select-all bg-[var(--color-base-subtle)] p-2.5 rounded-[var(--radius-xs)] border border-[var(--color-line)]">
              {reviewUrl || "No review link generated yet"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCopyReviewLink}
              className="btn btn-secondary text-xs flex-1 justify-center"
            >
              <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
              <span>Copy Desk Link</span>
            </button>
            {reviewUrl && (
              <Link
                href={`/review/${reviewToken}`}
                target="_blank"
                className="btn btn-secondary text-xs flex-1 justify-center inline-flex items-center gap-1.5"
              >
                <span>Open Founder Desk</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <button
            onClick={onOpenWhatsApp}
            className="btn btn-primary text-xs w-full justify-center"
          >
            <WhatsAppIcon size={14} className="text-[#25D366]" />
            <span>Ping Founder on WhatsApp</span>
          </button>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-1.5 shadow-2xs">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
            Founder Approval Queue
          </span>
          <div className="font-display text-2xl font-semibold text-[var(--color-ink)] tabular-nums">
            {reviewPendingCount}{" "}
            <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">
              perspectives awaiting review
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            When a perspective is sent for review, it appears instantly on the founder&apos;s mobile phone for 1-tap sign-off or voice notes.
          </p>
        </div>
      </div>

      {/* Mobile Simulator Frame */}
      <div className="lg:col-span-7 flex flex-col items-center">
        <div className="w-full max-w-[360px] rounded-[36px] border-[6px] border-[#18181b] bg-[#09090b] p-2.5 shadow-2xl">
          {/* Speaker Notch */}
          <div className="mx-auto mb-2 h-3.5 w-24 rounded-full bg-[#27272a] flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-[#3f3f46] mr-1.5" />
            <div className="h-1 w-8 rounded-full bg-[#18181b]" />
          </div>

          <iframe
            src={`/review/${reviewToken}`}
            className="w-full h-[520px] rounded-[22px] border-0 bg-[var(--color-base)]"
            title={`Mobile Review Preview for ${clientName}`}
          />
        </div>
      </div>
    </div>
  );
}
