"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import {
  toDatetimeLocalIST,
  parseDatetimeLocalIST,
} from "@/lib/date-utils";
import {
  DEFAULT_PILLARS,
  type ContentEditorClientProps,
} from "@/components/content/editor/types";
import { useStudioOrigin } from "@/components/content/editor/use-studio-origin";
import { useEditorRevisions } from "@/components/content/editor/use-editor-revisions";
import { useEditorSave } from "@/components/content/editor/use-editor-save";
import { useEditorReviewActions } from "@/components/content/editor/use-editor-review-actions";
import { EditorMasthead } from "@/components/content/editor/editor-masthead";
import {
  EditorFeedbackBanner,
  EditorResolvedFeedback,
} from "@/components/content/editor/editor-feedback-banner";
import { EditorCanvas } from "@/components/content/editor/editor-canvas";
import { EditorDossierPane } from "@/components/content/editor/editor-dossier-pane";

export function ContentEditorClient({
  post,
  context: initialContext,
  knowledgeItems: initialKnowledgeItems = [],
  feedbackItems: initialFeedbackItems = [],
  revisions: initialRevisions = [],
  reviewToken: initialReviewToken = null,
  latestMeetings: initialMeetings = [],
  isNew = false,
  clientOptions = [],
  initialClientId,
  initialMeetingId,
  initialPrompt,
  initialFrom,
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

  // Right column tab state
  const [activeRightTab, setActiveRightTab] = useState<
    "preview" | "context" | "meetings" | "versions"
  >(
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

  // Navigation and breadcrumbs hook
  const { originMeta } = useStudioOrigin({
    client,
    isNew,
    currentPostId,
    derivedTitle,
    initialClientId,
    initialMeetingId,
    initialFrom,
  });

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

  // Revisions & Diff hook
  const {
    revisionList,
    setRevisionList,
    authoringMode,
    setAuthoringMode,
    compareFromVersion,
    setCompareFromVersion,
    compareToTarget,
    setCompareToTarget,
    isSnapshotting,
    isRestoringVersion,
    latestVersionNumber,
    selectedOldRevision,
    selectedNewRevision,
    handleSnapshotVersion,
    handleRestoreVersion,
  } = useEditorRevisions({
    initialRevisions,
    currentPostId,
    bodyMarkdown,
    derivedTitle,
    targetPillar,
    scheduledDate,
    setBodyMarkdown,
    setTargetPillar,
    setSaveState,
    showToast,
    lastSavedSnapshot,
  });

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

  // Auto-Save, Shortcuts, and Stage Transitions Hook
  const { performSave, handleStatusTransition } = useEditorSave({
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
    originKey: originMeta.backHref.includes("meetings") ? "client-meetings" : "content",
    showToast,
    startTransition,
  });

  // Review Actions, WhatsApp ping, snippets & taboo remover
  const {
    handleRemoveTabooWord,
    handleInsertSnippet,
    handleCopyBody,
    handleReturnToDraftWithQaNote,
    handleCopyReviewLink,
    openWhatsAppPing,
  } = useEditorReviewActions({
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
  });

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

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── FLUSH ARCHITECTURAL STORY STUDIO MASTHEAD ─── */}
      <EditorMasthead
        originMeta={originMeta}
        saveState={saveState}
        isNew={isNew}
        currentPostId={currentPostId}
        client={client}
        bodyMarkdown={bodyMarkdown}
        copiedBody={copiedBody}
        onCopyBody={handleCopyBody}
        isPending={isPending}
        isSnapshotting={isSnapshotting}
        latestVersionNumber={latestVersionNumber}
        onSnapshotVersion={handleSnapshotVersion}
        onSaveDraft={() =>
          startTransition(async () => {
            await performSave();
          })
        }
        status={status}
        hasClientRevision={hasClientRevision}
        onStatusTransition={handleStatusTransition}
        onToggleQaReturnInput={() => setShowQaReturnInput((prev) => !prev)}
        copiedLink={copiedLink}
        onCopyReviewLink={handleCopyReviewLink}
        onOpenWhatsApp={openWhatsAppPing}
        onOpenPublishModal={() => setShowPublishModal(true)}
        linkedinPostUrl={linkedinPostUrl}
        flaggedWordsCount={flaggedWords.length}
        tabooWordsCount={tabooWords.length}
      />

      {/* ─── WORKSPACE CANVAS ─── */}
      <div className="flex-1 px-5 py-6 lg:px-7 lg:py-6 space-y-5">
        <EditorFeedbackBanner
          showQaReturnInput={showQaReturnInput}
          onCloseQaReturnInput={() => setShowQaReturnInput(false)}
          qaReturnNote={qaReturnNote}
          onQaReturnNoteChange={setQaReturnNote}
          onReturnToDraftWithQaNote={handleReturnToDraftWithQaNote}
          isPending={isPending}
          flaggedWords={flaggedWords}
          onRemoveTabooWord={handleRemoveTabooWord}
          unresolvedFeedback={unresolvedFeedback}
          hasRevisions={revisionList.length > 0}
          authoringMode={authoringMode}
          onToggleAuthoringMode={() =>
            setAuthoringMode((m) => (m === "diff" ? "write" : "diff"))
          }
          status={status}
          onStatusTransition={handleStatusTransition}
          resolvedFeedback={feedbackList.filter((fb) => fb.is_resolved)}
        />

        {/* Two-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Unified Authoring Sheet (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <EditorCanvas
              isNew={isNew}
              currentPostId={currentPostId}
              clientOptions={clientOptions}
              selectedEngagementId={selectedEngagementId}
              onClientSwitch={handleClientSwitch}
              pillars={pillars}
              targetPillar={targetPillar}
              onTargetPillarChange={setTargetPillar}
              scheduledDate={scheduledDate}
              onScheduledDateChange={setScheduledDate}
              authoringMode={authoringMode}
              onAuthoringModeChange={setAuthoringMode}
              latestVersionNumber={latestVersionNumber}
              readingTimeMin={readingTimeMin}
              revisionList={revisionList}
              bodyMarkdown={bodyMarkdown}
              onBodyMarkdownChange={setBodyMarkdown}
              selectedOldRevision={selectedOldRevision}
              selectedNewRevision={selectedNewRevision}
              compareToTarget={compareToTarget}
              onCompareToTargetChange={setCompareToTarget}
              compareFromVersion={compareFromVersion}
              onCompareFromVersionChange={setCompareFromVersion}
              onRestoreVersion={handleRestoreVersion}
              isRestoringVersion={isRestoringVersion}
              wordCount={wordCount}
              charCount={charCount}
            />

            {/* Past Resolved Revision History (if any) */}
            <EditorResolvedFeedback
              resolvedFeedback={feedbackList.filter((fb) => fb.is_resolved)}
            />
          </div>

          {/* RIGHT COLUMN: Unified Context, Preview & Versions Dossier (5 cols) */}
          <div className="lg:col-span-5">
            <EditorDossierPane
              activeRightTab={activeRightTab}
              onTabChange={setActiveRightTab}
              currentPostId={currentPostId}
              client={client}
              bodyMarkdown={bodyMarkdown}
              status={status}
              context={context}
              knowledgeItems={knowledgeItems}
              latestMeetings={latestMeetings}
              initialMeetingId={initialMeetingId}
              revisionList={revisionList}
              latestVersionNumber={latestVersionNumber}
              authoringMode={authoringMode}
              selectedOldRevision={selectedOldRevision}
              onSelectCompareVersion={(ver) => {
                setCompareFromVersion(ver);
                setCompareToTarget("live");
                setAuthoringMode("diff");
              }}
              onRestoreVersion={handleRestoreVersion}
              isRestoringVersion={isRestoringVersion}
              onSnapshotVersion={handleSnapshotVersion}
              isSnapshotting={isSnapshotting}
              onInsertSnippet={handleInsertSnippet}
            />
          </div>
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
                status: status,
                scheduled_publish_date: scheduledDate
                  ? parseDatetimeLocalIST(scheduledDate)
                  : post?.scheduled_publish_date,
                published_at: post?.published_at,
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
        onSuccess={(data) => {
          setStatus("published");
          if (data?.linkedin_post_url) {
            setLinkedinPostUrl(data.linkedin_post_url);
          }
          setSaveState("saved");
          showToast(
            data?.linkedin_post_url
              ? "LinkedIn URL linked to perspective!"
              : "Perspective marked live on LinkedIn!"
          );
          router.refresh();
        }}
      />
    </div>
  );
}
