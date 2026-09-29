"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordContentRevision,
  fetchPostRevisions,
} from "@/lib/revisions/storage";
import type { ContentStatus } from "@/types/domain";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate } from "./helpers";

/**
 * Explicit 1-Click Version Checkpoint in Studio ("Snapshot Version"):
 * Saves current draft text and records a distinct version snapshot in `content_revisions`.
 */
export async function saveContentVersionCheckpointAction(
  postId: string,
  payload: {
    bodyMarkdown: string;
    title?: string;
    targetPillar?: string | null;
    note?: string | null;
  }
) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    const { data: prevPost } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar, status")
      .eq("id", postId)
      .maybeSingle();

    const firstLine =
      payload.bodyMarkdown
        .split("\n")
        .map((l) => l.trim())
        .find(Boolean)
        ?.slice(0, 80) || "Untitled Perspective";
    const title = (payload.title || "").trim() || firstLine;

    await supabase
      .from("content_items")
      .update({
        title,
        body_markdown: payload.bodyMarkdown,
        target_pillar: payload.targetPillar ?? prevPost?.target_pillar ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    const revision = await recordContentRevision(supabase, {
      postId,
      title,
      bodyMarkdown: payload.bodyMarkdown,
      previousTitle: prevPost?.title,
      previousBodyMarkdown: prevPost?.body_markdown,
      targetPillar: payload.targetPillar ?? prevPost?.target_pillar ?? null,
      stage: (prevPost?.status || "draft") as ContentStatus,
      triggerType: "manual_checkpoint",
      authorName: session.name || "Editorial Team",
      customSummary: payload.note?.trim() || null,
      forceNewVersion: Boolean(payload.note?.trim()),
    });

    const revisions = await fetchPostRevisions(supabase, postId);

    revalidate(`/content/${postId}`);
    revalidate("/content");
    revalidate("/command-center");
    revalidate("/review");

    return { success: true, revision, revisions };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to snapshot version.";
    return { success: false, error: message };
  }
}

/**
 * Non-Destructive Version Restore:
 * 1. If the operator has unsaved edits that differ from the latest saved revision,
 *    snapshots those edits first so no work is ever lost.
 * 2. Restores the selected prior version `targetVersionNumber` into `content_items`
 *    and records a new `restored_version` entry (`vN+1`).
 */
export async function restoreContentVersionAction(
  postId: string,
  targetVersionNumber: number,
  currentUnsavedBody?: string
) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    const { data: post } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar, status")
      .eq("id", postId)
      .single();

    if (!post) {
      return { success: false, error: "Post not found." };
    }

    const existingRevisions = await fetchPostRevisions(supabase, postId, {
      id: post.id,
      title: post.title,
      body_markdown: post.body_markdown || "",
      target_pillar: post.target_pillar,
      status: post.status as ContentStatus,
    });

    const targetRevision = existingRevisions.find(
      (r) => r.version_number === targetVersionNumber
    );

    if (!targetRevision) {
      return { success: false, error: `Version v${targetVersionNumber} not found.` };
    }

    // Safety guard: if current editor text has unsaved changes compared to latest revision,
    // snapshot it first so the operator can always return to it.
    const latestRev = existingRevisions[0];
    const activeBody = (currentUnsavedBody ?? post.body_markdown ?? "").trim();
    if (latestRev && activeBody && activeBody !== (latestRev.body_markdown || "").trim()) {
      const activeTitle =
        activeBody
          .split("\n")
          .map((l: string) => l.trim())
          .find(Boolean)
          ?.slice(0, 80) || post.title;
      await recordContentRevision(supabase, {
        postId,
        title: activeTitle,
        bodyMarkdown: activeBody,
        targetPillar: post.target_pillar,
        stage: post.status as ContentStatus,
        triggerType: "manual_checkpoint",
        authorName: session.name || "Editorial Team",
        customSummary: `Auto-saved draft before restoring v${targetVersionNumber}`,
      });
    }

    const restoredTitle =
      targetRevision.title ||
      targetRevision.body_markdown
        .split("\n")
        .map((l: string) => l.trim())
        .find(Boolean)
        ?.slice(0, 80) ||
      post.title;

    const { data: updatedPost, error: updateErr } = await supabase
      .from("content_items")
      .update({
        title: restoredTitle,
        body_markdown: targetRevision.body_markdown,
        target_pillar: targetRevision.target_pillar ?? post.target_pillar,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    const newRevision = await recordContentRevision(supabase, {
      postId,
      title: restoredTitle,
      bodyMarkdown: targetRevision.body_markdown,
      targetPillar: targetRevision.target_pillar ?? post.target_pillar,
      stage: post.status as ContentStatus,
      triggerType: "restored_version",
      authorName: session.name || "Editorial Team",
      customSummary: `Restored from v${targetVersionNumber}`,
      forceNewVersion: true,
    });

    const revisions = await fetchPostRevisions(supabase, postId);

    revalidate(`/content/${postId}`);
    revalidate("/content");
    revalidate("/command-center");
    revalidate("/review");

    return {
      success: true,
      post: updatedPost,
      revision: newRevision,
      revisions,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to restore version.";
    return { success: false, error: message };
  }
}
