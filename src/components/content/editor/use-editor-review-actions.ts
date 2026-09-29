"use client";

import { useRouter } from "next/navigation";
import {
  sendForClientReviewAction,
  requestInternalRevisionAction,
} from "@/lib/actions/content";

interface UseEditorReviewActionsParams {
  currentPostId: string | null;
  client: any;
  derivedTitle: string;
  bodyMarkdown: string;
  activeReviewToken: string | null;
  setActiveReviewToken: (tok: string | null) => void;
  setFeedbackList: React.Dispatch<React.SetStateAction<any[]>>;
  setStatus: (status: string) => void;
  qaReturnNote: string;
  setQaReturnNote: (note: string) => void;
  setShowQaReturnInput: (show: boolean) => void;
  setCopiedLink: (copied: boolean) => void;
  setCopiedBody: (copied: boolean) => void;
  setBodyMarkdown: React.Dispatch<React.SetStateAction<string>>;
  setAuthoringMode: (mode: "write" | "diff") => void;
  setSaveState: (state: "saved" | "saving" | "unsaved") => void;
  showToast: (msg: string) => void;
  startTransition: (cb: () => void) => void;
}

export function useEditorReviewActions({
  currentPostId,
  client,
  derivedTitle,
  bodyMarkdown,
  activeReviewToken,
  setActiveReviewToken,
  setFeedbackList,
  setStatus,
  qaReturnNote,
  setQaReturnNote,
  setShowQaReturnInput,
  setCopiedLink,
  setCopiedBody,
  setBodyMarkdown,
  setAuthoringMode,
  setSaveState,
  showToast,
  startTransition,
}: UseEditorReviewActionsParams) {
  const router = useRouter();

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
    setAuthoringMode("write");
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

  return {
    handleRemoveTabooWord,
    handleInsertSnippet,
    handleCopyBody,
    handleReturnToDraftWithQaNote,
    handleCopyReviewLink,
    openWhatsAppPing,
  };
}
