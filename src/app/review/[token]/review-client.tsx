"use client";

import { useState, useTransition, useMemo } from "react";
import {
  CheckCircle2,
  MessageSquare,
  Send,
  ShieldCheck,
  ThumbsUp,
  AlertCircle,
  Clock,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Check,
  Sparkles,
} from "lucide-react";
import {
  approvePostByClientAction,
  requestContentChangesByClientAction,
} from "@/lib/actions/content";
import { AtomEchoLogo } from "@/components/ui/logo";
import { formatDisplayDateTimeIST, formatDisplayDateIST } from "@/lib/date-utils";

export interface ReviewPostItem {
  id: string;
  title: string;
  body_markdown: string;
  target_pillar?: string;
  scheduled_publish_date?: string;
  published_at?: string;
  linkedin_post_url?: string;
  created_at: string;
  status?: string;
}

interface ReviewPortalClientProps {
  clientName: string;
  founderName: string;
  founderTitle?: string;
  linkedinUrl?: string;
  initialPendingPosts: ReviewPostItem[];
  initialApprovedPosts: ReviewPostItem[];
  publishedPosts?: ReviewPostItem[];
  token: string;
  // Backward compatibility in case single post is passed
  post?: ReviewPostItem;
}

const FEEDBACK_CHIPS = [
  "Too casual",
  "Change hook",
  "Weaken claim",
  "Update metric",
  "Shorten post",
  "Needs more data",
];

export function ReviewPortalClient({
  clientName,
  founderName,
  founderTitle = "Founder & CEO",
  linkedinUrl,
  initialPendingPosts,
  initialApprovedPosts,
  publishedPosts = [],
  token,
  post,
}: ReviewPortalClientProps) {
  // Normalize pending posts: if single post was passed, fallback to it
  const defaultPending = useMemo(() => {
    if (initialPendingPosts && initialPendingPosts.length > 0) {
      return initialPendingPosts;
    }
    if (post) {
      return [post];
    }
    return [];
  }, [initialPendingPosts, post]);

  const [activeTab, setActiveTab] = useState<"queue" | "archive">("queue");
  const [pendingQueue, setPendingQueue] = useState<ReviewPostItem[]>(defaultPending);
  const [approvedArchive, setApprovedArchive] = useState<ReviewPostItem[]>(
    initialApprovedPosts || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"linkedin" | "editorial">("linkedin");

  const initials = founderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentPost = pendingQueue[currentIndex] || null;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleNext = () => {
    if (currentIndex < pendingQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsExpanded(false);
      setShowFeedbackDrawer(false);
      setSelectedChips([]);
      setCommentText("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsExpanded(false);
      setShowFeedbackDrawer(false);
      setSelectedChips([]);
      setCommentText("");
    }
  };

  // 1-Tap Approval Flow (AC-2)
  const handleApprove = () => {
    if (!currentPost) return;
    setError(null);

    // Haptic feedback trigger for supported mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([20, 50, 20]);
      } catch {
        // Ignore haptic errors on unsupported hardware
      }
    }

    startTransition(async () => {
      const postId = currentPost.id;
      const res = await approvePostByClientAction(postId, token);

      if (res.success) {
        const scheduledFormatted = res.scheduledDate
          ? formatDisplayDateTimeIST(res.scheduledDate, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "Next available slot";

        setApprovalFeedback(`Approved! Locked for ${scheduledFormatted}`);

        // Update state: move from pendingQueue to approvedArchive
        const updatedPending = pendingQueue.filter((p) => p.id !== postId);
        const approvedItem: ReviewPostItem = {
          ...currentPost,
          status: "scheduled",
          scheduled_publish_date: res.scheduledDate,
        };

        setApprovedArchive((prev) => [approvedItem, ...prev]);
        setPendingQueue(updatedPending);

        // Adjust index if we were at the end of the queue
        if (currentIndex >= updatedPending.length && updatedPending.length > 0) {
          setCurrentIndex(updatedPending.length - 1);
        }
        setIsExpanded(false);

        setTimeout(() => {
          setApprovalFeedback(null);
        }, 4000);
      } else {
        setError(res.error || "Failed to approve post. Please try again.");
      }
    });
  };

  // Revision Request Flow (AC-2)
  const handleSendFeedback = () => {
    if (!currentPost) return;
    if (selectedChips.length === 0 && !commentText.trim()) return;

    setError(null);
    startTransition(async () => {
      const postId = currentPost.id;
      const res = await requestContentChangesByClientAction(
        postId,
        token,
        commentText,
        selectedChips
      );

      if (res.success) {
        setRevisionFeedback("Feedback submitted! Sudeesh & the team are revising this draft.");
        setShowFeedbackDrawer(false);
        setSelectedChips([]);
        setCommentText("");

        // Remove from review queue as it moved back to draft
        const updatedPending = pendingQueue.filter((p) => p.id !== postId);
        setPendingQueue(updatedPending);

        if (currentIndex >= updatedPending.length && updatedPending.length > 0) {
          setCurrentIndex(updatedPending.length - 1);
        }
        setIsExpanded(false);

        setTimeout(() => {
          setRevisionFeedback(null);
        }, 4000);
      } else {
        setError(res.error || "Failed to submit feedback. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--color-base)] text-[var(--color-ink)] pb-[calc(6rem+env(safe-area-inset-bottom))] select-none">
      {/* Sticky Mobile App Bar */}
      <header className="sticky top-0 z-30 flex flex-col border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <AtomEchoLogo size={28} showText={false} />
            <div className="leading-tight">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
                Founder Portal
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {clientName} &middot; {founderName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5 text-[10.5px]">
              <button
                onClick={() => setViewMode("linkedin")}
                className={`rounded-[var(--radius-xs)] px-2 py-0.5 transition-colors cursor-pointer ${
                  viewMode === "linkedin"
                    ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                    : "text-[var(--color-ink-tertiary)]"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setViewMode("editorial")}
                className={`rounded-[var(--radius-xs)] px-2 py-0.5 transition-colors cursor-pointer ${
                  viewMode === "editorial"
                    ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                    : "text-[var(--color-ink-tertiary)]"
                }`}
              >
                Text
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Queue vs Archive */}
        <div className="flex border-t border-[var(--color-line-subtle)] px-4 bg-[var(--color-base-subtle)]/50">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === "queue"
                ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
            }`}
          >
            Pending Review {pendingQueue.length > 0 ? `(${pendingQueue.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === "archive"
                ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
            }`}
          >
            Approved &amp; Scheduled {approvedArchive.length > 0 ? `(${approvedArchive.length})` : ""}
          </button>
        </div>
      </header>

      {/* Temporary Feedback / Alert Banners */}
      <div className="mx-auto max-w-md px-3.5 pt-3 space-y-2">
        {approvalFeedback && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-ok-line)] bg-[var(--color-ok-bg)] p-3 text-xs text-[var(--color-ok-text)] animate-in">
            <Check className="h-4 w-4 shrink-0 text-[var(--color-ok)]" />
            <span>{approvalFeedback}</span>
          </div>
        )}

        {revisionFeedback && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-accent-line)] bg-[var(--color-accent-bg)] p-3 text-xs text-[var(--color-accent-text)] animate-in">
            <MessageSquare className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
            <span>{revisionFeedback}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* TAB 1: PENDING REVIEW QUEUE */}
      {activeTab === "queue" && (
        <main className="mx-auto max-w-md px-3.5 pt-3 space-y-3.5">
          {pendingQueue.length === 0 ? (
            /* ALL CAUGHT UP CELEBRATORY SCREEN */
            <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 text-center shadow-dialog space-y-4 animate-in">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)] font-medium text-base">
                <CheckCircle2 className="h-7 w-7 text-[var(--color-ok)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
                  All Caught Up!
                </h1>
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                  Thank you, <span className="font-medium text-[var(--color-ink)]">{founderName}</span>. There are no pending posts waiting for your review.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3.5 text-left text-xs space-y-2">
                <span className="font-mono text-[10px] uppercase text-[var(--color-ink-tertiary)] block font-medium">
                  Current Status:
                </span>
                <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
                  <span>Approved &amp; Scheduled posts</span>
                  <span className="font-mono font-medium text-[var(--color-ink)]">
                    {approvedArchive.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
                  <span>Next publishing window</span>
                  <span className="font-mono text-[var(--color-ok)]">Active</span>
                </div>
              </div>

              {approvedArchive.length > 0 && (
                <button
                  onClick={() => setActiveTab("archive")}
                  className="btn btn-secondary w-full py-2.5 text-xs cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>View Scheduled Posts ({approvedArchive.length})</span>
                </button>
              )}

              <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-mono">
                Atom &amp; Echo &middot; Verified Zero-Login
              </div>
            </div>
          ) : currentPost ? (
            /* ACTIVE POST IN BATCH QUEUE */
            <>
              {/* Batch Queue Stepper Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--color-accent-text)] font-semibold">
                    POST {currentIndex + 1} OF {pendingQueue.length}
                  </span>
                  {/* Step dots */}
                  {pendingQueue.length > 1 && (
                    <div className="flex items-center gap-1">
                      {pendingQueue.map((_, i) => (
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
                {pendingQueue.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      className="p-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
                      title="Previous post"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === pendingQueue.length - 1}
                      className="p-1 rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 cursor-pointer"
                      title="Next post"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Pillar & Schedule Preview */}
              <div className="flex items-center justify-between text-xs">
                {currentPost.target_pillar ? (
                  <span className="font-mono text-[10.5px] text-[var(--color-ink-secondary)]">
                    Pillar: <span className="text-[var(--color-ink)] font-medium">{currentPost.target_pillar}</span>
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[var(--color-ink-tertiary)]">Thought Leadership</span>
                )}

                <div className="flex items-center gap-1 font-mono text-[10.5px] text-[var(--color-warn-text)]">
                  <Clock className="h-3 w-3" />
                  <span>Awaiting Sign-off</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-display text-lg font-normal tracking-tight text-[var(--color-ink)] leading-snug">
                {currentPost.title}
              </h1>

              {/* VIEW 1: REALISTIC LINKEDIN CARD PREVIEW */}
              {viewMode === "linkedin" && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card overflow-hidden">
                  {/* LinkedIn Author Header */}
                  <div className="flex items-start justify-between p-3.5 border-b border-[var(--color-line-subtle)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink)]">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-[var(--color-ink)]">{founderName}</span>
                          <span className="text-[10px] text-[var(--color-ink-tertiary)]">&middot; 1st</span>
                        </div>
                        <p className="text-[10.5px] text-[var(--color-ink-secondary)] line-clamp-1 leading-tight">
                          {founderTitle} at {clientName}
                        </p>
                        <div className="flex items-center gap-1 text-[9.5px] text-[var(--color-ink-tertiary)] mt-0.5">
                          <span>
                            {currentPost.scheduled_publish_date
                              ? `Scheduled for ${formatDisplayDateIST(currentPost.scheduled_publish_date, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}`
                              : "Proposed slot: Next available"}
                          </span>
                          <span>&middot;</span>
                          <Globe className="h-2.5 w-2.5 text-[var(--color-ink-tertiary)]" />
                        </div>
                      </div>
                    </div>

                    <div className="text-[var(--color-ink-muted)] p-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>

                  {/* LinkedIn Post Body with fold (~210 chars cutoff) */}
                  <div className="p-4 space-y-2.5">
                    <div
                      className={`whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-ink)] font-sans transition-all ${
                        !isExpanded && currentPost.body_markdown.length > 210 ? "line-clamp-5" : ""
                      }`}
                    >
                      {currentPost.body_markdown}
                    </div>

                    {currentPost.body_markdown.length > 210 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-text)] flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <span>{isExpanded ? "Show less" : "...see more"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* LinkedIn Engagement Bar Preview */}
                  <div className="border-t border-[var(--color-line-subtle)] px-4 py-2.5 bg-[var(--color-base-subtle)]/70 flex items-center justify-between text-[11px] text-[var(--color-ink-tertiary)]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[var(--color-ink-secondary)]">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Like</span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--color-ink-secondary)]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Comment</span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--color-ink-secondary)]">
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Repost</span>
                      </div>
                    </div>
                    <Bookmark className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  </div>
                </div>
              )}

              {/* VIEW 2: EDITORIAL READING VIEW */}
              {viewMode === "editorial" && (
                <div className="card p-5 space-y-4">
                  <div className="border-b border-[var(--color-line-subtle)] pb-2 text-[11px] font-mono text-[var(--color-ink-tertiary)]">
                    Draft Body (Markdown)
                  </div>
                  <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--color-ink)] font-sans">
                    {currentPost.body_markdown}
                  </div>
                </div>
              )}

              {/* REVISION REQUEST DRAWER */}
              {showFeedbackDrawer && (
                <div className="card p-4.5 shadow-dialog space-y-3.5 bg-[var(--color-base-overlay)] border border-[var(--color-line-strong)] animate-in">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2">
                    <span className="font-display text-sm font-medium text-[var(--color-ink)]">
                      Request Changes
                    </span>
                    <button
                      onClick={() => setShowFeedbackDrawer(false)}
                      className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer font-mono"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[var(--color-ink-tertiary)] block">
                      Quick tone tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {FEEDBACK_CHIPS.map((chip) => {
                        const isSelected = selectedChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => toggleChip(chip)}
                            className={`rounded-[var(--radius-xs)] px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[var(--color-accent)] text-white font-medium"
                                : "bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] border border-[var(--color-line)] hover:bg-[var(--color-surface-active)]"
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-[var(--color-ink-tertiary)] block">
                      Your notes:
                    </span>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What would you like changed? (e.g. tone, wording, hook)..."
                      rows={3}
                      className="input text-xs resize-y w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackDrawer(false)}
                      className="btn btn-secondary flex-1 py-2 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendFeedback}
                      disabled={isPending || (selectedChips.length === 0 && !commentText.trim())}
                      className="btn btn-primary flex-1 py-2 text-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isPending ? "Sending..." : "Submit Feedback"}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      )}

      {/* TAB 2: ARCHIVE OF APPROVED & SCHEDULED POSTS */}
      {activeTab === "archive" && (
        <main className="mx-auto max-w-md px-3.5 pt-3 space-y-3.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--color-line-subtle)]">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
              Scheduled Calendar Archive
            </span>
            <span className="text-xs font-mono text-[var(--color-ok)]">
              {approvedArchive.length} Locked
            </span>
          </div>

          {approvedArchive.length === 0 && publishedPosts.length === 0 ? (
            <div className="card p-6 text-center text-xs text-[var(--color-ink-secondary)] space-y-2">
              <Calendar className="h-6 w-6 mx-auto text-[var(--color-ink-tertiary)]" />
              <p>No posts approved or scheduled yet.</p>
              {pendingQueue.length > 0 && (
                <button
                  onClick={() => setActiveTab("queue")}
                  className="btn btn-secondary text-xs mt-2"
                >
                  Review Pending Posts ({pendingQueue.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {approvedArchive.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10.5px] text-[var(--color-ok-text)] bg-[var(--color-ok-bg)] px-2 py-0.5 rounded border border-[var(--color-ok-line)] font-medium">
                      ✓ Scheduled
                    </span>
                    {item.scheduled_publish_date && (
                      <span className="text-[10.5px] font-mono text-[var(--color-ink-secondary)] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDisplayDateTimeIST(item.scheduled_publish_date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <h2 className="font-medium text-xs text-[var(--color-ink)] leading-snug">
                    {item.title}
                  </h2>

                  <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {item.body_markdown}
                  </p>

                  {item.target_pillar && (
                    <div className="pt-1 text-[10px] font-mono text-[var(--color-ink-tertiary)]">
                      Pillar: {item.target_pillar}
                    </div>
                  )}
                </div>
              ))}

              {publishedPosts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10.5px] text-[var(--color-ink-tertiary)] bg-[var(--color-base-subtle)] px-2 py-0.5 rounded border border-[var(--color-line)]">
                      Published
                    </span>
                    {item.published_at && (
                      <span className="text-[10px] font-mono text-[var(--color-ink-tertiary)]">
                        {formatDisplayDateIST(item.published_at, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <h2 className="font-medium text-xs text-[var(--color-ink)] leading-snug">
                    {item.title}
                  </h2>

                  {item.linkedin_post_url && (
                    <a
                      href={item.linkedin_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline pt-1"
                    >
                      <span>View live on LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Floating Bottom Action Bar (Only visible when in review queue and posts remain) */}
      {activeTab === "queue" && pendingQueue.length > 0 && currentPost && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 p-3.5 backdrop-blur-md pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
              disabled={isPending}
              className="btn btn-secondary flex-1 h-11 text-xs cursor-pointer active:scale-[0.98] transition-transform"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
              <span>Request Changes</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="btn flex-[1.4] h-11 text-xs bg-[var(--color-ok)] hover:bg-[var(--color-ok)]/90 text-white font-medium border border-[var(--color-ok-line)] shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{isPending ? "Approving..." : "Approve Post (1-Tap)"}</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
