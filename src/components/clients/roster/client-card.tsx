"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowUpRight,
  Check,
  Copy,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { EditClientTrigger } from "@/components/clients/edit-client-modal";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { getDaysUntilAnchor } from "./roster-utils";
import type { ClientWithEngagements, Engagement } from "@/types/domain";

interface ClientCardProps {
  client: ClientWithEngagements;
  activeToken?: string;
  copiedClientId: string | null;
  onCopyReviewLink: (clientId: string, token: string) => void;
}

export function ClientCard({
  client,
  activeToken,
  copiedClientId,
  onCopyReviewLink,
}: ClientCardProps) {
  const isActive = client.status?.toLowerCase() === "active";
  const engagements = client.engagements || [];
  const clientMrr = engagements.reduce(
    (acc: number, e: Engagement) => acc + Number(e.monthly_retainer || 0),
    0
  );
  const anchorDay = engagements[0]?.billing_anchor_day || 1;
  const allPosts = engagements.flatMap((e) => e.content_items || []);

  const scheduledPosts = allPosts.filter(
    (p) => p.status === "scheduled" || p.status === "approved"
  );
  const reviewPosts = allPosts.filter((p) => p.status === "client_review");
  const draftPosts = allPosts.filter(
    (p) => p.status === "draft" || p.status === "internal_review"
  );

  const nextScheduled = scheduledPosts[0];
  const nextReview = reviewPosts[0];
  const nextDraft = draftPosts[0];

  return (
    <div className="group card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--color-line-strong)] transition-all bg-[var(--color-surface)] shadow-card">
      <div className="space-y-4">
        {/* Top Row: Brand & Founder Info + Quick Controls */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo
              nameOrDomain={
                client.website_url || client.website || client.founder_email || client.name
              }
              size={38}
              className="h-9 w-9 object-contain rounded-md shrink-0 border border-[var(--color-line-subtle)]"
              fallback={
                <UserAvatar
                  seed={client.founder_name || client.name}
                  size={38}
                  className="rounded-md"
                  alt={client.founder_name || client.name}
                />
              }
            />
            <div className="min-w-0 leading-snug">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-[14.5px] font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors truncate font-display tracking-tight"
                >
                  {client.name}
                </Link>
                {/* Calm Status Dot */}
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-emerald-500" : "bg-[var(--color-ink-muted)]"
                  }`}
                  title={isActive ? "Active Retainer Account" : "Paused / Inactive"}
                />
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)] truncate mt-0.5">
                {client.founder_name}{" "}
                {client.founder_title ? `· ${client.founder_title}` : "· Founder"}
              </p>
            </div>
          </div>

          {/* Toolbar Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {client.linkedin_url && (
              <a
                href={client.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-1.5 rounded-md text-[var(--color-ink-tertiary)] hover:text-[#0A66C2] hover:bg-[var(--color-base-subtle)] active:scale-[0.92] transition-all cursor-pointer"
                title={`Open ${client.founder_name}'s LinkedIn Profile`}
              >
                <LinkedInIcon size={15} color="brand" />
              </a>
            )}
            {activeToken && (
              <button
                type="button"
                onClick={() => onCopyReviewLink(client.id, activeToken)}
                className="flex items-center justify-center p-1.5 rounded-md text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] active:scale-[0.92] transition-all cursor-pointer"
                title="Copy 1-tap Founder Review Link"
              >
                {copiedClientId === client.id ? (
                  <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <EditClientTrigger client={client} />
          </div>
        </div>

        {/* Operational Cadence Anchor */}
        <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 space-y-1">
          {nextScheduled ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-secondary)] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)] shrink-0" />
                <span>Cadence Locked</span>
                <span className="text-[var(--color-ink-muted)] font-normal lowercase">
                  &middot; {scheduledPosts.length} ready
                </span>
              </div>
              <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                &ldquo;{nextScheduled.title || "Perspective Locked"}&rdquo;
              </p>
              <span className="text-[11px] font-sans text-[var(--color-ink-muted)] tabular-nums block">
                Slot: {formatDisplayDateIST(nextScheduled.scheduled_publish_date)}
              </span>
            </div>
          ) : nextReview ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                <span>Founder Review Pending</span>
              </div>
              <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                &ldquo;{nextReview.title || "Draft Ready"}&rdquo;
              </p>
              <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                Awaiting 1-tap sign-off on Founder Desk
              </span>
            </div>
          ) : nextDraft ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-secondary)] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                <span>Internal Voice QA</span>
              </div>
              <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                &ldquo;{nextDraft.title || "Working Draft"}&rdquo;
              </p>
              <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                {draftPosts.length} draft{draftPosts.length > 1 ? "s" : ""} in refinement
              </span>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                <span>Cadence Stalled</span>
              </div>
              <p className="text-[13px] text-[var(--color-ink-secondary)]">
                0 active perspectives queued
              </p>
              <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                Capture founder convictions in workspace
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Single Unified Footer: Retainer Vitals (Left) + Workspace Entry (Right) */}
      <div className="border-t border-[var(--color-line-subtle)] pt-3.5 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-base font-semibold text-[var(--color-ink)] tabular-nums leading-none">
              ₹{clientMrr.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-sans text-[var(--color-ink-muted)]">
              /mo
            </span>
          </div>
          <span className="text-[11px] font-sans text-[var(--color-ink-tertiary)] tabular-nums block mt-1">
            Anchor {anchorDay}th &middot; {getDaysUntilAnchor(anchorDay)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeToken && (
            <a
              href={`/review/${activeToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11.5px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors px-1.5 py-1"
              title="Open Live Founder Review PWA"
            >
              <span>Portal</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
          <Link
            href={`/clients/${client.id}`}
            prefetch={true}
            className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 group/link"
          >
            <span>Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
