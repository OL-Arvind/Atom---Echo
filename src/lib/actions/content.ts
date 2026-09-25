"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyClientReviewToken,
  getClientActiveReviewToken,
  calculateNextPublishSlot,
} from "@/lib/security/token";
import {
  createContentSchema,
  clientFeedbackSchema,
  publishContentSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";

/**
 * 1-Tap Client Approval (AC-2):
 * - Authenticates via 7-day cryptographic token
 * - Transitions post to approved -> scheduled
 * - Computes and locks in next available publishing date
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
        status,
        scheduled_publish_date,
        engagement_id,
        engagements (
          client_id
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

    revalidatePath("/review");
    revalidatePath(`/review/${token}`);
    revalidatePath("/calendar");
    revalidatePath("/content");
    revalidatePath(`/content/${postId}`);
    revalidatePath("/command-center");
    revalidatePath("/clients");

    return {
      success: true,
      scheduledDate,
      postId: updatedPost.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
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

    revalidatePath("/review");
    revalidatePath(`/review/${token}`);
    revalidatePath("/content");
    revalidatePath(`/content/${postId}`);
    revalidatePath("/command-center");
    revalidatePath("/clients");
    revalidatePath("/operations");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Resolves client content feedback item (marks is_resolved: true)
 */
export async function resolveContentFeedbackAction(feedbackId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("content_feedback")
      .update({ is_resolved: true })
      .eq("id", feedbackId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/command-center");
    revalidatePath("/operations");
    revalidatePath("/content");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generates/retrieves valid 7-day token and formats WhatsApp magic link
 */
export async function sendForClientReviewAction(postIdOrClientId: string) {
  try {
    const supabase = createAdminClient();
    let clientId: string | null = null;
    let postTitle: string = "your latest LinkedIn draft";

    const { data: post } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
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
    const phone = client.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    const message = encodeURIComponent(
      `Hi ${client.founder_name || "there"}, here is ${postTitle} ready for your 1-tap review: /review/${token}`
    );
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;

    revalidatePath("/content");
    revalidatePath("/command-center");
    revalidatePath("/clients");

    return {
      success: true,
      token,
      reviewPath: `/review/${token}`,
      whatsappUrl,
      founderName: client.founder_name,
      expiresAt: tokenData.expiresAt,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function approveContentAction(contentId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Fetch current post to check scheduled date
    const { data: post } = await supabase
      .from("content_items")
      .select("id, scheduled_publish_date, engagement_id")
      .eq("id", contentId)
      .single();

    const scheduledDate = calculateNextPublishSlot(post?.scheduled_publish_date);

    const { data, error } = await supabase
      .from("content_items")
      .update({
        status: "scheduled",
        scheduled_publish_date: scheduledDate,
      })
      .eq("id", contentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/command-center");
    revalidatePath("/content");
    revalidatePath("/calendar");
    revalidatePath("/clients");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function requestContentChangesAction(
  contentId: string,
  feedbackText: string,
  chips: string[] = []
) {
  try {
    const supabase = createAdminClient();

    // Update post status to draft (per AC-2)
    const { error: updateErr } = await supabase
      .from("content_items")
      .update({ status: "draft" })
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

    revalidatePath("/command-center");
    revalidatePath("/content");
    revalidatePath("/clients");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function createContentAction(formData: FormData) {
  try {
    const rawInput = {
      engagement_id: formData.get("engagement_id"),
      title: formData.get("title"),
      body_markdown: formData.get("body_markdown"),
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

    // If moving to client_review, ensure a valid 7-day cryptographic review token exists
    if (status === "client_review") {
      const { data: eng } = await supabase
        .from("engagements")
        .select("client_id")
        .eq("id", engagementId)
        .single();

      if (eng?.client_id) {
        await getClientActiveReviewToken(eng.client_id);
      }
    }

    revalidatePath("/content");
    revalidatePath("/command-center");
    revalidatePath("/clients");
    return { success: true, post: newPost };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateContentStatusAction(contentId: string, newStatus: string) {
  try {
    const supabase = createAdminClient();

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "scheduled") {
      const { data: cur } = await supabase
        .from("content_items")
        .select("scheduled_publish_date")
        .eq("id", contentId)
        .single();
      if (!cur?.scheduled_publish_date) {
        updateData.scheduled_publish_date = new Date(Date.now() + 86400000 * 2).toISOString();
      }
    }

    if (newStatus === "published") {
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

    if (newStatus === "client_review") {
      const clientId = (data?.engagements as any)?.client_id;
      if (clientId) {
        await getClientActiveReviewToken(clientId);
      }
    }

    revalidatePath("/content");
    revalidatePath(`/content/${contentId}`);
    revalidatePath("/calendar");
    revalidatePath("/command-center");
    revalidatePath("/clients");
    revalidatePath("/review");
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Mark a post as Published (AC-2 / STATE_MACHINES):
 * - Transitions post to 'published'
 * - Sets published_at timestamp (defaults to now)
 * - Optionally stores verified linkedin_post_url
 * - Revalidates all pipeline & client views
 */
export async function publishContentPostAction(
  postIdOrData: string | { postId: string; linkedin_post_url?: string; published_at?: string },
  linkedinUrlArg?: string
) {
  try {
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

    const updatePayload: any = {
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

    revalidatePath("/content");
    revalidatePath(`/content/${postId}`);
    revalidatePath("/calendar");
    revalidatePath("/command-center");
    revalidatePath("/clients");
    revalidatePath("/review");

    return { success: true, post: updatedPost };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateContentPostAction(postId: string, formData: FormData) {
  try {
    const supabase = createAdminClient();

    const title = formData.get("title") as string;
    const bodyMarkdown = formData.get("body_markdown") as string;
    const targetPillar = formData.get("target_pillar") as string;
    const status = formData.get("status") as string;
    const scheduledDate = formData.get("scheduled_publish_date") as string;
    const linkedinPostUrl = formData.get("linkedin_post_url") as string | null;

    if (!postId || !title) {
      return { success: false, error: "Post ID and Title are required." };
    }

    const updateData: any = {
      title,
      body_markdown: bodyMarkdown ?? "",
      target_pillar: targetPillar || null,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === "published") {
        const { data: cur } = await supabase
          .from("content_items")
          .select("published_at")
          .eq("id", postId)
          .single();
        if (!cur?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
    }

    if (scheduledDate !== undefined) {
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

    // If moving to client_review, ensure a valid cryptographic review token exists for this client (AUT-01)
    if (status === "client_review") {
      const clientId = (updatedPost.engagements as any)?.client_id;
      if (clientId) {
        await getClientActiveReviewToken(clientId);
      }
    }

    revalidatePath("/content");
    revalidatePath(`/content/${postId}`);
    revalidatePath("/calendar");
    revalidatePath("/command-center");
    revalidatePath("/clients");
    revalidatePath("/review");
    return { success: true, post: updatedPost };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markExpenseBilledAction(expenseId: string) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("tool_expenses")
      .update({ status: "invoiced" })
      .eq("id", expenseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/billing");
    revalidatePath("/command-center");
    revalidatePath("/clients");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
