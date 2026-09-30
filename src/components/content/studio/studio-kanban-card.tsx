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
  Clock,
  GripVertical,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatDisplayDateIST } from "@/lib/date-utils";

export interface StudioKanbanCardProps {
  post: any;
  isPending: boolean;
  copiedId: string | null;
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent, post: any) => void;
  onDragEnd: () => void;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioKanbanCard({
  post,
  isPending,
  copiedId,
  isBeingDragged,
  onDragStart,
  onDragEnd,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioKanbanCardProps) {
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
  const waitingDays =
    post.status === "client_review"
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(post.updated_at || post.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  return (
    <div
      draggable={!isPending}
      onDragStart={(e) => onDragStart(e, post)}
      onDragEnd={onDragEnd}
      className={`group/card select-none rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 space-y-2.5 shadow-2xs hover:border-[var(--color-line-strong)] hover:shadow-card transition-all duration-160 ease-out active:scale-[0.99] flex flex-col justify-between cursor-grab active:cursor-grabbing ${
        isBeingDragged
          ? "opacity-30 scale-[0.97] border-dashed border-[var(--color-ink-muted)] ring-1 ring-[var(--color-line-strong)]"
          : ""
      }`}
    >
      <div className="space-y-2">
        {/* Card Client, Drag Handle & Pillar */}
        <div className="flex items-center justify-between text-[10.5px]">
          <div className="flex items-center gap-1.5 truncate min-w-0 pr-1">
            <BrandLogo
              nameOrDomain={
                client?.website_url ||
                client?.founder_email ||
                client?.name ||
                "Client"
              }
              size={15}
              className="rounded-[3px] shrink-0"
            />
            <span className="font-medium text-[var(--color-ink-secondary)] truncate">
              {client?.name || "Client"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {post.target_pillar && (
              <span className="font-sans tabular-nums text-[9.5px] uppercase tracking-wider text-[var(--color-ink-muted)] font-medium">
                {post.target_pillar.split(" ")[0]}
              </span>
            )}
            <span title="Hold and drag to move stage" className="inline-flex items-center">
              <GripVertical className="h-3 w-3 text-[var(--color-ink-muted)]/30 group-hover/card:text-[var(--color-ink-muted)] transition-colors cursor-grab" />
            </span>
          </div>
        </div>

        {/* Unresolved Revision Note Indicator */}
        {latestUnresolved && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-warn-text)]">
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
          draggable={false}
          className="font-medium text-[12px] leading-snug text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-3 block break-words"
        >
          {post.title}
        </Link>

        {/* Taboo Warning */}
        {flagged.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums text-[var(--color-danger-text)] border-l-2 border-[var(--color-danger-line)] pl-2 py-0.5">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            <span className="truncate">Taboo: {flagged.join(", ")}</span>
          </div>
        )}

        {/* Published or Scheduled Date */}
        {post.status === "published" && post.published_at ? (
          <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums text-[var(--color-ok-text)]">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Published {formatDisplayDateIST(post.published_at)}</span>
          </div>
        ) : post.scheduled_publish_date ? (
          <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            <Calendar className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
            <span>{formatDisplayDateIST(post.scheduled_publish_date)}</span>
          </div>
        ) : null}

        {/* Aging Alert: Waiting on Founder for >= 2 days */}
        {post.status === "client_review" && waitingDays >= 2 && (
          <div className="flex items-center justify-between text-[10px] font-sans tabular-nums text-[var(--color-warn-text)] border-l-2 border-[var(--color-warn)] pl-2 py-0.5">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{waitingDays}d waiting on founder</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenWhatsApp(post);
              }}
              className="underline hover:text-[var(--color-ink)] cursor-pointer text-[10px]"
            >
              Ping &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-2 border-t border-[var(--color-line-subtle)] flex items-center justify-between gap-1.5">
        <Link
          href={`/content/${post.id}`}
          draggable={false}
          className="text-[10.5px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-0.5 font-medium transition-colors"
        >
          <span>Studio</span>
          <ChevronRight className="h-3 w-3" />
        </Link>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {post.status === "draft" && (
            hasFounderRevision ? (
              <button
                onClick={() => onStatusTransition(post, "client_review")}
                disabled={isPending}
                className="btn btn-secondary text-[10.5px] py-1 px-2.5 cursor-pointer active:scale-[0.97] transition-transform duration-150"
                title="Re-send revised post directly to Founder Desk"
              >
                <span>Re-send &rarr;</span>
              </button>
            ) : (
              <button
                onClick={() => onStatusTransition(post, "internal_review")}
                disabled={isPending}
                className="btn btn-secondary text-[10.5px] py-1 px-2.5 cursor-pointer active:scale-[0.97] transition-transform duration-150"
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
              className="btn btn-primary text-[10.5px] py-1 px-2.5 cursor-pointer active:scale-[0.97] transition-transform duration-150"
              title="Send to Founder Desk & copy review link"
            >
              <span>Send to Founder &rarr;</span>
            </button>
          )}

          {post.status === "client_review" && (
            <>
              <button
                onClick={() => onCopyReviewLink(post)}
                className="btn btn-secondary text-[10.5px] py-1 px-2 cursor-pointer inline-flex items-center gap-1 active:scale-[0.97] transition-transform duration-150"
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
                className="btn btn-secondary text-[10.5px] py-1 px-2 cursor-pointer inline-flex items-center gap-1 active:scale-[0.97] transition-transform duration-150"
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
              className="btn btn-secondary text-[10.5px] py-1 px-2.5 cursor-pointer active:scale-[0.97] transition-transform duration-150"
              title="Confirm Scheduled Slot on Timeline"
            >
              <span>Lock Schedule &rarr;</span>
            </button>
          )}

          {post.status === "scheduled" && (
            <button
              onClick={() => onSetPublishingPost(post)}
              className="btn btn-primary text-[10.5px] py-1 px-2.5 cursor-pointer inline-flex items-center gap-1 active:scale-[0.97] transition-transform duration-150"
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
                className="btn btn-secondary text-[10.5px] py-1 px-2 inline-flex items-center gap-1 active:scale-[0.97] transition-transform duration-150"
                title="View live LinkedIn post"
              >
                <span>Live</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <button
                onClick={() => onSetPublishingPost(post)}
                className="btn btn-secondary text-[10.5px] py-1 px-2 cursor-pointer active:scale-[0.97] transition-transform duration-150"
                title="Add live LinkedIn link"
              >
                <span>+ URL</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
