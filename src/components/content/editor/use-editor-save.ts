"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createContentAction,
  updateContentPostAction,
} from "@/lib/actions/content";
import { parseDatetimeLocalIST } from "@/lib/date-utils";
import type { ContentRevision } from "@/types/domain";
import type { StudioOriginSurface } from "@/components/layout/header-context";

interface UseEditorSaveParams {
  currentPostId: string | null;
  setCurrentPostId: (id: string) => void;
  status: string;
  setStatus: (status: string) => void;
  bodyMarkdown: string;
  derivedTitle: string;
  targetPillar: string;
  scheduledDate: string;
  selectedEngagementId: string;
  activeReviewToken: string | null;
  setActiveReviewToken: (tok: string | null) => void;
  setFeedbackList: React.Dispatch<React.SetStateAction<any[]>>;
  setRevisionList: React.Dispatch<React.SetStateAction<ContentRevision[]>>;
  setCompareFromVersion: (ver: number) => void;
  setSaveState: (state: "saved" | "saving" | "unsaved") => void;
  setCopiedLink: (copied: boolean) => void;
  setShowPublishModal: (show: boolean) => void;
  flaggedWords: string[];
  lastSavedSnapshot: React.MutableRefObject<string>;
  originKey: StudioOriginSurface;
  showToast: (msg: string) => void;
  startTransition: (cb: () => void) => void;
}

export function useEditorSave({
  currentPostId,
  setCurrentPostId,
  status,
  setStatus,
  bodyMarkdown,
  derivedTitle,
  targetPillar,
  scheduledDate,
  selectedEngagementId,
  activeReviewToken,
  setActiveReviewToken,
  setFeedbackList,
  setRevisionList,
  setCompareFromVersion,
  setSaveState,
  setCopiedLink,
  setShowPublishModal,
  flaggedWords,
  lastSavedSnapshot,
  originKey,
  showToast,
  startTransition,
}: UseEditorSaveParams) {
  const router = useRouter();

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
      if (!options?.silent) {
        formData.set("record_revision", "true");
      }
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

          const returnQuery = originKey !== "content" ? `?from=${originKey}` : "";
          router.replace(`/content/${res.post.id}${returnQuery}`);
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
        if (res.revisions) {
          setRevisionList(res.revisions);
          if (res.revisions.length >= 2) {
            setCompareFromVersion(res.revisions[1].version_number);
          }
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
      originKey,
      setStatus,
      setCurrentPostId,
      setActiveReviewToken,
      setRevisionList,
      setCompareFromVersion,
      setFeedbackList,
      setSaveState,
      setCopiedLink,
      lastSavedSnapshot,
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
  }, [bodyMarkdown, targetPillar, scheduledDate, currentPostId, performSave, setSaveState, startTransition, lastSavedSnapshot]);

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
  }, [performSave, startTransition]);

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

  return { performSave, handleStatusTransition };
}
