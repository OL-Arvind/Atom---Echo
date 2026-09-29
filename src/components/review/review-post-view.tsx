"use client";

import React from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { parseFeedbackComment } from "@/lib/feedback-utils";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import { ContentDiffView } from "@/components/content/content-diff-view";
import type { ReviewPostItem } from "./types";
import { ReviewFeedbackDrawer } from "./review-feedback-drawer";

interface ReviewPostViewProps {
  currentPost: ReviewPostItem;
  currentIndex: number;
  totalPosts: number;
  founderName: string;
  founderTitle: string;
  clientName: string;
  linkedinUrl?: string;
  viewMode: "linkedin" | "diff";
  setViewMode: React.Dispatch<React.SetStateAction<"linkedin" | "diff">>;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  showFeedbackDrawer: boolean;
  setShowFeedbackDrawer: React.Dispatch<React.SetStateAction<boolean>>;
  selectedChips: string[];
  commentText: string;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleChip: (chip: string) => void;
  onCommentChange: (text: string) => void;
  onSubmitFeedback: () => void;
}

export function ReviewPostView({
  currentPost,
  currentIndex,
  totalPosts,
  founderName,
  founderTitle,
  clientName,
  linkedinUrl,
  viewMode,
  setViewMode,
  isExpanded,
  setIsExpanded,
  showFeedbackDrawer,
  setShowFeedbackDrawer,
  selectedChips,
  commentText,
  isPending,
  onPrev,
  onNext,
  onToggleChip,
  onCommentChange,
  onSubmitFeedback,
}: ReviewPostViewProps) {
  return (
    <>
      {/* Batch Queue Stepper Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-accent-text)] font-semibold">
            PERSPECTIVE {currentIndex + 1} OF {totalPosts}
          </span>
          {/* Step dots */}
          {totalPosts > 1 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPosts }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex
                      ? "w-4 bg-[var(--color-accent)]"
                      : "w-1.5 bg-[var(--color-line-strong)]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stepper Chevrons */}
        {totalPosts > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
              title="Previous perspective"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalPosts - 1}
              className="p-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
              title="Next perspective"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pillar & Schedule Preview */}
      <div className="flex items-center justify-between text-xs">
        {currentPost.target_pillar ? (
          <span className="font-sans tabular-nums text-[10.5px] text-[var(--color-ink-secondary)]">
            Pillar: <span className="text-[var(--color-ink)] font-medium">{currentPost.target_pillar}</span>
          </span>
        ) : (
          <span className="font-sans tabular-nums text-[10px] text-[var(--color-ink-tertiary)]">Thought Leadership</span>
        )}

        <div className="flex items-center gap-1 font-sans tabular-nums text-[10.5px] text-[var(--color-warn-text)]">
          <Clock className="h-3 w-3" />
          <span>Awaiting Your Sign-Off</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="font-display text-lg font-normal tracking-tight text-[var(--color-ink)] leading-snug">
        {currentPost.title}
      </h1>

      {/* Prior Revision Context (Editorial Hairline Inset — eliminates founder amnesia on re-review) */}
      {currentPost.last_client_feedback && (() => {
        const { tags, note } = parseFeedbackComment(currentPost.last_client_feedback);
        return (
          <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1.5 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
              <span className="font-semibold text-[var(--color-accent-text)]">
                Updated following your note
              </span>
              <div className="flex items-center gap-2.5">
                {currentPost.last_client_feedback_at && (
                  <span className="text-[var(--color-ink-muted)]">
                    {formatDisplayDateIST(currentPost.last_client_feedback_at)}
                  </span>
                )}
                {currentPost.previous_body_markdown && (
                  <button
                    type="button"
                    onClick={() =>
                      setViewMode((prev) => (prev === "diff" ? "linkedin" : "diff"))
                    }
                    className="text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-accent-text)] cursor-pointer font-medium"
                  >
                    {viewMode === "diff" ? "Back to LinkedIn view" : "See what changed"}
                  </button>
                )}
              </div>
            </div>
            {tags.length > 0 && (
              <p className="text-xs font-medium text-[var(--color-ink)]">
                {tags.join(" · ")}
              </p>
            )}
            {note && (
              <p className="font-serif italic text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                &ldquo;{note}&rdquo;
              </p>
            )}
          </div>
        );
      })()}

      {/* LinkedIn Native Feed Preview OR Visual Diff */}
      {viewMode === "diff" && currentPost.previous_body_markdown ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-sans text-[var(--color-ink-secondary)]">
            <span className="font-medium">
              Comparing v{currentPost.previous_version_number || 1} &rarr; v{currentPost.version_number || 2}
            </span>
            <button
              type="button"
              onClick={() => setViewMode("linkedin")}
              className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
            >
              Return to LinkedIn Preview
            </button>
          </div>
          <ContentDiffView
            oldBody={currentPost.previous_body_markdown}
            newBody={currentPost.body_markdown}
            oldLabel={`v${currentPost.previous_version_number || 1}`}
            newLabel={`v${currentPost.version_number || 2}`}
            compact={true}
          />
        </div>
      ) : (
        <LinkedInFeedCard
          authorName={founderName}
          authorTitle={`${founderTitle} at ${clientName}`}
          authorAvatarSeed={founderName || clientName || "Founder"}
          linkedinUrl={linkedinUrl || undefined}
          bodyMarkdown={currentPost.body_markdown}
          statusLabel="Preview"
          showModeToggle={true}
          initialMode="mobile"
          showDiagnostics={false}
          showActionButtons={true}
        />
      )}

      {/* Inline Revision Request Drawer */}
      {showFeedbackDrawer && (
        <ReviewFeedbackDrawer
          selectedChips={selectedChips}
          commentText={commentText}
          isPending={isPending}
          onToggleChip={onToggleChip}
          onCommentChange={onCommentChange}
          onCancel={() => setShowFeedbackDrawer(false)}
          onSubmit={onSubmitFeedback}
        />
      )}
    </>
  );
}
