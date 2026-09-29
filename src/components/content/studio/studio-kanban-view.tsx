"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";

export interface KanbanColumn {
  id: string;
  title: string;
  subtitle: string;
  posts: any[];
}

export interface StudioKanbanViewProps {
  kanbanColumns: KanbanColumn[];
  isPending: boolean;
  copiedId: string | null;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioKanbanView({
  kanbanColumns,
  isPending,
  copiedId,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {kanbanColumns.map((col) => (
        <div
          key={col.id}
          className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-3 space-y-3 min-w-[240px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
            <div>
              <h3 className="font-semibold text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                <span>{col.title}</span>
                <span className="font-sans text-[11px] text-[var(--color-ink-tertiary)] font-normal tabular-nums">
                  ({col.posts.length})
                </span>
              </h3>
              <p className="text-[10.5px] text-[var(--color-ink-tertiary)] mt-0.5">
                {col.subtitle}
              </p>
            </div>
          </div>

          {/* Column Post Cards */}
          <div className="space-y-2.5">
            {col.posts.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-[var(--color-ink-muted)] italic">
                Empty stage
              </div>
            ) : (
              col.posts.map((post) => {
                const client = post.engagements?.clients;
                const tabooWords: string[] = client?.client_contexts?.[0]?.taboo_words || [];
                const bodyLower = (post.body_markdown || "").toLowerCase();
                const flagged = tabooWords.filter((w) => {
                  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  return new RegExp(`\\b${escaped}\\b`, "i").test(bodyLower);
                });

                const unresolvedNotes = (post.content_feedback || [])
                  .filter((fb: any) => !fb.is_resolved && fb.comment)
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );
                const latestUnresolved = unresolvedNotes[0];
                const hasFounderRevision = unresolvedNotes.some(
                  (fb: any) => fb.author_type === "client"
                );

                return (
                  <div
                    key={post.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-raised)] p-3 space-y-2.5 shadow-xs hover:border-[var(--color-line-strong)] transition-colors"
                  >
                    {/* Card Client & Pillar */}
                    <div className="flex items-center justify-between text-[10.5px]">
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        <BrandLogo
                          nameOrDomain={
                            client?.website_url ||
                            client?.founder_email ||
                            client?.name ||
                            "Client"
                          }
                          size={14}
                          className="rounded-[2px]"
                        />
                        <span className="font-medium text-[var(--color-ink-secondary)] truncate">
                          {client?.name || "Client"}
                        </span>
                      </div>
                      {post.target_pillar && (
                        <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                          {post.target_pillar.split(" ")[0]}
                        </span>
                      )}
                    </div>

                    {/* Unresolved Revision Note Indicator */}
                    {latestUnresolved && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-warn-text)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                          <span>
                            {latestUnresolved.author_type === "operator"
                              ? "QA Revision Note"
                              : "Founder Revision"}
                          </span>
                        </div>
                        <p className="border-l-2 border-[var(--color-line-strong)] pl-2 py-0.5 text-[11px] text-[var(--color-ink-secondary)] line-clamp-2 leading-snug">
                          {latestUnresolved.comment}
                        </p>
                      </div>
                    )}

                    {/* Post Title */}
                    <Link
                      href={`/content/${post.id}`}
                      className="font-medium text-xs text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-2 block"
                    >
                      {post.title}
                    </Link>

                    {/* Taboo Warning */}
                    {flagged.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums text-[var(--color-danger-text)] border-l-2 border-[var(--color-danger-line)] pl-2 py-0.5">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        <span className="truncate">Taboo: {flagged.join(", ")}</span>
                      </div>
                    )}

                    {/* Published or Scheduled Date */}
                    {post.status === "published" && post.published_at ? (
                      <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ok-text)]">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span>Published {formatDisplayDateIST(post.published_at)}</span>
                      </div>
                    ) : post.scheduled_publish_date ? (
                      <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                        <Calendar className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
                        <span>{formatDisplayDateIST(post.scheduled_publish_date)}</span>
                      </div>
                    ) : null}

                    {/* Card Actions Footer */}
                    <div className="pt-2 border-t border-[var(--color-line-subtle)] flex items-center justify-between gap-1.5">
                      <Link
                        href={`/content/${post.id}`}
                        className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 font-medium"
                      >
                        <span>Studio</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>

                      <div className="flex items-center gap-1">
                        {post.status === "draft" && (
                          hasFounderRevision ? (
                            <button
                              onClick={() => onStatusTransition(post, "client_review")}
                              disabled={isPending}
                              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                              title="Re-send revised post directly to Founder Desk"
                            >
                              <span>Re-send &rarr;</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onStatusTransition(post, "internal_review")}
                              disabled={isPending}
                              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                              title="Move to Internal Voice QA"
                            >
                              <span>Ready for QA &rarr;</span>
                            </button>
                          )
                        )}

                        {post.status === "internal_review" && (
                          <button
                            onClick={() => onStatusTransition(post, "client_review")}
                            disabled={isPending}
                            className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer"
                            title="Send to Founder Desk & copy review link"
                          >
                            <span>Send to Founder &rarr;</span>
                          </button>
                        )}

                        {post.status === "client_review" && (
                          <>
                            <button
                              onClick={() => onCopyReviewLink(post)}
                              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                              title="Copy private Founder Desk link"
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
                              onClick={() => onOpenWhatsApp(post)}
                              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                              title="Ping founder on WhatsApp"
                            >
                              <WhatsAppIcon size={11} className="text-[#25D366]" />
                              <span>Ping</span>
                            </button>
                          </>
                        )}

                        {post.status === "approved" && (
                          <button
                            onClick={() => onStatusTransition(post, "scheduled")}
                            disabled={isPending}
                            className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                            title="Confirm Scheduled Slot on Timeline"
                          >
                            <span>Lock Schedule &rarr;</span>
                          </button>
                        )}

                        {post.status === "scheduled" && (
                          <button
                            onClick={() => onSetPublishingPost(post)}
                            className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                            title="Mark as Published on LinkedIn"
                          >
                            <span>Publish &rarr;</span>
                          </button>
                        )}

                        {post.status === "published" &&
                          (post.linkedin_post_url ? (
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
                          ) : (
                            <button
                              onClick={() => onSetPublishingPost(post)}
                              className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                              title="Add live LinkedIn link"
                            >
                              <span>+ URL</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
