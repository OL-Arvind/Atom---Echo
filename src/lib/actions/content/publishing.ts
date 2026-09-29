"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordContentRevision } from "@/lib/revisions/storage";
import type { ContentStatus } from "@/types/domain";
import {
  getClientActiveReviewToken,
  calculateNextPublishSlot,
} from "@/lib/security/token";
import {
  publishContentSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate, mapStageToTrigger, autoResolvePostFeedback } from "./helpers";

export async function approveContentAction(contentId: string) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    // 1. Fetch current post to check scheduled date
    const { data: post } = await supabase
      .from("content_items")
      .select("id, title, body_markdown, target_pillar, scheduled_publish_date, engagement_id")
      .eq("id", contentId)
      .single();

    const scheduledDate = calculateNextPublishSlot(post?.scheduled_publish_date);

    const { data, error } = await supabase
      .from("content_items")
      .update({
        status: "scheduled",
        scheduled_publish_date: scheduledDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await autoResolvePostFeedback(supabase, contentId);

    if (post) {
      await recordContentRevision(supabase, {
        postId: contentId,
        title: post.title,
        bodyMarkdown: post.body_markdown || "",
        targetPillar: post.target_pillar,
        stage: "scheduled",
        triggerType: "approved",
        authorName: session.name || "Sudeesh D S",
      });
    }

    revalidate("/command-center");
    revalidate("/content");
    revalidate(`/content/${contentId}`);
    revalidate("/calendar");
    revalidate("/clients");
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve content.";
    return { success: false, error: message };
  }
}

export async function updateContentStatusAction(contentId: string, newStatus: string) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "approved") {
      // Per AUT-06: if post already has a scheduled_publish_date, lock directly into 'scheduled'
      const { data: cur } = await supabase
        .from("content_items")
        .select("scheduled_publish_date")
        .eq("id", contentId)
        .single();
      if (cur?.scheduled_publish_date) {
        updateData.status = "scheduled";
      }
    } else if (newStatus === "scheduled") {
      const { data: cur } = await supabase
        .from("content_items")
        .select("scheduled_publish_date")
        .eq("id", contentId)
        .single();
      if (!cur?.scheduled_publish_date) {
        updateData.scheduled_publish_date = calculateNextPublishSlot(null);
      }
    } else if (newStatus === "published") {
      const { data: cur } = await supabase
        .from("content_items")
        .select("published_at")
        .eq("id", contentId)
        .single();
      if (!cur?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("content_items")
      .update(updateData)
      .eq("id", contentId)
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
          client_id,
          clients (
            founder_name,
            founder_phone
          )
        )
      `)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    let reviewToken: string | null = null;
    if (newStatus === "client_review") {
      const clientId = (data?.engagements as any)?.client_id;
      if (clientId) {
        const tokenData = await getClientActiveReviewToken(clientId);
        reviewToken = tokenData?.token || null;
      }
      await autoResolvePostFeedback(supabase, contentId);
    } else if (newStatus === "internal_review") {
      await autoResolvePostFeedback(supabase, contentId, true);
    } else if (["approved", "scheduled", "published"].includes(newStatus)) {
      await autoResolvePostFeedback(supabase, contentId);
    }

    const finalStage = String(updateData.status || newStatus) as ContentStatus;
    await recordContentRevision(supabase, {
      postId: contentId,
      title: data.title,
      bodyMarkdown: data.body_markdown || "",
      targetPillar: data.target_pillar,
      stage: finalStage,
      triggerType: mapStageToTrigger(finalStage),
      authorName: session.name || "Editorial Team",
    });

    revalidate("/content");
    revalidate(`/content/${contentId}`);
    revalidate("/calendar");
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/review");
    return { success: true, data, reviewToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update content status.";
    return { success: false, error: message };
  }
}

/**
 * Mark a post as Published (AC-2 / STATE_MACHINES):
 * - Transitions post to 'published'
 * - Sets published_at timestamp (defaults to now)
 * - Optionally stores verified linkedin_post_url
 * - Auto-resolves any remaining feedback
 * - Revalidates all pipeline & client views
 */
export async function publishContentPostAction(
  postIdOrData: string | { postId: string; linkedin_post_url?: string; published_at?: string },
  linkedinUrlArg?: string
) {
  try {
    const session = await requireOperatorSession();
    let postId: string;
    let linkedinPostUrl: string | undefined;
    let publishedAt: string | undefined;

    if (typeof postIdOrData === "string") {
      postId = postIdOrData;
      linkedinPostUrl = linkedinUrlArg;
    } else {
      postId = postIdOrData.postId;
      linkedinPostUrl = postIdOrData.linkedin_post_url;
      publishedAt = postIdOrData.published_at;
    }

    const parsed = publishContentSchema.safeParse({
      postId,
      linkedin_post_url: linkedinPostUrl || undefined,
      published_at: publishedAt || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const supabase = createAdminClient();

    const updatePayload: Record<string, unknown> = {
      status: "published",
      published_at: parsed.data.published_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.linkedin_post_url !== undefined) {
      updatePayload.linkedin_post_url = parsed.data.linkedin_post_url;
    }

    const { data: updatedPost, error } = await supabase
      .from("content_items")
      .update(updatePayload)
      .eq("id", parsed.data.postId)
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
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

    await autoResolvePostFeedback(supabase, parsed.data.postId);

    await recordContentRevision(supabase, {
      postId: parsed.data.postId,
      title: updatedPost.title,
      bodyMarkdown: updatedPost.body_markdown || "",
      targetPillar: updatedPost.target_pillar,
      stage: "published",
      triggerType: "published",
      authorName: session.name || "Editorial Team",
    });

    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/calendar");
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/review");

    return { success: true, post: updatedPost };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish post.";
    return { success: false, error: message };
  }
}

export async function markExpenseBilledAction(expenseId: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("tool_expenses")
      .update({ status: "invoiced" })
      .eq("id", expenseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidate("/billing");
    revalidate("/command-center");
    revalidate("/clients");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark expense as billed.";
    return { success: false, error: message };
  }
}
