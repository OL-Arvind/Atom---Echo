"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordContentRevision } from "@/lib/revisions/storage";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate } from "./helpers";

/**
 * Internal QA Revision Request (internal_review -> draft):
 * Allows Lead Operator (Sudeesh) to return a draft to the writer with an internal QA note.
 */
export async function requestInternalRevisionAction(
  postId: string,
  note: string
) {
  try {
    const session = await requireOperatorSession();
    const cleanNote = note.trim();
    if (!cleanNote) {
      return { success: false, error: "Please include a quick QA note for the writer." };
    }

    const supabase = createAdminClient();

    const { data: post } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar")
      .eq("id", postId)
      .maybeSingle();

    const { error: updateErr } = await supabase
      .from("content_items")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await supabase.from("content_feedback").insert({
      content_item_id: postId,
      author_type: "operator",
      author_name: session.name || "Editorial QA",
      comment: cleanNote,
      is_resolved: false,
    });

    if (post) {
      await recordContentRevision(supabase, {
        postId,
        title: post.title,
        bodyMarkdown: post.body_markdown || "",
        targetPillar: post.target_pillar,
        stage: "draft",
        triggerType: "qa_returned",
        authorName: session.name || "Editorial QA",
        feedbackNote: cleanNote,
      });
    }

    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/command-center");
    revalidate("/clients");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to return draft for revision.";
    return { success: false, error: message };
  }
}

/**
 * Resolves client content feedback item (marks is_resolved: true)
 */
export async function resolveContentFeedbackAction(feedbackId: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("content_feedback")
      .update({ is_resolved: true })
      .eq("id", feedbackId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidate("/command-center");
    revalidate("/operations");
    revalidate("/content");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve content feedback.";
    return { success: false, error: message };
  }
}

export async function requestContentChangesAction(
  contentId: string,
  feedbackText: string,
  chips: string[] = []
) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    const { data: post } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar")
      .eq("id", contentId)
      .maybeSingle();

    // Update post status to draft (per AC-2)
    const { error: updateErr } = await supabase
      .from("content_items")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", contentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Insert feedback record
    const fullComment =
      chips.length > 0
        ? `[Tags: ${chips.join(", ")}] ${feedbackText}`.trim()
        : feedbackText;

    const { error: feedbackErr } = await supabase
      .from("content_feedback")
      .insert({
        content_item_id: contentId,
        author_type: "client",
        author_name: "Founder Client",
        comment: fullComment,
      });

    if (feedbackErr) {
      console.warn("Could not insert feedback record:", feedbackErr.message);
    }

    if (post) {
      await recordContentRevision(supabase, {
        postId: contentId,
        title: post.title,
        bodyMarkdown: post.body_markdown || "",
        targetPillar: post.target_pillar,
        stage: "draft",
        triggerType: "founder_returned",
        authorName: session.name || "Founder Client",
        feedbackNote: fullComment,
      });
    }

    revalidate("/command-center");
    revalidate("/content");
    revalidate(`/content/${contentId}`);
    revalidate("/clients");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to request content changes.";
    return { success: false, error: message };
  }
}
