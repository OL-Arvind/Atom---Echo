"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordContentRevision,
  fetchPostRevisions,
} from "@/lib/revisions/storage";
import type { ContentRevisionTrigger, ContentStatus } from "@/types/domain";
import {
  getClientActiveReviewToken,
  calculateNextPublishSlot,
} from "@/lib/security/token";
import {
  createContentSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate, mapStageToTrigger, autoResolvePostFeedback } from "./helpers";

export async function createContentAction(formData: FormData) {
  try {
    const session = await requireOperatorSession();
    const bodyText = (formData.get("body_markdown") as string) || "";
    const firstLine = bodyText.split("\n").map((l) => l.trim()).find(Boolean)?.slice(0, 80) || "Untitled Perspective";
    const rawTitle = ((formData.get("title") as string) || "").trim() || firstLine;

    const rawInput = {
      engagement_id: formData.get("engagement_id"),
      title: rawTitle,
      body_markdown: bodyText,
      target_pillar: formData.get("target_pillar") || undefined,
      status: formData.get("status") || undefined,
      scheduled_publish_date: formData.get("scheduled_publish_date") || undefined,
    };

    const parsed = createContentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      engagement_id: engagementId,
      title,
      body_markdown: bodyMarkdown,
      target_pillar: targetPillar,
      status,
      scheduled_publish_date: scheduledDate,
    } = parsed.data;

    const supabase = createAdminClient();

    const { data: newPost, error } = await supabase
      .from("content_items")
      .insert({
        engagement_id: engagementId,
        title,
        body_markdown: bodyMarkdown,
        target_pillar: targetPillar,
        status: status as any,
        scheduled_publish_date: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await recordContentRevision(supabase, {
      postId: newPost.id,
      title,
      bodyMarkdown: bodyMarkdown || "",
      targetPillar: targetPillar || null,
      stage: (status || "draft") as ContentStatus,
      triggerType:
        status === "client_review"
          ? "sent_to_founder"
          : status === "internal_review"
          ? "sent_to_qa"
          : "initial_draft",
      authorName: session.name || "Editorial Team",
      forceNewVersion: true,
    });

    let reviewToken: string | null = null;
    // If moving to client_review, ensure a valid 7-day cryptographic review token exists
    if (status === "client_review") {
      const { data: eng } = await supabase
        .from("engagements")
        .select("client_id")
        .eq("id", engagementId)
        .single();

      if (eng?.client_id) {
        const tokenData = await getClientActiveReviewToken(eng.client_id);
        reviewToken = tokenData?.token || null;
      }
    }

    revalidate("/content");
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/calendar");
    return { success: true, post: newPost, reviewToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create content.";
    return { success: false, error: message };
  }
}

export async function updateContentPostAction(postId: string, formData: FormData) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    const bodyMarkdown = (formData.get("body_markdown") as string) ?? "";
    const firstLine =
      bodyMarkdown
        .split("\n")
        .map((l) => l.trim())
        .find(Boolean)
        ?.slice(0, 80) || "Untitled Perspective";
    const rawTitle = ((formData.get("title") as string) || "").trim();
    const title = rawTitle || firstLine;
    const targetPillar = formData.get("target_pillar") as string;
    const status = formData.get("status") as string;
    const scheduledDate = formData.get("scheduled_publish_date") as string;
    const linkedinPostUrl = formData.get("linkedin_post_url") as string | null;
    const recordRevisionFlag = formData.get("record_revision") === "true";
    const revisionNote = ((formData.get("revision_note") as string) || "").trim() || null;

    if (!postId) {
      return { success: false, error: "Post ID is required." };
    }

    // Fetch pre-update row so baseline v1 synthesis knows the prior text before this edit
    const { data: prevPost } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar, status, scheduled_publish_date, published_at")
      .eq("id", postId)
      .maybeSingle();

    const updateData: Record<string, unknown> = {
      title,
      body_markdown: bodyMarkdown,
      target_pillar: targetPillar || null,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === "approved" && scheduledDate) {
        updateData.status = "scheduled";
      } else if (status === "scheduled" && !scheduledDate) {
        if (!prevPost?.scheduled_publish_date) {
          updateData.scheduled_publish_date = calculateNextPublishSlot(null);
        }
      } else if (status === "published") {
        if (!prevPost?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }

    if (scheduledDate !== undefined && scheduledDate !== null) {
      updateData.scheduled_publish_date = scheduledDate ? new Date(scheduledDate).toISOString() : null;
    }

    if (linkedinPostUrl !== null && linkedinPostUrl !== undefined) {
      updateData.linkedin_post_url = linkedinPostUrl.trim() || null;
    }

    const { data: updatedPost, error } = await supabase
      .from("content_items")
      .update(updateData)
      .eq("id", postId)
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
        scheduled_publish_date,
        published_at,
        linkedin_post_url,
        engagement_id,
        engagements (
          client_id
        )
      `)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let reviewToken: string | null = null;
    const finalStatus = String(updateData.status || updatedPost.status);
    // If moving to client_review, ensure a valid cryptographic review token exists for this client (AUT-01)
    if (finalStatus === "client_review") {
      const clientId = (updatedPost.engagements as any)?.client_id;
      if (clientId) {
        const tokenData = await getClientActiveReviewToken(clientId);
        reviewToken = tokenData?.token || null;
      }
      await autoResolvePostFeedback(supabase, postId);
    } else if (finalStatus === "internal_review") {
      await autoResolvePostFeedback(supabase, postId, true);
    } else if (["approved", "scheduled", "published"].includes(finalStatus)) {
      await autoResolvePostFeedback(supabase, postId);
    }

    const statusChanged = prevPost && prevPost.status !== finalStatus;
    let revisions = undefined;

    if (recordRevisionFlag || statusChanged) {
      const triggerType: ContentRevisionTrigger = statusChanged
        ? mapStageToTrigger(finalStatus)
        : "manual_checkpoint";

      await recordContentRevision(supabase, {
        postId,
        title,
        bodyMarkdown,
        previousTitle: prevPost?.title,
        previousBodyMarkdown: prevPost?.body_markdown,
        targetPillar: targetPillar || null,
        stage: finalStatus as ContentStatus,
        triggerType,
        authorName: session.name || "Editorial Team",
        customSummary: revisionNote,
      });

      revisions = await fetchPostRevisions(supabase, postId);
    }

    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/calendar");
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/review");
    return { success: true, post: updatedPost, reviewToken, revisions };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update post.";
    return { success: false, error: message };
  }
}
