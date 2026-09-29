"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Copy,
  ShieldAlert,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";

export interface StudioMatrixViewProps {
  engagements: any[];
  posts: any[];
  isPending: boolean;
  copiedId: string | null;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioMatrixView({
  engagements,
  posts,
  isPending,
  copiedId,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioMatrixViewProps) {
  // Map of clientId -> expanded boolean (default expanded)
  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>({});

  const toggleClient = (clientId: string) => {
    setCollapsedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Group engagements uniquely by client
  const clientGroups = React.useMemo(() => {
    const map = new Map<string, {
      clientId: string;
      clientName: string;
      founderName: string;
      serviceType: string;
      websiteUrl?: string;
      founderPhone?: string;
      posts: any[];
    }>();

    // Initialize from active engagements
    for (const eng of engagements) {
      const cId = eng.clientId;
      if (!cId) continue;
      if (!map.has(cId)) {
        map.set(cId, {
          clientId: cId,
          clientName: eng.clientName || "Client",
          founderName: eng.founderName || "Founder",
          serviceType: eng.serviceType || "linkedin_branding",
          websiteUrl: eng.websiteUrl,
          founderPhone: eng.founderPhone,
          posts: [],
        });
      }
    }

    // Populate posts into their respective client group
    for (const post of posts) {
      const c = post.engagements?.clients;
      const cId = c?.id || post.engagements?.client_id;
      if (!cId) continue;

      if (!map.has(cId)) {
        map.set(cId, {
          clientId: cId,
          clientName: c?.name || "Client",
          founderName: c?.founder_name || "Founder",
          serviceType: post.engagements?.service_type || "linkedin_branding",
          websiteUrl: c?.website_url,
          founderPhone: c?.founder_phone,
          posts: [],
        });
      }
      map.get(cId)!.posts.push(post);
    }

    return Array.from(map.values());
  }, [engagements, posts]);

  const sevenDaysAgo = React.useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  return (
    <div className="space-y-4">
      {clientGroups.map((group) => {
        const isCollapsed = Boolean(collapsedClients[group.clientId]);
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
          <div
            key={group.clientId}
            className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xs overflow-hidden transition-colors"
          >
            {/* Client Cadence Header Ledger */}
            <div className="p-4 sm:p-5 border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Identity & Health */}
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleClient(group.clientId)}
                  className="p-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
                  title={isCollapsed ? "Expand perspectives" : "Collapse perspectives"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <BrandLogo
                  nameOrDomain={group.websiteUrl || group.clientName}
                  size={24}
                  className="rounded-[4px] shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/clients/${group.clientId}`}
                      className="font-display font-semibold text-base text-[var(--color-ink)] hover:underline decoration-[var(--color-line-strong)] underline-offset-4 truncate"
                    >
                      {group.clientName}
                    </Link>
                    <span className="text-xs text-[var(--color-ink-tertiary)]">
                      ({group.founderName})
                    </span>
                    <span className="text-[var(--color-line-strong)]">·</span>
                    <span className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider tabular-nums font-medium">
                      <span className={`h-1.5 w-1.5 rounded-full ${healthStatus.color} shrink-0`} />
                      <span className={healthStatus.text}>{healthStatus.label}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                    {group.serviceType === "linkedin_branding"
                      ? "LinkedIn Founder Branding"
                      : group.serviceType?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              {/* Right Cadence Counts & Action */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                {/* Micro Metric Ledger */}
                <div className="flex items-center divide-x divide-[var(--color-line-subtle)] text-xs font-sans tabular-nums text-[var(--color-ink-secondary)]">
                  <div className="px-2.5 sm:px-3 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Drafting
                    </span>
                    <span className="font-semibold text-[var(--color-ink)] text-sm">
                      {drafts.length}
                    </span>
                  </div>

                  <div className="px-2.5 sm:px-3 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Founder Desk
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        founderReviews.length > 0 ? "text-[var(--color-warn-text)]" : "text-[var(--color-ink)]"
                      }`}
                    >
                      {founderReviews.length}
                    </span>
                  </div>

                  <div className="px-2.5 sm:px-3 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Scheduled
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        scheduled.length > 0 ? "text-[var(--color-ok-text)]" : "text-[var(--color-ink)]"
                      }`}
                    >
                      {scheduled.length}
                    </span>
                  </div>

                  <div className="px-2.5 sm:px-3 text-center">
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                      Published (7d)
                    </span>
                    <span className="font-semibold text-[var(--color-ink)] text-sm">
                      {publishedRecent.length}
                    </span>
                  </div>
                </div>

                {/* Direct Draft Button for this client */}
                <Link
                  href={`/content/new?clientId=${group.clientId}&from=content`}
                  className="btn btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Draft Perspective</span>
                </Link>
              </div>
            </div>

            {/* Client Active Perspectives Track */}
            {!isCollapsed && (
              <div className="p-4 sm:p-5 space-y-3">
                {clientPosts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--color-ink-muted)] italic">
                    No active perspectives for this founder. Click &ldquo;Draft Perspective&rdquo; above to start.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {clientPosts.map((post) => {
                      const isDraft = post.status === "draft";
                      const isQA = post.status === "internal_review";
                      const isReview = post.status === "client_review";
                      const isApproved = post.status === "approved";
                      const isScheduled = post.status === "scheduled";
                      const isPublished = post.status === "published";

                      // Unresolved feedback note
                      const unresolvedNotes = (post.content_feedback || [])
                        .filter((fb: any) => !fb.is_resolved && fb.comment)
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                      const latestUnresolved = unresolvedNotes[0];

                      // Aging calculation for Founder Desk items
                      let waitingDays = 0;
                      if (isReview && post.created_at) {
                        const days = Math.floor(
                          (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        waitingDays = Math.max(0, days);
                      }

                      return (
                        <div
                          key={post.id}
                          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-raised)] p-3.5 space-y-2.5 shadow-2xs hover:border-[var(--color-line-strong)] transition-colors flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            {/* Top Meta: Status & Target Pillar */}
                            <div className="flex items-center justify-between gap-2 text-[10.5px] font-sans tabular-nums">
                              <span className="flex items-center gap-1.5 uppercase tracking-wider font-medium text-[var(--color-ink-secondary)]">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                    isReview
                                      ? "bg-[var(--color-warn)]"
                                      : isApproved || isScheduled
                                      ? "bg-[var(--color-ok)]"
                                      : isPublished
                                      ? "bg-[var(--color-ok)]"
                                      : "bg-[var(--color-ink-muted)]"
                                  }`}
                                />
                                <span>{post.status?.replace("_", " ")}</span>
                              </span>

                              {isReview && waitingDays >= 2 && (
                                <span className="inline-flex items-center gap-1 text-[var(--color-warn-text)] font-semibold">
                                  <Clock className="h-3 w-3" />
                                  <span>{waitingDays}d waiting</span>
                                </span>
                              )}

                              {post.target_pillar && (
                                <span className="uppercase tracking-wider text-[var(--color-ink-tertiary)] truncate">
                                  {post.target_pillar}
                                </span>
                              )}
                            </div>

                            {/* Title (Link to Studio) */}
                            <Link
                              href={`/content/${post.id}?from=content`}
                              className="font-display font-medium text-[13.5px] text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-2 block leading-snug"
                            >
                              {post.title}
                            </Link>

                            {/* Unresolved feedback excerpt */}
                            {latestUnresolved && (
                              <div className="space-y-0.5 border-l-2 border-[var(--color-line-strong)] pl-2 py-0.5">
                                <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] block">
                                  {latestUnresolved.author_type === "operator" ? "QA Note" : "Founder Note"}
                                </span>
                                <p className="text-[11px] text-[var(--color-ink-secondary)] line-clamp-1">
                                  {latestUnresolved.comment}
                                </p>
                              </div>
                            )}

                            {/* Schedule Slot */}
                            {post.scheduled_publish_date && (
                              <div className="flex items-center gap-1.5 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                                <Calendar className="h-3 w-3 text-[var(--color-accent)]" />
                                <span>Slot: {formatDisplayDateIST(post.scheduled_publish_date)}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Action Buttons */}
                          <div className="pt-2 border-t border-[var(--color-line-subtle)] flex items-center justify-between gap-1.5">
                            <Link
                              href={`/content/${post.id}?from=content`}
                              className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 font-medium"
                            >
                              <span>Studio</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>

                            <div className="flex items-center gap-1">
                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={() => onStatusTransition(post, "internal_review")}
                                  disabled={isPending}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Move to Internal Voice QA"
                                >
                                  <span>Ready for QA &rarr;</span>
                                </button>
                              )}

                              {isQA && (
                                <button
                                  type="button"
                                  onClick={() => onStatusTransition(post, "client_review")}
                                  disabled={isPending}
                                  className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Send to Founder Desk & copy link"
                                >
                                  <span>Send to Founder &rarr;</span>
                                </button>
                              )}

                              {isReview && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onCopyReviewLink(post)}
                                    className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                    title="Copy private review link"
                                  >
                                    {copiedId === post.id ? (
                                      <>
                                        <Check className="h-2.5 w-2.5 text-[var(--color-ok)]" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-2.5 w-2.5 text-[var(--color-ink-tertiary)]" />
                                        <span>Link</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenWhatsApp(post)}
                                    className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                    title="Ping founder on WhatsApp"
                                  >
                                    <WhatsAppIcon size={11} className="text-[#25D366]" />
                                    <span>Ping</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => onStatusTransition(post, "scheduled")}
                                  disabled={isPending}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Lock Scheduled Slot"
                                >
                                  <span>Lock Schedule &rarr;</span>
                                </button>
                              )}

                              {isScheduled && (
                                <button
                                  type="button"
                                  onClick={() => onSetPublishingPost(post)}
                                  className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                  title="Mark as Published on LinkedIn"
                                >
                                  <span>Publish &rarr;</span>
                                </button>
                              )}

                              {isPublished && post.linkedin_post_url && (
                                <a
                                  href={post.linkedin_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 inline-flex items-center gap-1"
                                  title="View live LinkedIn post"
                                >
                                  <span>Live</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {publishedOlder.length > 0 && (
                  <div className="pt-2 text-center">
                    <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      +{publishedOlder.length} historical published perspectives archived for {group.clientName}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
