"use client";

import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  CheckCircle2,
  BookOpen,
  Smartphone,
  Copy,
  ExternalLink,
  Check,
  Plus,
  ShieldAlert,
  Globe,
  Calendar,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { LinkedInFeedCard } from "@/components/content/linkedin-feed-card";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import {
  createContentAction,
  updateContentPostAction,
  sendForClientReviewAction,
  requestInternalRevisionAction,
} from "@/lib/actions/content";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
  toDatetimeLocalIST,
  parseDatetimeLocalIST,
  formatDisplayDateTimeIST,
} from "@/lib/date-utils";

export interface StudioClientOption {
  engagementId: string;
  serviceType: string;
  client: {
    id: string;
    name: string;
    founder_name: string;
    founder_title?: string;
    founder_email?: string;
    founder_phone?: string;
    linkedin_url?: string;
    website_url?: string;
  };
  context: any;
  knowledgeItems: any[];
  latestMeetings: any[];
  reviewToken: string | null;
}

interface ContentEditorClientProps {
  post?: any;
  context?: any;
  knowledgeItems?: any[];
  feedbackItems?: any[];
  reviewToken?: string | null;
  latestMeetings?: any[];
  isNew?: boolean;
  clientOptions?: StudioClientOption[];
  initialClientId?: string;
  initialMeetingId?: string;
  initialPrompt?: string;
}

const DEFAULT_PILLARS = [
  "Thought Leadership",
  "Founder Journey & Origin",
  "Engineering & Tech Contrarian",
  "Customer Case Study",
  "Hiring & Culture",
];

const PIPELINE_STEPS = [
  { id: "draft", label: "01 Draft" },
  { id: "internal_review", label: "02 Voice & QA" },
  { id: "client_review", label: "03 Founder Desk" },
  { id: "scheduled", label: "04 Scheduled" },
  { id: "published", label: "05 Published" },
] as const;

export function ContentEditorClient({
  post,
  context: initialContext,
  knowledgeItems: initialKnowledgeItems = [],
  feedbackItems: initialFeedbackItems = [],
  reviewToken: initialReviewToken = null,
  latestMeetings: initialMeetings = [],
  isNew = false,
  clientOptions = [],
  initialClientId,
  initialMeetingId,
  initialPrompt,
}: ContentEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Resolve initial client option when creating a new post
  const defaultClientOption = useMemo(() => {
    if (!isNew || clientOptions.length === 0) return null;
    if (initialClientId) {
      const matched = clientOptions.find((o) => o.client.id === initialClientId);
      if (matched) return matched;
    }
    return clientOptions[0];
  }, [isNew, clientOptions, initialClientId]);

  const [selectedEngagementId, setSelectedEngagementId] = useState<string>(
    post?.engagement_id || defaultClientOption?.engagementId || ""
  );

  const activeClientOption = useMemo(() => {
    if (!isNew) return null;
    return (
      clientOptions.find((o) => o.engagementId === selectedEngagementId) ||
      defaultClientOption
    );
  }, [isNew, clientOptions, selectedEngagementId, defaultClientOption]);

  // Resolved active client data (supports both existing post and new post creation)
  const client = isNew ? activeClientOption?.client : post?.engagements?.clients;
  const context = isNew ? activeClientOption?.context : initialContext;
  const knowledgeItems = isNew
    ? activeClientOption?.knowledgeItems || []
    : initialKnowledgeItems;
  const latestMeetings = isNew
    ? activeClientOption?.latestMeetings || []
    : initialMeetings;

  const [currentPostId, setCurrentPostId] = useState<string | null>(post?.id || null);
  const [activeReviewToken, setActiveReviewToken] = useState<string | null>(
    isNew ? activeClientOption?.reviewToken || null : initialReviewToken
  );
  const [feedbackList, setFeedbackList] = useState<any[]>(initialFeedbackItems);

  const pillars: string[] = useMemo(() => {
    return context?.core_pillars && context.core_pillars.length > 0
      ? context.core_pillars
      : DEFAULT_PILLARS;
  }, [context]);

  // Form states
  const [bodyMarkdown, setBodyMarkdown] = useState<string>(
    post?.body_markdown || initialPrompt || ""
  );
  const [targetPillar, setTargetPillar] = useState<string>(
    post?.target_pillar || pillars[0] || "Thought Leadership"
  );
  const [status, setStatus] = useState<string>(post?.status || "draft");
  const [scheduledDate, setScheduledDate] = useState<string>(
    post?.scheduled_publish_date
      ? toDatetimeLocalIST(post.scheduled_publish_date)
      : ""
  );
  const [linkedinPostUrl, setLinkedinPostUrl] = useState<string>(
    post?.linkedin_post_url || ""
  );

  // Right column tab state: default to meetings if initialMeetingId was passed, or context when starting a new blank draft
  const [activeRightTab, setActiveRightTab] = useState<"preview" | "context" | "meetings">(
    initialMeetingId
      ? "meetings"
      : isNew && !initialPrompt
      ? "context"
      : "preview"
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">(
    isNew ? "unsaved" : "saved"
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Internal QA Return-to-Draft drawer state
  const [showQaReturnInput, setShowQaReturnInput] = useState(false);
  const [qaReturnNote, setQaReturnNote] = useState("");

  // Sync pillar & token when switching client in New mode
  const handleClientSwitch = (newEngagementId: string) => {
    setSelectedEngagementId(newEngagementId);
    const matched = clientOptions.find((o) => o.engagementId === newEngagementId);
    if (matched) {
      const nextPillars =
        matched.context?.core_pillars?.length > 0
          ? matched.context.core_pillars
          : DEFAULT_PILLARS;
      setTargetPillar(nextPillars[0]);
      setActiveReviewToken(matched.reviewToken || null);
    }
  };

  const tabooWords: string[] = context?.taboo_words || [];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Derived title from hook (first non-empty line)
  const derivedTitle = useMemo(() => {
    const firstLine = bodyMarkdown
      .split("\n")
      .map((l) => l.trim())
      .find(Boolean)
      ?.slice(0, 80);
    return firstLine || post?.title || "Untitled Perspective";
  }, [bodyMarkdown, post?.title]);

  // Real-time metrics
  const charCount = bodyMarkdown.length;
  const wordCount = bodyMarkdown.trim() ? bodyMarkdown.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Real-time Taboo Word Linter
  const flaggedWords = useMemo(() => {
    const text = bodyMarkdown.toLowerCase();
    return tabooWords.filter((w) => {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const reg = new RegExp(`\\b${escaped}\\b`, "i");
      return reg.test(text);
    });
  }, [bodyMarkdown, tabooWords]);

  // Active unresolved feedback vs resolved history
  const unresolvedFeedback = useMemo(
    () => feedbackList.filter((fb) => !fb.is_resolved),
    [feedbackList]
  );
  const hasClientRevision = useMemo(
    () => feedbackList.some((fb) => fb.author_type === "client"),
    [feedbackList]
  );

  // Remove a detected taboo word
  const handleRemoveTabooWord = (word: string) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reg = new RegExp(`\\b${escaped}\\b`, "gi");
    setBodyMarkdown((prev: string) => prev.replace(reg, "").replace(/\s\s+/g, " "));
    setSaveState("unsaved");
    showToast(`Removed taboo word: "${word}"`);
  };

  // Insert context, story, or meeting takeaway into body
  const handleInsertSnippet = (snippet: string, label = "angle") => {
    setBodyMarkdown((prev: string) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
    });
    setSaveState("unsaved");
    showToast(`Inserted ${label} into draft`);
  };

  // Copy raw post body
  const handleCopyBody = async () => {
    if (!bodyMarkdown.trim()) return;
    try {
      await navigator.clipboard.writeText(bodyMarkdown);
      setCopiedBody(true);
      showToast("Post copy copied to clipboard");
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Snapshot ref to avoid redundant auto-saves
  const lastSavedSnapshot = useRef(
    JSON.stringify({
      bodyMarkdown: post?.body_markdown || "",
      targetPillar: post?.target_pillar || pillars[0] || "Thought Leadership",
      scheduledDate: post?.scheduled_publish_date
        ? toDatetimeLocalIST(post.scheduled_publish_date)
        : "",
    })
  );

  // Core save / create function
  const performSave = useCallback(
    async (newStatus?: string, options?: { silent?: boolean; copyReviewLinkOnSend?: boolean }) => {
      const statusToSave = newStatus || status;

      if (bodyMarkdown.trim().length < 10) {
        if (!options?.silent) {
          showToast("Write at least a short opening hook (10+ characters) first.");
        }
        return null;
      }

      setSaveState("saving");
      const formData = new FormData();
      formData.set("title", derivedTitle);
      formData.set("body_markdown", bodyMarkdown);
      formData.set("target_pillar", targetPillar);
      formData.set("status", statusToSave);
      if (scheduledDate) {
        formData.set("scheduled_publish_date", parseDatetimeLocalIST(scheduledDate));
      }

      // CASE A: Creating a brand-new post from /content/new
      if (!currentPostId) {
        if (!selectedEngagementId) {
          showToast("Select a founder account first.");
          setSaveState("unsaved");
          return null;
        }
        formData.set("engagement_id", selectedEngagementId);
        const res = await createContentAction(formData);
        if (res.success && res.post) {
          setCurrentPostId(res.post.id);
          setStatus(res.post.status || statusToSave);
          if (res.reviewToken) {
            setActiveReviewToken(res.reviewToken);
          }
          lastSavedSnapshot.current = JSON.stringify({
            bodyMarkdown,
            targetPillar,
            scheduledDate,
          });
          setSaveState("saved");

          if (statusToSave === "client_review" && (res.reviewToken || activeReviewToken)) {
            const tok = res.reviewToken || activeReviewToken;
            const fullUrl = `${window.location.origin}/review/${tok}`;
            try {
              await navigator.clipboard.writeText(fullUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2500);
              showToast("Sent to Founder Desk · Review link copied");
            } catch {
              showToast("Sent to Founder Desk");
            }
          } else if (!options?.silent) {
            showToast(
              statusToSave === "internal_review"
                ? "Submitted to Editorial Voice & QA"
                : "Perspective saved"
            );
          }

          router.replace(`/content/${res.post.id}`);
          return res;
        } else {
          setSaveState("unsaved");
          if (!options?.silent) showToast(res.error || "Failed to save draft.");
          return null;
        }
      }

      // CASE B: Updating an existing post
      const res = await updateContentPostAction(currentPostId, formData);
      if (res.success) {
        const finalStatus = res.post?.status || statusToSave;
        setStatus(finalStatus);
        if (res.reviewToken) {
          setActiveReviewToken(res.reviewToken);
        }
        if (["client_review", "internal_review", "approved", "scheduled", "published"].includes(finalStatus)) {
          setFeedbackList((prev) =>
            prev.map((fb) =>
              finalStatus === "internal_review" && fb.author_type !== "operator"
                ? fb
                : { ...fb, is_resolved: true }
            )
          );
        }
        lastSavedSnapshot.current = JSON.stringify({
          bodyMarkdown,
          targetPillar,
          scheduledDate,
        });
        setSaveState("saved");

        if (options?.copyReviewLinkOnSend && (res.reviewToken || activeReviewToken)) {
          const tok = res.reviewToken || activeReviewToken;
          const fullUrl = `${window.location.origin}/review/${tok}`;
          try {
            await navigator.clipboard.writeText(fullUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
            showToast("Dispatched to Founder Desk · Review link copied");
          } catch {
            showToast("Dispatched to Founder Desk");
          }
        } else if (!options?.silent) {
          if (newStatus === "internal_review") {
            showToast("Moved to Internal Voice & QA");
          } else if (newStatus === "approved" || finalStatus === "scheduled") {
            showToast("Approved & locked into publishing schedule");
          } else {
            showToast("Perspective saved");
          }
        }
        router.refresh();
        return res;
      } else {
        setSaveState("unsaved");
        if (!options?.silent) showToast(res.error || "Failed to save changes.");
        return null;
      }
    },
    [
      status,
      bodyMarkdown,
      derivedTitle,
      targetPillar,
      scheduledDate,
      currentPostId,
      selectedEngagementId,
      activeReviewToken,
      router,
      showToast,
    ]
  );

  // Debounced auto-save for existing posts after 2s of inactivity
  useEffect(() => {
    const currentSnap = JSON.stringify({
      bodyMarkdown,
      targetPillar,
      scheduledDate,
    });
    if (currentSnap === lastSavedSnapshot.current) {
      return;
    }
    setSaveState("unsaved");

    // Only auto-save once the post already exists in DB and has >= 15 chars
    if (!currentPostId || bodyMarkdown.trim().length < 15) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        await performSave(undefined, { silent: true });
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [bodyMarkdown, targetPillar, scheduledDate, currentPostId, performSave]);

  // Cmd+S / Ctrl+S keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        startTransition(async () => {
          await performSave();
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [performSave]);

  // Transition status handler
  const handleStatusTransition = (newStatus: string) => {
    if (newStatus === "published") {
      setShowPublishModal(true);
      return;
    }

    if (newStatus === "client_review" && flaggedWords.length > 0) {
      const confirmSend = window.confirm(
        `This draft still contains ${flaggedWords.length} taboo word(s): ${flaggedWords.join(
          ", "
        )}. Send to Founder Desk anyway?`
      );
      if (!confirmSend) return;
    }

    startTransition(async () => {
      await performSave(newStatus, {
        copyReviewLinkOnSend: newStatus === "client_review",
      });
    });
  };

  // Handle Internal QA return to draft
  const handleReturnToDraftWithQaNote = () => {
    if (!currentPostId || !qaReturnNote.trim()) return;
    startTransition(async () => {
      const res = await requestInternalRevisionAction(currentPostId, qaReturnNote);
      if (res.success) {
        setStatus("draft");
        setFeedbackList((prev) => [
          {
            id: `qa-${Date.now()}`,
            author_type: "operator",
            author_name: "Editorial QA",
            comment: qaReturnNote.trim(),
            is_resolved: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setQaReturnNote("");
        setShowQaReturnInput(false);
        showToast("Returned to Draft with QA note");
        router.refresh();
      } else {
        showToast(res.error || "Failed to return draft");
      }
    });
  };

  // Copy Founder Desk Review Link
  const handleCopyReviewLink = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (activeReviewToken) {
      const fullUrl = `${origin}/review/${activeReviewToken}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedLink(true);
        showToast("Founder Desk link copied");
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      } catch {
        // Fallback below
      }
    }

    const targetId = currentPostId || client?.id;
    if (!targetId) return;
    startTransition(async () => {
      const res = await sendForClientReviewAction(targetId, origin);
      if (res.success && res.token) {
        setActiveReviewToken(res.token);
        const fullUrl = `${origin}/review/${res.token}`;
        try {
          await navigator.clipboard.writeText(fullUrl);
          setCopiedLink(true);
          showToast("Generated & copied 7-day Founder Desk link");
          setTimeout(() => setCopiedLink(false), 2000);
        } catch {
          showToast("Generated Founder Desk link");
        }
      }
    });
  };

  // Open WhatsApp with full review link
  const openWhatsAppPing = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let tokenToUse = activeReviewToken;

    if (!tokenToUse) {
      const targetId = currentPostId || client?.id;
      if (!targetId) return;
      const res = await sendForClientReviewAction(targetId, origin);
      if (res.success && res.token) {
        tokenToUse = res.token;
        setActiveReviewToken(res.token);
        if (res.whatsappUrl) {
          window.open(res.whatsappUrl, "_blank");
          showToast("Opened WhatsApp with Founder Desk link");
          return;
        }
      } else {
        showToast(res.error || "Could not generate review link");
        return;
      }
    }

    const fullReviewUrl = `${origin}/review/${tokenToUse}`;
    const phone = client?.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    const message = encodeURIComponent(
      `Hi ${client?.founder_name || "there"}, "${derivedTitle}" is ready for your 1-tap review on your Founder Desk:\n${fullReviewUrl}`
    );
    const url = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Lifecycle Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--color-line-subtle)] pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Link
              href="/content"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Content Studio</span>
            </Link>
            <span className="text-[var(--color-line-strong)]">·</span>
            <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              {saveState === "saving"
                ? "Saving changes..."
                : saveState === "unsaved"
                ? "Unsaved edits (Cmd+S)"
                : "All changes saved"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              {isNew && !currentPostId ? "New Perspective" : "Perspective Studio"}
            </h1>
            <span className="text-[var(--color-ink-tertiary)]">·</span>
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {client?.name || "Select Account"}
            </span>
            {client?.founder_name && (
              <span className="text-xs text-[var(--color-ink-tertiary)] inline-flex items-center gap-1">
                ({client.founder_name})
                {client?.linkedin_url && (
                  <a
                    href={client.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-ink-tertiary)] hover:text-[#0A66C2] transition-colors ml-0.5 inline-flex items-center"
                    title={`Open ${client.founder_name}'s LinkedIn profile`}
                  >
                    <LinkedInIcon size={14} color="brand" />
                  </a>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Controls: Context-Aware Stage Progression */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Post Copy Utility */}
          {bodyMarkdown.trim().length > 0 && (
            <button
              type="button"
              onClick={handleCopyBody}
              className="btn btn-ghost text-xs border border-[var(--color-line)] cursor-pointer"
              title="Copy clean post text"
            >
              {copiedBody ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                  <span>Copied Text</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await performSave();
              })
            }
            disabled={isPending || bodyMarkdown.trim().length < 10}
            className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>{isPending && saveState === "saving" ? "Saving..." : "Save Draft"}</span>
          </button>

          {/* STAGE 1: DRAFT ACTIONS */}
          {status === "draft" && (
            <>
              {hasClientRevision ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition("internal_review")}
                    disabled={isPending || bodyMarkdown.trim().length < 10}
                    className="btn btn-secondary text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Send to QA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition("client_review")}
                    disabled={isPending || bodyMarkdown.trim().length < 10}
                    className="btn btn-accent text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Re-send to Founder Desk ↗</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition("internal_review")}
                    disabled={isPending || bodyMarkdown.trim().length < 10}
                    className="btn btn-primary text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Send to Editorial QA →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition("client_review")}
                    disabled={isPending || bodyMarkdown.trim().length < 10}
                    className="btn btn-secondary text-xs cursor-pointer disabled:opacity-50"
                    title="Skip internal QA and dispatch directly to Founder Desk"
                  >
                    <span>Send to Founder Desk ↗</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* STAGE 2: INTERNAL QA ACTIONS */}
          {status === "internal_review" && (
            <>
              {currentPostId && (
                <button
                  type="button"
                  onClick={() => setShowQaReturnInput((prev) => !prev)}
                  disabled={isPending}
                  className="btn btn-secondary text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Return to Draft</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStatusTransition("client_review")}
                disabled={isPending || bodyMarkdown.trim().length < 10}
                className="btn btn-accent text-xs cursor-pointer disabled:opacity-50"
              >
                <span>Approve QA · Send to Founder Desk ↗</span>
              </button>
            </>
          )}

          {/* STAGE 3: FOUNDER DESK (CLIENT REVIEW) ACTIONS */}
          {status === "client_review" && (
            <>
              <button
                type="button"
                onClick={handleCopyReviewLink}
                className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    <span>Copy Review Link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={openWhatsAppPing}
                className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <WhatsAppIcon size={13} className="text-[#25D366]" />
                <span>Ping Founder</span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusTransition("approved")}
                disabled={isPending}
                className="btn btn-primary text-xs cursor-pointer"
              >
                <span>Mark Approved →</span>
              </button>
            </>
          )}

          {/* STAGE 4: APPROVED ACTIONS */}
          {status === "approved" && (
            <button
              type="button"
              onClick={() => handleStatusTransition("scheduled")}
              disabled={isPending}
              className="btn btn-primary text-xs cursor-pointer"
            >
              <span>Lock Publishing Slot →</span>
            </button>
          )}

          {/* STAGE 5: SCHEDULED ACTIONS */}
          {status === "scheduled" && (
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              disabled={isPending}
              className="btn btn-accent text-xs cursor-pointer"
            >
              <span>Mark as Published ↗</span>
            </button>
          )}

          {/* STAGE 6: PUBLISHED */}
          {status === "published" &&
            (linkedinPostUrl ? (
              <a
                href={linkedinPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                <span>Live on LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="btn btn-secondary text-xs cursor-pointer"
              >
                <span>Add Live LinkedIn URL</span>
              </button>
            ))}
        </div>
      </div>

      {/* Interactive Lifecycle Stepper Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5">
          {PIPELINE_STEPS.map((step, idx) => {
            const normalizedStatus = status === "approved" ? "scheduled" : status;
            const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === normalizedStatus);
            const isActive = step.id === normalizedStatus;
            const isCompleted = currentIdx > idx;

            return (
              <div key={step.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!currentPostId && step.id !== "draft"}
                  onClick={() => {
                    if (step.id !== status && currentPostId) {
                      handleStatusTransition(step.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] text-[10.5px] font-sans tabular-nums uppercase tracking-wider transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-semibold border border-[var(--color-line-strong)]"
                      : isCompleted
                      ? "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
                  }`}
                  title={`Transition stage to ${step.label}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive
                        ? "bg-[var(--color-accent)]"
                        : isCompleted
                        ? "bg-[var(--color-ok)]"
                        : "bg-[var(--color-ink-ghost)]"
                    }`}
                  />
                  <span>{step.label}</span>
                </button>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <span className="text-[var(--color-line-strong)] text-xs select-none">/</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Taboo Guardrail Status Summary */}
        <div className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)] shrink-0">
          {flaggedWords.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
              <span>0 taboo terms ({tabooWords.length} guarded)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-danger-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
              <span>{flaggedWords.length} taboo term(s) flagged</span>
            </span>
          )}
        </div>
      </div>

      {/* Inline Internal QA Return Drawer (When Sudeesh clicks 'Return to Draft' in internal_review) */}
      {showQaReturnInput && (
        <div className="card p-4 border-l-2 border-l-[var(--color-warn)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-ink)]">
              Return to Writer with Internal QA Note
            </span>
            <button
              type="button"
              onClick={() => setShowQaReturnInput(false)}
              className="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={qaReturnNote}
              onChange={(e) => setQaReturnNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReturnToDraftWithQaNote()}
              placeholder="e.g. Hook is too generic — anchor it in the Q3 latency incident from their Story Vault..."
              className="input text-xs flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleReturnToDraftWithQaNote}
              disabled={isPending || !qaReturnNote.trim()}
              className="btn btn-primary text-xs shrink-0 cursor-pointer disabled:opacity-50"
            >
              <span>Send Back to Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Taboo Words Linter (Only expands when a forbidden word is actually detected) */}
      {flaggedWords.length > 0 && (
        <div className="border-l-2 border-[var(--color-danger)] pl-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[var(--color-base-subtle)]/40">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[var(--color-danger-text)] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--color-danger-text)]">
                Taboo Buzzwords Flagged ({flaggedWords.length}) &middot;{" "}
                <span className="text-[var(--color-ink-secondary)] font-normal">
                  Click any term to strip it from the draft:
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {flaggedWords.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => handleRemoveTabooWord(word)}
                    className="inline-flex items-center gap-1 font-sans tabular-nums text-[11px] text-[var(--color-danger-text)] border-b border-[var(--color-danger-line)] pb-0.5 hover:text-[var(--color-ink)] cursor-pointer"
                    title="Click to remove from draft"
                  >
                    <span>&ldquo;{word}&rdquo;</span>
                    <span>&times;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Authoring Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* PINNED ACTIVE REVISION NOTES (Founder or Internal QA) — Right Above the Editor */}
          {unresolvedFeedback.length > 0 && (
            <div className="card p-4 space-y-3 border-l-2 border-l-[var(--color-warn)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)]" />
                  <span>
                    {unresolvedFeedback[0].author_type === "operator"
                      ? `Internal QA Revision · ${unresolvedFeedback[0].author_name}`
                      : `Founder Revision Note · ${unresolvedFeedback[0].author_name}`}
                  </span>
                </div>
                <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                  {formatDisplayDateTimeIST(unresolvedFeedback[0].created_at, true)}
                </span>
              </div>

              <div className="space-y-2">
                {unresolvedFeedback.map((fb) => (
                  <p
                    key={fb.id}
                    className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 text-xs text-[var(--color-ink)] leading-relaxed"
                  >
                    {fb.comment}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line-subtle)] text-[11px] text-[var(--color-ink-tertiary)]">
                <span>
                  Revising and sending this post forward automatically resolves this note.
                </span>
                {status === "draft" && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusTransition(
                        unresolvedFeedback[0].author_type === "operator"
                          ? "internal_review"
                          : "client_review"
                      )
                    }
                    disabled={isPending}
                    className="btn btn-primary text-[11px] py-1 px-2.5 cursor-pointer shrink-0"
                  >
                    <span>
                      {unresolvedFeedback[0].author_type === "operator"
                        ? "Re-submit to QA →"
                        : "Re-send to Founder ↗"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card p-5 space-y-4">
            {/* Metadata Row: Client (if New), Editorial Pillar, Target Release Slot */}
            <div
              className={`grid grid-cols-1 ${
                isNew && !currentPostId ? "sm:grid-cols-3" : "sm:grid-cols-2"
              } gap-3`}
            >
              {isNew && !currentPostId && (
                <div>
                  <label className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                    Founder Account
                  </label>
                  <CustomSelect
                    options={clientOptions.map((o) => ({
                      value: o.engagementId,
                      label: o.client.name,
                      description: o.client.founder_name,
                      brandName: o.client.website_url || o.client.name,
                    }))}
                    value={selectedEngagementId}
                    onChange={handleClientSwitch}
                    placeholder="Select Founder Account"
                  />
                </div>
              )}

              <div>
                <label className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                  Editorial Pillar
                </label>
                <CustomSelect
                  options={pillars.map((p) => ({ value: p, label: p }))}
                  value={targetPillar}
                  onChange={setTargetPillar}
                  placeholder="Select Editorial Pillar"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                  Target Release Slot (IST)
                </label>
                <CustomDatePicker
                  value={scheduledDate}
                  onChange={setScheduledDate}
                  showTime
                  presetMode="future"
                  placeholder="Pick date & time"
                  allowClear
                />
              </div>
            </div>

            {/* Markdown Post Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                  Perspective Copy (First line becomes the hook &amp; label)
                </label>
                <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                  {readingTimeMin} min read
                </span>
              </div>
              <textarea
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                placeholder="Start with a sharp, contrarian opening hook (under 140 characters to beat the mobile fold)...&#10;&#10;Then ground it in a real founder story, decision, or metric from the Vault on the right."
                rows={17}
                autoFocus={isNew}
                className="input w-full font-sans text-[13.5px] leading-relaxed p-3.5 resize-y min-h-[380px]"
              />
            </div>

            {/* Metrics Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-line-subtle)] text-xs">
              <div className="flex items-center gap-4 font-sans tabular-nums text-[11.5px] text-[var(--color-ink-secondary)]">
                <span>
                  Words: <strong className="text-[var(--color-ink)]">{wordCount}</strong>
                </span>
                <span>
                  Characters: <strong className="text-[var(--color-ink)]">{charCount}</strong> / 3,000
                </span>
              </div>

              {/* LinkedIn Character Range Meter */}
              <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums">
                <span className="text-[var(--color-ink-tertiary)]">Sweet spot: 1,200–1,800 chars</span>
                <div className="w-24 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      charCount > 3000
                        ? "bg-[var(--color-danger)]"
                        : charCount >= 1200 && charCount <= 1800
                        ? "bg-[var(--color-ok)]"
                        : "bg-[var(--color-accent)]"
                    }`}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Past Resolved Revision History (if any) */}
          {feedbackList.filter((fb) => fb.is_resolved).length > 0 && (
            <div className="card p-4 space-y-2.5">
              <span className="text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
                Resolved Revision History
              </span>
              <div className="divide-y divide-[var(--color-line-subtle)]">
                {feedbackList
                  .filter((fb) => fb.is_resolved)
                  .map((fb) => (
                    <div key={fb.id} className="py-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                        <span>
                          {fb.author_name} ({fb.author_type === "operator" ? "Internal QA" : "Founder"})
                        </span>
                        <span>{formatDisplayDateTimeIST(fb.created_at, true)}</span>
                      </div>
                      <p className="border-l-2 border-[var(--color-line)] pl-3 py-0.5 text-[var(--color-ink-secondary)] leading-relaxed">
                        {fb.comment}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LinkedIn Simulator, Story Vault & Meeting Intel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 3-Tab Switcher: Preview | Story Vault | Meeting Intel */}
          <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5">
            <button
              type="button"
              onClick={() => setActiveRightTab("preview")}
              className={`flex-1 py-1.5 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRightTab === "preview"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>LinkedIn Fold</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("context")}
              className={`flex-1 py-1.5 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRightTab === "context"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Story Vault ({knowledgeItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("meetings")}
              className={`flex-1 py-1.5 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRightTab === "meetings"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Meetings ({latestMeetings.length})</span>
            </button>
          </div>

          {/* TAB A: LIVE LINKEDIN FEED SIMULATOR */}
          {activeRightTab === "preview" && (
            <div className="space-y-4">
              <LinkedInFeedCard
                authorName={client?.founder_name || client?.name || "Founder"}
                authorTitle={`${client?.founder_title || "Founder & CEO"} at ${client?.name || "Company"}`}
                authorAvatarSeed={client?.founder_name || client?.name || "Founder"}
                linkedinUrl={client?.linkedin_url || undefined}
                bodyMarkdown={bodyMarkdown}
                statusLabel={
                  status === "published"
                    ? "Published"
                    : status === "client_review"
                    ? "Founder Review"
                    : status === "internal_review"
                    ? "Internal QA"
                    : "Draft"
                }
                showModeToggle={true}
                initialMode="desktop"
                showDiagnostics={true}
              />

              {/* Hook Optimization Rule */}
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3.5 border border-[var(--color-line)] text-xs space-y-1.5">
                <span className="font-sans tabular-nums uppercase text-[10px] text-[var(--color-ink-tertiary)] block font-medium">
                  LinkedIn Fold Rule
                </span>
                <p className="text-[var(--color-ink-secondary)] text-[12px] leading-relaxed">
                  LinkedIn clamps hooks at <strong>3 lines</strong> before requiring readers to tap &ldquo;...more&rdquo; (~140 chars on Mobile, ~210 chars on Desktop). Put the contrarian edge or hard metric in line 1.
                </p>
              </div>
            </div>
          )}

          {/* TAB B: CLIENT VOICE & STORY VAULT */}
          {activeRightTab === "context" && (
            <div className="card p-5 space-y-4">
              {/* Positioning & Tone Header */}
              {context && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)] space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase block">
                        Target ICP
                      </span>
                      <p className="text-[var(--color-ink)] font-medium line-clamp-2">
                        {context.target_audience_icp || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase block">
                        Tone Archetype
                      </span>
                      <p className="text-[var(--color-ink)] font-medium line-clamp-2">
                        {context.tone_archetype || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {context.voice_guidelines && (
                    <div className="pt-1.5 border-t border-[var(--color-line-subtle)]">
                      <span className="text-[var(--color-ink-tertiary)] text-[10px] font-sans tabular-nums uppercase block">
                        Voice Rules
                      </span>
                      <p className="text-[var(--color-ink-secondary)] text-[11.5px] leading-relaxed line-clamp-3">
                        {context.voice_guidelines}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
                <span className="font-sans tabular-nums uppercase text-[10px] text-[var(--color-ink-tertiary)] font-medium">
                  Verified Stories, Frameworks &amp; Proof Points
                </span>
                <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                  1-Click Insert
                </span>
              </div>

              {knowledgeItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
                  <p>No verified stories or proof points logged for {client?.name} yet.</p>
                  {client?.id && (
                    <Link
                      href={`/clients/${client.id}`}
                      className="btn btn-secondary text-xs inline-flex items-center gap-1 mt-1"
                    >
                      <span>Log Conversation in Client Memory</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {knowledgeItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base)] p-3 space-y-2 hover:border-[var(--color-line-strong)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block mb-0.5">
                            {item.category?.replace(/_/g, " ")}
                          </span>
                          <h4 className="font-medium text-xs text-[var(--color-ink)]">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet(item.content, "story")}
                          className="btn btn-secondary text-[11px] py-1 px-2 shrink-0 cursor-pointer inline-flex items-center gap-1"
                          title="Insert this story directly into your draft"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Insert</span>
                        </button>
                      </div>

                      <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                        {item.content}
                      </p>

                      {item.verified_metrics && Object.keys(item.verified_metrics).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--color-line-subtle)] text-[10.5px] font-sans tabular-nums text-[var(--color-accent-text)]">
                          {Object.entries(item.verified_metrics).map(([k, v]) => (
                            <span key={k}>
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB C: RECENT MEETING INTEL & CALL TAKEAWAYS */}
          {activeRightTab === "meetings" && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
                <span className="font-sans tabular-nums uppercase text-[10px] text-[var(--color-ink-tertiary)] font-medium">
                  Founder Call Takeaways &amp; Transcripts
                </span>
                <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                  1-Click Insert
                </span>
              </div>

              {latestMeetings.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
                  <p>No conversations logged for {client?.name} yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {latestMeetings.map((meeting: any) => {
                    const isHighlighted = initialMeetingId === meeting.id;
                    return (
                      <div
                        key={meeting.id}
                        className={`rounded-[var(--radius-sm)] border p-3.5 space-y-2.5 transition-colors ${
                          isHighlighted
                            ? "border-[var(--color-accent)] bg-[var(--color-base-subtle)]"
                            : "border-[var(--color-line)] bg-[var(--color-base)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-[var(--color-accent)]" />
                              <span>{formatDisplayDateTimeIST(meeting.meeting_date, true)}</span>
                            </span>
                            <h4 className="text-xs font-semibold text-[var(--color-ink)] mt-0.5">
                              {meeting.title}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInsertSnippet(meeting.summary, "meeting summary")}
                            className="btn btn-secondary text-[11px] py-1 px-2 shrink-0 cursor-pointer inline-flex items-center gap-1"
                            title="Insert summary into draft"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Use Summary</span>
                          </button>
                        </div>

                        <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5">
                          {meeting.summary}
                        </p>

                        {meeting.key_decisions && meeting.key_decisions.length > 0 && (
                          <div className="pt-1.5 border-t border-[var(--color-line-subtle)] space-y-1.5">
                            <span className="text-[9.5px] font-sans tabular-nums uppercase text-[var(--color-ink-tertiary)] block font-medium">
                              Key Stances / Takeaways (Click to insert):
                            </span>
                            <div className="space-y-1">
                              {meeting.key_decisions.map((d: string, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleInsertSnippet(d, "takeaway")}
                                  className="w-full text-left text-[11px] text-[var(--color-ink)] hover:text-[var(--color-accent-text)] flex items-start justify-between gap-2 py-1 px-2 rounded-[var(--radius-xs)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                                >
                                  <span>• {d}</span>
                                  <Plus className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mark as Published Modal */}
      <MarkPublishedModal
        post={
          currentPostId
            ? {
                id: currentPostId,
                title: derivedTitle,
                body_markdown: bodyMarkdown,
                scheduled_publish_date: scheduledDate
                  ? parseDatetimeLocalIST(scheduledDate)
                  : post?.scheduled_publish_date,
                linkedin_post_url: linkedinPostUrl,
                engagements: {
                  clients: {
                    name: client?.name,
                    founder_name: client?.founder_name,
                    linkedin_url: client?.linkedin_url,
                  },
                },
              }
            : null
        }
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onSuccess={() => {
          setStatus("published");
          showToast("Perspective marked live on LinkedIn!");
          router.refresh();
        }}
      />
    </div>
  );
}
