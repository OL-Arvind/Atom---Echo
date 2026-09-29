"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import {
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  approvePostByClientAction,
  requestContentChangesByClientAction,
} from "@/lib/actions/content";
import {
  revealClientCredentialByTokenAction,
  copyClientCredentialByTokenAction,
} from "@/lib/actions/credentials";
import { AtomEchoLogo } from "@/components/ui/logo";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import type {
  ReviewSharedCredential,
  ReviewPostItem,
  ReviewPortalClientProps,
} from "@/components/review/types";
import { ReviewEmptyState } from "@/components/review/review-empty-state";
import { ReviewArchiveTab } from "@/components/review/review-archive-tab";
import { ReviewVaultTab } from "@/components/review/review-vault-tab";
import { ReviewPostView } from "@/components/review/review-post-view";
import { ReviewBottomBar } from "@/components/review/review-bottom-bar";

export type { ReviewSharedCredential, ReviewPostItem, ReviewPortalClientProps };

export function ReviewPortalClient({
  clientName,
  founderName,
  founderTitle = "Founder & CEO",
  linkedinUrl,
  initialPendingPosts,
  initialApprovedPosts,
  publishedPosts = [],
  sharedCredentials = [],
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

  const [activeTab, setActiveTab] = useState<"queue" | "archive" | "vault">("queue");
  const [pendingQueue, setPendingQueue] = useState<ReviewPostItem[]>(defaultPending);
  const [approvedArchive, setApprovedArchive] = useState<ReviewPostItem[]>(
    initialApprovedPosts || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // Vault credentials state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto-wipe countdown ticker (30s timer per revealed credential)
  useEffect(() => {
    const hasActiveTimers = Object.values(countdownTimers).some((t) => t > 0);
    if (!hasActiveTimers) return;

    const interval = setInterval(() => {
      setCountdownTimers((prev) => {
        const next: Record<string, number> = {};
        for (const [id, count] of Object.entries(prev)) {
          if (count > 1) {
            next[id] = count - 1;
          } else {
            // Timer expired: clear password from state
            setRevealedPasswords((p) => {
              const { [id]: _, ...rest } = p;
              return rest;
            });
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownTimers]);

  const [isPending, startTransition] = useTransition();
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"linkedin" | "diff">("linkedin");

  const handleCopyUsername = async (cred: ReviewSharedCredential) => {
    try {
      await navigator.clipboard.writeText(cred.username_or_email);
      setCopiedField(`user-${cred.id}`);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(20);
        } catch {}
      }
      setTimeout(() => {
        setCopiedField((prev) => (prev === `user-${cred.id}` ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard write error
    }
  };

  const handleCopyPassword = async (credId: string) => {
    try {
      const res = await copyClientCredentialByTokenAction(credId, token);
      if (res.success && res.password) {
        await navigator.clipboard.writeText(res.password);
        setCopiedField(`pass-${credId}`);
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(20);
          } catch {}
        }
        setTimeout(() => {
          setCopiedField((prev) => (prev === `pass-${credId}` ? null : prev));
        }, 2000);
      } else {
        setError(res.error || "Failed to copy password");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to copy password to clipboard");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRevealPassword = async (credId: string) => {
    if (revealedPasswords[credId]) {
      // Hide immediately
      setRevealedPasswords((prev) => {
        const { [credId]: _, ...rest } = prev;
        return rest;
      });
      setCountdownTimers((prev) => {
        const { [credId]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      const res = await revealClientCredentialByTokenAction(credId, token);
      if (res.success && res.password) {
        setRevealedPasswords((prev) => ({ ...prev, [credId]: res.password! }));
        setCountdownTimers((prev) => ({ ...prev, [credId]: 30 }));
      } else {
        setError(res.error || "Failed to reveal password");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to decrypt password");
      setTimeout(() => setError(null), 3000);
    }
  };

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
      setViewMode("linkedin");
      setShowFeedbackDrawer(false);
      setSelectedChips([]);
      setCommentText("");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsExpanded(false);
      setViewMode("linkedin");
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
        setRevisionFeedback("Notes received. Sudeesh and the editorial team are refining the draft.");
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
              <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
                Private Founder Desk
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {founderName} &middot; {clientName}
              </span>
            </div>
          </div>

          {activeTab === "vault" ? (
            <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span>Vault</span>
            </div>
          ) : activeTab === "queue" && currentPost?.previous_body_markdown ? (
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
                  LinkedIn View
                </button>
                <button
                  onClick={() => setViewMode("diff")}
                  className={`rounded-[var(--radius-xs)] px-2 py-0.5 transition-colors cursor-pointer ${
                    viewMode === "diff"
                      ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                      : "text-[var(--color-ink-tertiary)]"
                  }`}
                >
                  What Changed
                </button>
              </div>
            </div>
          ) : activeTab === "queue" && currentPost ? (
            <span className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)]">
              v{currentPost.version_number || 1}
            </span>
          ) : null}
        </div>

        {/* Tab Navigation: Sign-Off vs Approved vs Vault */}
        <div className="flex border-t border-[var(--color-line-subtle)] px-2 bg-[var(--color-base-subtle)]/50">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === "queue"
                ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
            }`}
          >
            Sign-Off {pendingQueue.length > 0 ? `(${pendingQueue.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === "archive"
                ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
            }`}
          >
            Approved {approvedArchive.length > 0 ? `(${approvedArchive.length})` : ""}
          </button>
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex-1 py-2 text-xs font-medium border-b-2 text-center transition-colors cursor-pointer ${
              activeTab === "vault"
                ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
            }`}
          >
            Vault {sharedCredentials.length > 0 ? `(${sharedCredentials.length})` : ""}
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
            <ReviewEmptyState
              founderName={founderName}
              approvedArchive={approvedArchive}
              onViewArchive={() => setActiveTab("archive")}
            />
          ) : currentPost ? (
            <ReviewPostView
              currentPost={currentPost}
              currentIndex={currentIndex}
              totalPosts={pendingQueue.length}
              founderName={founderName}
              founderTitle={founderTitle}
              clientName={clientName}
              linkedinUrl={linkedinUrl}
              viewMode={viewMode}
              setViewMode={setViewMode}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              showFeedbackDrawer={showFeedbackDrawer}
              setShowFeedbackDrawer={setShowFeedbackDrawer}
              selectedChips={selectedChips}
              commentText={commentText}
              isPending={isPending}
              onPrev={handlePrev}
              onNext={handleNext}
              onToggleChip={toggleChip}
              onCommentChange={setCommentText}
              onSubmitFeedback={handleSendFeedback}
            />
          ) : null}
        </main>
      )}

      {/* TAB 2: ARCHIVE OF APPROVED & SCHEDULED POSTS */}
      {activeTab === "archive" && (
        <ReviewArchiveTab
          approvedArchive={approvedArchive}
          publishedPosts={publishedPosts}
          pendingCount={pendingQueue.length}
          onGoToQueue={() => setActiveTab("queue")}
        />
      )}

      {/* TAB 3: FOUNDER ACCESS VAULT (SHARED CREDENTIALS) */}
      {activeTab === "vault" && (
        <ReviewVaultTab
          sharedCredentials={sharedCredentials}
          revealedPasswords={revealedPasswords}
          countdownTimers={countdownTimers}
          copiedField={copiedField}
          onCopyUsername={handleCopyUsername}
          onRevealPassword={handleRevealPassword}
          onCopyPassword={handleCopyPassword}
        />
      )}

      {/* Floating Bottom Action Bar (Only visible when in review queue and posts remain) */}
      {activeTab === "queue" && pendingQueue.length > 0 && currentPost && (
        <ReviewBottomBar
          isPending={isPending}
          onToggleFeedback={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
          onApprove={handleApprove}
        />
      )}
    </div>
  );
}
