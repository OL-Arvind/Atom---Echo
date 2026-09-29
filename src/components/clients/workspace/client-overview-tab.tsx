"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ChevronRight,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import { formatDisplayDateIST } from "@/lib/date-utils";
import type { ClientWithRelations, ContentItem } from "@/types/domain";

export interface ClientOverviewTabProps {
  client: ClientWithRelations;
  clientPosts: ContentItem[];
  reviewPendingCount: number;
  scheduledCount: number;
  draftCount: number;
  reviewToken: string | null;
  reviewUrl: string | null;
  onCopyReviewLink: () => void;
  onOpenVoiceModal: () => void;
  onSelectTab: (tab: any) => void;
}

function getPostExcerpt(title?: string | null, body?: string | null): string {
  if (!body) return "";
  let clean = body.trim();
  if (title && clean.toLowerCase().startsWith(title.trim().toLowerCase())) {
    clean = clean.slice(title.trim().length).replace(/^[\s.—–\-:]+/, "").trim();
  }
  return clean || body.trim();
}

export function ClientOverviewTab({
  client,
  clientPosts,
  reviewPendingCount,
  reviewToken,
  reviewUrl,
  onCopyReviewLink,
  onOpenVoiceModal,
  onSelectTab,
}: ClientOverviewTabProps) {
  const context = client.context || null;
  const clientMeetings = client.meetings || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (8 cols): Editorial Publishing Stream */}
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Editorial Publishing Stream
            </h2>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
              Click any perspective to open the full Story &amp; Post Editor.
            </p>
          </div>
          <Link
            href={`/content/new?clientId=${client.id}&from=client`}
            className="btn btn-primary text-xs shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Perspective</span>
          </Link>
        </div>

        {clientPosts.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center space-y-3">
            <FileText className="h-7 w-7 text-[var(--color-ink-muted)] mx-auto" />
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-sm font-medium text-[var(--color-ink)]">No perspectives drafted yet</p>
              <p className="text-xs text-[var(--color-ink-tertiary)] leading-relaxed">
                Capture {client.founder_name}&apos;s unfiltered conviction and shape it into a LinkedIn perspective ready for 1-tap review.
              </p>
            </div>
            <Link
              href={`/content/new?clientId=${client.id}&from=client`}
              className="btn btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Draft First Perspective</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] shadow-2xs overflow-hidden">
            {clientPosts.map((post: any) => {
              const isReview = post.status === "client_review";
              const isApproved = post.status === "approved" || post.status === "scheduled";
              const isPaused = post.status === "paused";
              const excerpt = getPostExcerpt(post.title, post.body_markdown);

              return (
                <Link
                  key={post.id}
                  href={`/content/${post.id}?from=client`}
                  className="group p-5 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer flex flex-col gap-2.5 block"
                >
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-wider text-[var(--color-ink-secondary)]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isPaused
                              ? "bg-[var(--color-danger)]"
                              : isReview
                              ? "bg-[var(--color-warn)]"
                              : isApproved
                              ? "bg-[var(--color-ok)]"
                              : "bg-[var(--color-ink-muted)]"
                          }`}
                        />
                        <span>{post.status?.replace("_", " ")}</span>
                      </span>

                      {post.target_pillar && (
                        <>
                          <span className="text-[var(--color-line-strong)]">·</span>
                          <span>{post.target_pillar}</span>
                        </>
                      )}

                      {post.scheduled_publish_date && (
                        <>
                          <span className="text-[var(--color-line-strong)]">·</span>
                          <span>Slot: {formatDisplayDateIST(post.scheduled_publish_date)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isReview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCopyReviewLink();
                          }}
                          className="btn btn-secondary text-[11px] py-1 px-2.5"
                          title="Copy private review link"
                        >
                          <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                          <span>Copy Link</span>
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-ink)] transition-colors">
                        <span>Open Editor</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent-text)] transition-colors leading-snug">
                    {post.title}
                  </h3>

                  {/* De-duplicated Excerpt */}
                  {excerpt && excerpt !== post.title && (
                    <p className="text-[13px] text-[var(--color-ink-secondary)] line-clamp-2 leading-relaxed">
                      {excerpt}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column (4 cols): Founder Voice Snapshot & Portal Dossier */}
      <div className="lg:col-span-4 space-y-4">
        {/* Dossier Card 1: Voice & Positioning Guardrails */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-sans uppercase tracking-widest font-semibold text-[var(--color-ink-tertiary)]">
              Voice &amp; Guardrails
            </span>
            <button
              type="button"
              onClick={() => onSelectTab("context")}
              className="text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Configure</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {context?.tone_archetype || context?.positioning_statement ? (
            <div className="space-y-3">
              {context?.tone_archetype && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block mb-0.5">
                    Tone Archetype
                  </span>
                  <p className="text-xs font-semibold text-[var(--color-ink)]">
                    {context.tone_archetype}
                  </p>
                </div>
              )}
              {context?.positioning_statement && (
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-3 py-0.5 line-clamp-3">
                  {context.positioning_statement}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="w-full text-left rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] p-3 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)] transition-colors cursor-pointer"
            >
              Define {client.founder_name}&apos;s tone archetype, positioning, and content pillars &rarr;
            </button>
          )}

          {/* Core Pillars */}
          {context?.core_pillars && context.core_pillars.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[var(--color-line-subtle)]">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block">
                Content Pillars
              </span>
              <div className="flex flex-wrap gap-1.5">
                {context.core_pillars.map((pillar: string) => (
                  <span
                    key={pillar}
                    className="text-[11px] font-sans text-[var(--color-ink-secondary)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] px-2 py-0.5 rounded-[var(--radius-xs)]"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Taboo Words Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line-subtle)] text-xs">
            <span className="text-[var(--color-ink-tertiary)]">Avoided buzzwords</span>
            <button
              type="button"
              onClick={() => onSelectTab("context")}
              className="font-sans tabular-nums font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              {context?.taboo_words?.length || 0} terms &rarr;
            </button>
          </div>
        </div>

        {/* Dossier Card 2: Founder Desk & Recent Sync */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-sans uppercase tracking-widest font-semibold text-[var(--color-ink-tertiary)]">
              Review Portal &amp; Sync
            </span>
            {reviewUrl && (
              <Link
                href={`/review/${reviewToken}`}
                target="_blank"
                className="text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Live</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-ink-tertiary)]">Awaiting founder sign-off</span>
            <button
              type="button"
              onClick={() => onSelectTab("review")}
              className="font-sans tabular-nums font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              {reviewPendingCount} {reviewPendingCount === 1 ? "draft" : "drafts"} &rarr;
            </button>
          </div>

          {/* Latest Conversation Sync */}
          <div className="pt-3 border-t border-[var(--color-line-subtle)] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                Latest Sync
              </span>
              <button
                type="button"
                onClick={() => onSelectTab("meetings")}
                className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                All ({clientMeetings.length}) &rarr;
              </button>
            </div>
            {clientMeetings.length > 0 ? (
              <button
                type="button"
                onClick={() => onSelectTab("meetings")}
                className="w-full text-left group/meet cursor-pointer"
              >
                <p className="text-xs font-medium text-[var(--color-ink)] group-hover/meet:text-[var(--color-accent-text)] truncate transition-colors">
                  {clientMeetings[0].title}
                </p>
                <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                  {formatDisplayDateIST(clientMeetings[0].meeting_date)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab("meetings")}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] cursor-pointer"
              >
                No conversations logged yet &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
