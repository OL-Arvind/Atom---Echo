"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
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
  ArrowUpRight,
  Check,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Key,
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { formatDisplayDateTimeIST, formatDisplayDateIST } from "@/lib/date-utils";
import { parseFeedbackComment } from "@/lib/feedback-utils";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import type { ClientCredential } from "@/types/domain";

export interface ReviewSharedCredential {
  id: string;
  platform: string;
  username_or_email: string;
  two_factor_method?: string | null;
  notes?: string | null;
  access_scope?: string;
  created_at?: string;
}

function isMeaningful(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return !["na", "n/a", "none", "-", "null", "undefined"].includes(lower);
}

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
  last_client_feedback?: string | null;
  last_client_feedback_at?: string | null;
}

interface ReviewPortalClientProps {
  clientName: string;
  founderName: string;
  founderTitle?: string;
  linkedinUrl?: string;
  initialPendingPosts: ReviewPostItem[];
  initialApprovedPosts: ReviewPostItem[];
  publishedPosts?: ReviewPostItem[];
  sharedCredentials?: ReviewSharedCredential[];
  token: string;
  // Backward compatibility in case single post is passed
  post?: ReviewPostItem;
}

const FEEDBACK_CHIPS = [
  "Make it punchier",
  "Sharpen hook",
  "Tone it down",
  "Update metric",
  "Add more grit",
  "Keep the edge",
];

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
  const [viewMode, setViewMode] = useState<"linkedin" | "editorial">("linkedin");

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

          {activeTab !== "vault" ? (
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
          ) : (
            <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span>Vault</span>
            </div>
          )}
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
            /* ALL CAUGHT UP CELEBRATORY SCREEN */
            <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 text-center shadow-dialog space-y-4 animate-in">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)] font-medium text-base">
                <CheckCircle2 className="h-7 w-7 text-[var(--color-ok)]" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
                  Every Edge Approved
                </h1>
                <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                  Nothing waiting for your sign-off, <span className="font-medium text-[var(--color-ink)]">{founderName}</span>. You approve every word before it carries your name.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3.5 text-left text-xs space-y-2">
                <span className="font-sans tabular-nums text-[10px] uppercase text-[var(--color-ink-tertiary)] block font-medium">
                  Current Status:
                </span>
                <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
                  <span>Approved &amp; Locked Perspectives</span>
                  <span className="font-sans tabular-nums font-medium text-[var(--color-ink)]">
                    {approvedArchive.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-[var(--color-ink-secondary)]">
                  <span>Next LinkedIn Release</span>
                  <span className="font-sans tabular-nums text-[var(--color-ok)]">Active</span>
                </div>
              </div>

              {approvedArchive.length > 0 && (
                <button
                  onClick={() => setActiveTab("archive")}
                  className="btn btn-secondary w-full py-2.5 text-xs cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>View Publishing Schedule ({approvedArchive.length})</span>
                </button>
              )}

              <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                Atom &amp; Echo &middot; Personal Branding for the Unapologetically Ambitious
              </div>
            </div>
          ) : currentPost ? (
            /* ACTIVE POST IN BATCH QUEUE */
            <>
              {/* Batch Queue Stepper Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-accent-text)] font-semibold">
                    PERSPECTIVE {currentIndex + 1} OF {pendingQueue.length}
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
                      title="Previous perspective"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === pendingQueue.length - 1}
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
                      {currentPost.last_client_feedback_at && (
                        <span className="text-[var(--color-ink-muted)]">
                          {formatDisplayDateIST(currentPost.last_client_feedback_at)}
                        </span>
                      )}
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

              {/* VIEW 1: REALISTIC LINKEDIN FEED PREVIEW */}
              {viewMode === "linkedin" && (
                <LinkedInFeedCard
                  authorName={founderName}
                  authorTitle={`${founderTitle} at ${clientName}`}
                  authorAvatarSeed={founderName || clientName || "Founder"}
                  linkedinUrl={linkedinUrl || undefined}
                  bodyMarkdown={currentPost.body_markdown}
                  statusLabel={
                    currentPost.scheduled_publish_date
                      ? `Slot: ${formatDisplayDateIST(currentPost.scheduled_publish_date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}`
                      : "Proposed slot: Next available"
                  }
                  showModeToggle={true}
                  initialMode="mobile"
                  showDiagnostics={false}
                />
              )}

              {/* VIEW 2: EDITORIAL READING VIEW */}
              {viewMode === "editorial" && (
                <div className="card p-5 space-y-4">
                  <div className="border-b border-[var(--color-line-subtle)] pb-2 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
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
                      Refine Edge & Feedback
                    </span>
                    <button
                      onClick={() => setShowFeedbackDrawer(false)}
                      className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer font-sans tabular-nums"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block">
                      Quick tone direction:
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
                                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)] font-semibold"
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
                    <span className="text-[11px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block">
                      Founder Notes & Direction:
                    </span>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What would you like sharpened? (e.g. stronger angle, tone nuance, specific story details)..."
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
                      <span>{isPending ? "Sending..." : "Send to Editorial Team"}</span>
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
            <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
              Locked Publishing Calendar
            </span>
            <span className="text-xs font-sans tabular-nums text-[var(--color-ok)]">
              {approvedArchive.length} Locked
            </span>
          </div>

          {approvedArchive.length === 0 && publishedPosts.length === 0 ? (
            <div className="card p-6 text-center text-xs text-[var(--color-ink-secondary)] space-y-2">
              <Calendar className="h-6 w-6 mx-auto text-[var(--color-ink-tertiary)]" />
              <p>No perspectives locked or scheduled yet.</p>
              {pendingQueue.length > 0 && (
                <button
                  onClick={() => setActiveTab("queue")}
                  className="btn btn-secondary text-xs mt-2"
                >
                  Review Pending Perspectives ({pendingQueue.length})
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
                    <span className="inline-flex items-center gap-1.5 font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
                      Scheduled
                    </span>
                    {item.scheduled_publish_date && (
                      <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] flex items-center gap-1">
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
                    <div className="pt-1 text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
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
                    <span className="inline-flex items-center gap-1.5 font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
                      Published
                    </span>
                    {item.published_at && (
                      <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
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
                      <span>Live on LinkedIn ↗</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* TAB 3: FOUNDER ACCESS VAULT (SHARED CREDENTIALS) */}
      {activeTab === "vault" && (
        <main className="mx-auto max-w-md px-3.5 pt-3 space-y-3.5">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--color-line-subtle)]">
            <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
              Shared Credential Vault
            </span>
            <span className="text-xs font-sans tabular-nums text-[var(--color-ink-secondary)]">
              {sharedCredentials.length} {sharedCredentials.length === 1 ? "Account" : "Accounts"}
            </span>
          </div>

          {sharedCredentials.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-secondary)]">
                <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xs font-semibold text-[var(--color-ink)]">
                  No Shared Logins
                </h2>
                <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
                  Logins provisioned for your team will appear here for 1-tap access.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedCredentials.map((cred) => {
                const isRevealed = !!revealedPasswords[cred.id];
                const countdown = countdownTimers[cred.id] ?? 0;
                const isCopiedUser = copiedField === `user-${cred.id}`;
                const isCopiedPass = copiedField === `pass-${cred.id}`;

                return (
                  <div
                    key={cred.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3 shadow-sm"
                  >
                    {/* Header: Platform & Shared Dot */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BrandLogo
                          nameOrDomain={cred.platform}
                          size={28}
                          className="rounded-md object-contain shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[var(--color-ink)] block truncate">
                            {cred.platform}
                          </span>
                          <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                            Shared Access
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                        <span>Ready</span>
                      </div>
                    </div>

                    {/* Username Field */}
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                        Login / Username
                      </span>
                      <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between gap-2">
                        <span className="font-sans tabular-nums text-xs text-[var(--color-ink)] font-medium truncate select-all">
                          {cred.username_or_email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUsername(cred)}
                          className="btn btn-secondary text-xs h-7 px-2.5 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                          title="Copy username"
                        >
                          {isCopiedUser ? (
                            <>
                              <Check className="h-3 w-3 text-[var(--color-ok)]" />
                              <span className="text-[10px] font-medium text-[var(--color-ok)]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                          {isRevealed ? (
                            <span className="text-[var(--color-accent)] font-medium">
                              Auto-wipes in {countdown}s
                            </span>
                          ) : (
                            "Encrypted Password"
                          )}
                        </span>
                      </div>
                      <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between gap-2">
                        <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)] tracking-wider truncate select-all">
                          {isRevealed ? revealedPasswords[cred.id] : "••••••••••••••••"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRevealPassword(cred.id)}
                            className="btn btn-secondary text-xs h-7 px-2 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                            title={isRevealed ? "Hide" : "Reveal (30s)"}
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff className="h-3 w-3 text-[var(--color-accent)]" />
                                <span className="text-[10px]">Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                                <span className="text-[10px]">Reveal</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(cred.id)}
                            className="btn btn-secondary text-xs h-7 px-2 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                            title="Copy password"
                          >
                            {isCopiedPass ? (
                              <>
                                <Check className="h-3 w-3 text-[var(--color-ok)]" />
                                <span className="text-[10px] font-medium text-[var(--color-ok)]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2FA Method if meaningful */}
                    {isMeaningful(cred.two_factor_method) && (
                      <div className="border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5 text-[11px] text-[var(--color-ink-secondary)] font-sans tabular-nums">
                        <span className="font-medium text-[var(--color-ink)]">2FA:</span>{" "}
                        {cred.two_factor_method}
                      </div>
                    )}

                    {/* Notes if meaningful */}
                    {isMeaningful(cred.notes) && (
                      <div className="border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5 text-[11px] text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-wrap">
                        {cred.notes}
                      </div>
                    )}
                  </div>
                );
              })}
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
              <span>Refine Edge / Notes</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="btn btn-accent flex-[1.4] h-11 text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{isPending ? "Locking..." : "Approve for Publishing ↗"}</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
