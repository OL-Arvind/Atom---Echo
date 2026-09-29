"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  saveContentVersionCheckpointAction,
  restoreContentVersionAction,
} from "@/lib/actions/content";
import type { ContentRevision } from "@/types/domain";

interface UseEditorRevisionsParams {
  initialRevisions: ContentRevision[];
  currentPostId: string | null;
  bodyMarkdown: string;
  derivedTitle: string;
  targetPillar: string;
  scheduledDate: string;
  setBodyMarkdown: (val: string) => void;
  setTargetPillar: (val: string) => void;
  setSaveState: (val: "saved" | "saving" | "unsaved") => void;
  showToast: (msg: string) => void;
  lastSavedSnapshot: React.MutableRefObject<string>;
}

export function useEditorRevisions({
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
}: UseEditorRevisionsParams) {
  const router = useRouter();
  const [revisionList, setRevisionList] = useState<ContentRevision[]>(initialRevisions);

  useEffect(() => {
    if (initialRevisions && initialRevisions.length > 0) {
      setRevisionList(initialRevisions);
    }
  }, [initialRevisions]);

  const [authoringMode, setAuthoringMode] = useState<"write" | "diff">("write");
  const [compareFromVersion, setCompareFromVersion] = useState<number>(() => {
    if (initialRevisions.length >= 2) {
      return initialRevisions[1].version_number;
    }
    return initialRevisions[0]?.version_number || 1;
  });
  const [compareToTarget, setCompareToTarget] = useState<"live" | number>("live");
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);

  const latestVersionNumber = useMemo(
    () => revisionList[0]?.version_number || 1,
    [revisionList]
  );

  const selectedOldRevision = useMemo(() => {
    return (
      revisionList.find((r) => r.version_number === compareFromVersion) ||
      revisionList[1] ||
      revisionList[0] ||
      null
    );
  }, [revisionList, compareFromVersion]);

  const selectedNewRevision = useMemo(() => {
    if (compareToTarget === "live") return null;
    return revisionList.find((r) => r.version_number === compareToTarget) || null;
  }, [revisionList, compareToTarget]);

  // 1-Click Snapshot Version Checkpoint
  const handleSnapshotVersion = async () => {
    if (!currentPostId || bodyMarkdown.trim().length < 10) return;
    setIsSnapshotting(true);
    try {
      const res = await saveContentVersionCheckpointAction(currentPostId, {
        bodyMarkdown,
        title: derivedTitle,
        targetPillar,
      });
      if (res.success) {
        if (res.revisions) {
          setRevisionList(res.revisions);
          if (res.revisions.length >= 2) {
            setCompareFromVersion(res.revisions[1].version_number);
          }
        }
        setSaveState("saved");
        showToast(
          `Snapshot saved · v${res.revision?.version_number || latestVersionNumber}`
        );
      } else {
        showToast(res.error || "Failed to snapshot version");
      }
    } finally {
      setIsSnapshotting(false);
    }
  };

  // Non-Destructive Restore Prior Version
  const handleRestoreVersion = async (targetVersionNum: number) => {
    if (!currentPostId) return;
    setIsRestoringVersion(true);
    try {
      const res = await restoreContentVersionAction(
        currentPostId,
        targetVersionNum,
        bodyMarkdown
      );
      if (res.success && res.post) {
        setBodyMarkdown(res.post.body_markdown || "");
        if (res.post.target_pillar) {
          setTargetPillar(res.post.target_pillar);
        }
        if (res.revisions) {
          setRevisionList(res.revisions);
          if (res.revisions.length >= 2) {
            setCompareFromVersion(res.revisions[1].version_number);
          }
        }
        lastSavedSnapshot.current = JSON.stringify({
          bodyMarkdown: res.post.body_markdown || "",
          targetPillar: res.post.target_pillar || targetPillar,
          scheduledDate,
        });
        setSaveState("saved");
        setAuthoringMode("write");
        showToast(
          `Restored v${targetVersionNum} as current draft (v${
            res.revision?.version_number || latestVersionNumber + 1
          })`
        );
        router.refresh();
      } else {
        showToast(res.error || "Failed to restore version");
      }
    } finally {
      setIsRestoringVersion(false);
    }
  };

  return {
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
  };
}
