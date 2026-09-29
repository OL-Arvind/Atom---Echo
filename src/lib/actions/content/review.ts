"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordContentRevision } from "@/lib/revisions/storage";
import {
  verifyClientReviewToken,
  getClientActiveReviewToken,
  calculateNextPublishSlot,
} from "@/lib/security/token";
import {
  clientFeedbackSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate, autoResolvePostFeedback } from "./helpers";

/**
 * 1-Tap Client Approval (AC-2):
 * - Authenticates via 7-day cryptographic token
 * - Transitions post to approved -> scheduled
 * - Computes and locks in next available publishing date
 * - Auto-resolves any open revision notes on the post
 * - Emits audit trail / triggers revalidation
 */
export async function approvePostByClientAction(postId: string, token: string) {
  try {
    const verification = await verifyClientReviewToken(token);
    if (!verification.valid || !verification.clientId) {
      return { success: false, error: "Invalid or expired review session." };
    }

    const supabase = createAdminClient();

    // 1. Fetch post and ensure it belongs to this client
    const { data: post, error: postErr } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
        scheduled_publish_date,
        engagement_id,
        engagements (
          client_id,
          clients (
            founder_name
          )
        )
      `)
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return { success: false, error: "Post not found." };
    }

    const postClientId = (post.engagements as any)?.client_id;
    if (postClientId !== verification.clientId) {
      return { success: false, error: "Unauthorized: Post does not belong to your account." };
    }

    const founderName = (post.engagements as any)?.clients?.founder_name || "Founder Client";

    // 2. Calculate locked scheduled publishing slot
    const scheduledDate = calculateNextPublishSlot(post.scheduled_publish_date);

    // 3. Transition to approved -> scheduled (locks in date)
    const { data: updatedPost, error: updateErr } = await supabase
      .from("content_items")
      .update({
        status: "scheduled",
        scheduled_publish_date: scheduledDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    await autoResolvePostFeedback(supabase, postId);

    await recordContentRevision(supabase, {
      postId,
      title: post.title,
      bodyMarkdown: post.body_markdown || "",
      targetPillar: post.target_pillar,
      stage: "scheduled",
      triggerType: "approved",
      authorName: founderName,
    });

    revalidate("/review");
    revalidate(`/review/${token}`);
    revalidate("/calendar");
    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/command-center");
    revalidate("/clients");

    return {
      success: true,
      scheduledDate,
      postId: updatedPost.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve post.";
    return { success: false, error: message };
  }
}

/**
 * Client Revision Request (AC-2):
 * - Authenticates via 7-day cryptographic token
 * - Records inline comments / feedback chips into content_feedback
 * - Transitions post from client_review back to draft
 */
export async function requestContentChangesByClientAction(
  postId: string,
  token: string,
  feedbackText: string,
  chips: string[] = []
) {
  try {
    const parsed = clientFeedbackSchema.safeParse({
      postId,
      token,
      feedbackText,
      chips,
    });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const verification = await verifyClientReviewToken(token);
    if (!verification.valid || !verification.clientId) {
      return { success: false, error: "Invalid or expired review session." };
    }

    const supabase = createAdminClient();

    // 1. Verify post belongs to this client
    const { data: post, error: postErr } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
        engagement_id,
        engagements (
          client_id,
          clients (
            founder_name
          )
        )
      `)
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return { success: false, error: "Post not found." };
    }

    const postClientId = (post.engagements as any)?.client_id;
    if (postClientId !== verification.clientId) {
      return { success: false, error: "Unauthorized: Post does not belong to your account." };
    }

    const founderName = (post.engagements as any)?.clients?.founder_name || "Founder Client";

    // 2. Update post status to draft (per AC-2)
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

    // 3. Record feedback into content_feedback
    const fullComment =
      chips.length > 0
        ? `[Tags: ${chips.join(", ")}] ${feedbackText}`.trim()
        : feedbackText.trim();

    if (fullComment) {
      await supabase.from("content_feedback").insert({
        content_item_id: postId,
        author_type: "client",
        author_name: founderName,
        comment: fullComment,
      });
    }

    await recordContentRevision(supabase, {
      postId,
      title: post.title,
      bodyMarkdown: post.body_markdown || "",
      targetPillar: post.target_pillar,
      stage: "draft",
      triggerType: "founder_returned",
      authorName: founderName,
      feedbackNote: fullComment || null,
    });

    revalidate("/review");
    revalidate(`/review/${token}`);
    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/operations");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit revision request.";
    return { success: false, error: message };
  }
}

export async function sendForClientReviewAction(
  postIdOrClientId: string,
  origin?: string
) {
  try {
    const session = await requireOperatorSession();
    const supabase = createAdminClient();
    let clientId: string | null = null;
    let postTitle: string = "your latest LinkedIn perspective";

    const { data: post } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
        engagement_id,
        engagements (
          client_id,
          clients (
            id,
            name,
            founder_name,
            founder_phone
          )
        )
      `)
      .eq("id", postIdOrClientId)
      .maybeSingle();

    if (post) {
      clientId = (post.engagements as any)?.client_id;
      postTitle = `"${post.title}"`;
      if (post.status !== "client_review") {
        await supabase
          .from("content_items")
          .update({
            status: "client_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
      }
      await autoResolvePostFeedback(supabase, post.id);
      await recordContentRevision(supabase, {
        postId: post.id,
        title: post.title,
        bodyMarkdown: post.body_markdown || "",
        targetPillar: post.target_pillar,
        stage: "client_review",
        triggerType: "sent_to_founder",
        authorName: session.name || "Sudeesh D S",
      });
    } else {
      clientId = postIdOrClientId;
    }

    if (!clientId) {
      return { success: false, error: "Invalid post or client ID." };
    }

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, name, founder_name, founder_phone")
      .eq("id", clientId)
      .single();

    if (clientErr || !client) {
      return { success: false, error: "Client not found." };
    }

    const tokenData = await getClientActiveReviewToken(client.id);
    if (!tokenData) {
      return { success: false, error: "Unable to generate secure review token." };
    }

    const token = tokenData.token;
    const baseOrigin = origin ? origin.replace(/\/$/, "") : (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const fullReviewUrl = baseOrigin ? `${baseOrigin}/review/${token}` : `/review/${token}`;
    const phone = client.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    const message = encodeURIComponent(
      `Hi ${client.founder_name || "there"}, ${postTitle} is ready for your 1-tap review on your Founder Desk:\n${fullReviewUrl}`
    );
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;

    revalidate("/content");
    if (post?.id) revalidate(`/content/${post.id}`);
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/review");

    return {
      success: true,
      token,
      reviewPath: `/review/${token}`,
      reviewUrl: fullReviewUrl,
      whatsappUrl,
      founderName: client.founder_name,
      founderPhone: client.founder_phone,
      expiresAt: tokenData.expiresAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send post for client review.";
    return { success: false, error: message };
  }
}
