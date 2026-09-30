"use client";

import React, { useState, useMemo } from "react";
import { StudioKanbanCard } from "./studio-kanban-card";

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

const STAGE_CONFIG: Record<
  string,
  {
    dotColor: string;
    emptyTitle: string;
    emptyHint: string;
  }
> = {
  draft: {
    dotColor: "bg-[var(--color-ink-muted)]",
    emptyTitle: "No drafts queued",
    emptyHint: "Capture raw ideas from client notes",
  },
  internal_review: {
    dotColor: "bg-[#6366f1]",
    emptyTitle: "Voice QA is clear",
    emptyHint: "Drafts ready for editorial review will appear here",
  },
  client_review: {
    dotColor: "bg-[var(--color-warn)]",
    emptyTitle: "Founder desk clear",
    emptyHint: "No perspectives awaiting 1-tap approval",
  },
  scheduled: {
    dotColor: "bg-[#0284c7]",
    emptyTitle: "No scheduled posts",
    emptyHint: "Lock approved perspectives on calendar",
  },
  published: {
    dotColor: "bg-[var(--color-ok)]",
    emptyTitle: "No recent publications",
    emptyHint: "Live LinkedIn posts compound authority here",
  },
};

export function StudioKanbanView({
  kanbanColumns,
  isPending,
  copiedId,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioKanbanViewProps) {
  const [publishedCycle, setPublishedCycle] = useState<"7d" | "all">("7d");
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const [activeDropColId, setActiveDropColId] = useState<string | null>(null);

  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, post: any) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ postId: post.id, status: post.status })
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggingPostId(post.id);
  };

  const handleDragEnd = () => {
    setDraggingPostId(null);
    setActiveDropColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropColId !== colId) {
      setActiveDropColId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeDropColId === colId) {
        setActiveDropColId(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setActiveDropColId(null);
    setDraggingPostId(null);

    let rawData: any = null;
    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) rawData = JSON.parse(dataStr);
    } catch {
      // ignore parse errors
    }

    const targetPostId = rawData?.postId || draggingPostId;
    if (!targetPostId) return;

    // Locate the dragged post across columns
    let foundPost: any = null;
    for (const c of kanbanColumns) {
      const p = c.posts.find((item: any) => item.id === targetPostId);
      if (p) {
        foundPost = p;
        break;
      }
    }
    if (!foundPost) return;

    const currentStatus = foundPost.status;
    if (currentStatus === targetColId) return;
    if (
      targetColId === "scheduled" &&
      (currentStatus === "approved" || currentStatus === "scheduled")
    ) {
      return;
    }

    // Direct status transition to target column (including published)
    onStatusTransition(foundPost, targetColId);
  };

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 xl:gap-3.5 items-start">
      {kanbanColumns.map((col) => {
        const isPublishedCol = col.id === "published";
        const isDropTarget = activeDropColId === col.id;
        const stage = STAGE_CONFIG[col.id] || {
          dotColor: "bg-[var(--color-ink-muted)]",
          emptyTitle: "No items",
          emptyHint: "Stage is clear",
        };

        const displayedPosts =
          isPublishedCol && publishedCycle === "7d"
            ? col.posts.filter((p) => {
                const pubTime = new Date(p.published_at || p.created_at).getTime();
                return pubTime >= sevenDaysAgo;
              })
            : col.posts;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col min-h-[480px] rounded-[var(--radius-md)] border p-3 min-w-0 transition-all duration-160 ease-out ${
              isDropTarget
                ? "border-[var(--color-accent-line)] bg-[var(--color-accent-bg)]/25 ring-2 ring-[var(--color-accent)]/30"
                : "border-[var(--color-line)] bg-[var(--color-base-subtle)]/40"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-line-subtle)] pb-2.5 mb-3 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${stage.dotColor}`} />
                  <h3 className="font-semibold text-xs text-[var(--color-ink)] truncate tracking-tight">
                    {col.title}
                  </h3>
                  <span className="font-sans text-[11px] text-[var(--color-ink-muted)] font-medium tabular-nums shrink-0">
                    ({displayedPosts.length})
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5 truncate leading-tight">
                  {col.subtitle}
                </p>
              </div>

              {/* Cycle Scope Toggle for Published Column */}
              {isPublishedCol && col.posts.length > 0 && (
                <div className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 text-[9.5px] font-sans tabular-nums shrink-0">
                  <button
                    type="button"
                    onClick={() => setPublishedCycle("7d")}
                    className={`px-1.5 py-0.5 rounded-[2px] transition-all cursor-pointer ${
                      publishedCycle === "7d"
                        ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold shadow-2xs"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishedCycle("all")}
                    className={`px-1.5 py-0.5 rounded-[2px] transition-all cursor-pointer ${
                      publishedCycle === "all"
                        ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold shadow-2xs"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    All ({col.posts.length})
                  </button>
                </div>
              )}
            </div>

            {/* Column Post Cards or Tactile Empty State */}
            {displayedPosts.length === 0 ? (
              <div
                className={`flex-1 flex flex-col items-center justify-center min-h-[140px] rounded-[var(--radius-sm)] border-2 border-dashed p-4 text-center transition-all ${
                  isDropTarget
                    ? "border-[var(--color-accent-line)] bg-[var(--color-accent-bg)]/30 text-[var(--color-accent-text)]"
                    : "border-[var(--color-line-subtle)]"
                }`}
              >
                <span className="text-[11px] font-sans font-medium text-[var(--color-ink-tertiary)]">
                  {isDropTarget ? `Drop into ${col.title.replace(/^\d+\s*/, "")}` : stage.emptyTitle}
                </span>
                <span className="text-[10px] font-sans text-[var(--color-ink-muted)] mt-1 max-w-[140px] leading-tight">
                  {isDropTarget ? "Release to transition stage" : stage.emptyHint}
                </span>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {displayedPosts.map((post) => (
                  <StudioKanbanCard
                    key={post.id}
                    post={post}
                    isPending={isPending}
                    copiedId={copiedId}
                    isBeingDragged={draggingPostId === post.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onStatusTransition={onStatusTransition}
                    onCopyReviewLink={onCopyReviewLink}
                    onOpenWhatsApp={onOpenWhatsApp}
                    onSetPublishingPost={onSetPublishingPost}
                  />
                ))}
              </div>
            )}

            {/* Show older published archive button if some posts were hidden */}
            {isPublishedCol && publishedCycle === "7d" && col.posts.length > displayedPosts.length && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPublishedCycle("all")}
                  className="w-full py-1.5 px-2 rounded-[var(--radius-xs)] border border-dashed border-[var(--color-line)] text-[10.5px] font-sans text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:border-[var(--color-line-strong)] transition-colors cursor-pointer text-center"
                >
                  +{col.posts.length - displayedPosts.length} older published perspectives
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
