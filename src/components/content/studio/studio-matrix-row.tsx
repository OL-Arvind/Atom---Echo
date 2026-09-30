"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutGrid,
  List,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { StudioMatrixCard } from "./studio-matrix-card";
import { StudioMatrixArchive } from "./studio-matrix-archive";

export interface StudioMatrixRowProps {
  group: {
    clientId: string;
    clientName: string;
    founderName: string;
    serviceType: string;
    websiteUrl?: string;
    founderEmail?: string;
    founderPhone?: string;
    posts: any[];
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isPending: boolean;
  copiedId: string | null;
  sevenDaysAgo: number;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

type DrawerFilter = "all" | "draft" | "review" | "scheduled" | "recent_published";
type DrawerDensity = "cards" | "dense";

export function StudioMatrixRow({
  group,
  isCollapsed,
  onToggleCollapse,
  isPending,
  copiedId,
  sevenDaysAgo,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioMatrixRowProps) {
  const [currentFilter, setCurrentFilter] = useState<DrawerFilter>("all");
  const [currentDensity, setCurrentDensity] = useState<DrawerDensity>("cards");

  const clientPosts = group.posts;

  const drafts = clientPosts.filter(
    (p) => p.status === "draft" || p.status === "internal_review"
  );
  const founderReviews = clientPosts.filter((p) => p.status === "client_review");
  const scheduled = clientPosts.filter(
    (p) => p.status === "scheduled" || p.status === "approved"
  );
  const publishedRecent = clientPosts.filter((p) => {
    if (p.status !== "published") return false;
    const pubTime = new Date(p.published_at || p.created_at).getTime();
    return pubTime >= sevenDaysAgo;
  });
  const publishedOlder = clientPosts.filter((p) => {
    if (p.status !== "published") return false;
    const pubTime = new Date(p.published_at || p.created_at).getTime();
    return pubTime < sevenDaysAgo;
  });

  // All active & recent posts that belong in the primary drawer
  const activePipelinePosts = [...drafts, ...founderReviews, ...scheduled, ...publishedRecent];

  // Filter within drawer
  const displayedDrawerPosts = activePipelinePosts.filter((p) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "draft") return p.status === "draft" || p.status === "internal_review";
    if (currentFilter === "review") return p.status === "client_review";
    if (currentFilter === "scheduled") return p.status === "scheduled" || p.status === "approved";
    if (currentFilter === "recent_published") return p.status === "published";
    return true;
  });

  // Determine health state
  const hasAwaitingReview = founderReviews.length > 0;
  const hasScheduled = scheduled.length > 0;
  const healthStatus = hasScheduled
    ? { label: "On Track", color: "bg-[var(--color-ok)]", text: "text-[var(--color-ok-text)]" }
    : hasAwaitingReview
    ? { label: "Awaiting Sign-off", color: "bg-[var(--color-warn)]", text: "text-[var(--color-warn-text)]" }
    : drafts.length > 0
    ? { label: "In Production", color: "bg-[var(--color-info)]", text: "text-[var(--color-ink-secondary)]" }
    : { label: "Needs Drafting", color: "bg-[var(--color-ink-muted)]", text: "text-[var(--color-ink-tertiary)]" };

  return (
    <div className="group/row">
      {/* Row Header */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) return;
          onToggleCollapse();
        }}
        className="px-5 py-3 sm:py-3.5 lg:px-7 flex flex-col lg:grid lg:grid-cols-[1fr_repeat(4,92px)_130px] items-start lg:items-center justify-between gap-3 lg:gap-0 hover:bg-[var(--color-base-subtle)]/40 transition-colors cursor-pointer select-none"
      >
        {/* Left: Founder Identity & Health */}
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="p-1 -ml-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-transform active:scale-90 cursor-pointer"
            title={isCollapsed ? "Expand perspectives" : "Collapse perspectives"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          <BrandLogo
            nameOrDomain={
              group.websiteUrl ||
              group.founderEmail ||
              group.clientName ||
              "Client"
            }
            size={26}
            className="rounded-[4px] shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/clients/${group.clientId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-display font-semibold text-sm sm:text-[14.5px] text-[var(--color-ink)] hover:underline decoration-[var(--color-line-strong)] underline-offset-4 truncate"
              >
                {group.clientName}
              </Link>
              <span className="text-xs text-[var(--color-ink-tertiary)]">
                ({group.founderName})
              </span>
              <span className="text-[var(--color-line-strong)] hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider tabular-nums font-medium">
                <span className={`h-1.5 w-1.5 rounded-full ${healthStatus.color} shrink-0`} />
                <span className={healthStatus.text}>{healthStatus.label}</span>
              </span>
            </div>

            <p className="text-[11px] text-[var(--color-ink-tertiary)] mt-0.5 truncate">
              {group.serviceType === "linkedin_branding"
                ? "LinkedIn Founder Branding"
                : group.serviceType?.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Micro Ledger Counters (Vertically Aligned Columns on Desktop) */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:contents pt-2 lg:pt-0 border-t border-[var(--color-line-subtle)] lg:border-t-0">
          <div className="text-center px-2">
            <span className="lg:hidden block text-[9.5px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">
              Drafting
            </span>
            <span className="font-semibold text-sm tabular-nums text-[var(--color-ink)]">
              {drafts.length}
            </span>
          </div>

          <div className="text-center px-2">
            <span className="lg:hidden block text-[9.5px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">
              Founder Desk
            </span>
            <span
              className={`font-semibold text-sm tabular-nums ${
                founderReviews.length > 0
                  ? "text-[var(--color-warn-text)] font-bold"
                  : "text-[var(--color-ink)]"
              }`}
            >
              {founderReviews.length}
            </span>
          </div>

          <div className="text-center px-2">
            <span className="lg:hidden block text-[9.5px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">
              Scheduled
            </span>
            <span
              className={`font-semibold text-sm tabular-nums ${
                scheduled.length > 0
                  ? "text-[var(--color-ok-text)] font-bold"
                  : "text-[var(--color-ink)]"
              }`}
            >
              {scheduled.length}
            </span>
          </div>

          <div className="text-center px-2">
            <span className="lg:hidden block text-[9.5px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-0.5">
              Published (7d)
            </span>
            <span className="font-semibold text-sm tabular-nums text-[var(--color-ink)]">
              {publishedRecent.length}
            </span>
          </div>

          {/* Action Column */}
          <div className="text-right pl-2 shrink-0">
            <Link
              href={`/content/new?clientId=${group.clientId}&from=content`}
              onClick={(e) => e.stopPropagation()}
              className="btn btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-transform py-1 px-2.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Draft</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Integrated Expandable Drawer */}
      {!isCollapsed && (
        <div className="border-t border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/20 px-5 py-4 lg:px-7 space-y-3.5">
          {/* Drawer Toolbar (Only when multiple active posts exist) */}
          {activePipelinePosts.length > 3 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 pb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentFilter("all")}
                  className={`px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                    currentFilter === "all"
                      ? "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)] shadow-2xs"
                      : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  All ({activePipelinePosts.length})
                </button>
                {drafts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentFilter("draft")}
                    className={`px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                      currentFilter === "draft"
                        ? "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)] shadow-2xs"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    Drafting ({drafts.length})
                  </button>
                )}
                {founderReviews.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentFilter("review")}
                    className={`px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                      currentFilter === "review"
                        ? "bg-[var(--color-surface)] text-[var(--color-warn-text)] font-semibold border border-[var(--color-line)] shadow-2xs"
                        : "text-[var(--color-warn-text)] hover:underline"
                    }`}
                  >
                    Founder Desk ({founderReviews.length})
                  </button>
                )}
                {scheduled.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentFilter("scheduled")}
                    className={`px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium transition-colors cursor-pointer ${
                      currentFilter === "scheduled"
                        ? "bg-[var(--color-surface)] text-[var(--color-ok-text)] font-semibold border border-[var(--color-line)] shadow-2xs"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    Scheduled ({scheduled.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentDensity((prev) => (prev === "dense" ? "cards" : "dense"))}
                className="self-end sm:self-auto text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 cursor-pointer font-medium"
                title={currentDensity === "cards" ? "Switch to compact table" : "Switch to card grid"}
              >
                {currentDensity === "cards" ? (
                  <>
                    <List className="h-3.5 w-3.5" />
                    <span>Dense Table</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Card Grid</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Active Posts Presentation */}
          {displayedDrawerPosts.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-ink-muted)] italic">
              {activePipelinePosts.length === 0
                ? 'Cadence clear. No active perspectives in draft or review. Click "Draft" to begin.'
                : "No perspectives matching the selected filter."}
            </div>
          ) : currentDensity === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {displayedDrawerPosts.map((post) => (
                <StudioMatrixCard
                  key={post.id}
                  post={post}
                  isPending={isPending}
                  copiedId={copiedId}
                  onStatusTransition={onStatusTransition}
                  onCopyReviewLink={onCopyReviewLink}
                  onOpenWhatsApp={onOpenWhatsApp}
                  onSetPublishingPost={onSetPublishingPost}
                />
              ))}
            </div>
          ) : (
            /* Dense Table Mode for High Post Volumes */
            <div className="rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] overflow-hidden">
              {displayedDrawerPosts.map((post) => (
                <div
                  key={post.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[var(--color-base-subtle)]/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        post.status === "client_review"
                          ? "bg-[var(--color-warn)]"
                          : post.status === "scheduled" || post.status === "approved" || post.status === "published"
                          ? "bg-[var(--color-ok)]"
                          : "bg-[var(--color-ink-muted)]"
                      }`}
                    />
                    <Link
                      href={`/content/${post.id}?from=content`}
                      className="font-medium text-[var(--color-ink)] hover:underline truncate"
                    >
                      {post.title}
                    </Link>
                    {post.target_pillar && (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-tertiary)] hidden sm:inline truncate">
                        · {post.target_pillar}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {post.scheduled_publish_date && (
                      <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)] hidden md:inline">
                        {formatDisplayDateIST(post.scheduled_publish_date)}
                      </span>
                    )}
                    <Link
                      href={`/content/${post.id}?from=content`}
                      className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium inline-flex items-center gap-0.5"
                    >
                      <span>Studio</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scalable Historical Archive Section */}
          <StudioMatrixArchive
            clientId={group.clientId}
            clientName={group.clientName}
            posts={publishedOlder}
          />
        </div>
      )}
    </div>
  );
}
