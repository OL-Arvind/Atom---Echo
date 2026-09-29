"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateDbCache } from "@/lib/data/supabase-queries";

function revalidate(path: string) {
  invalidateDbCache();
  revalidatePath(path);
}
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

async function autoResolvePostFeedback(
  supabase: ReturnType<typeof createAdminClient>,
  postId: string,
  onlyOperator = false
) {
  let query = supabase
    .from("content_feedback")
    .update({ is_resolved: true })
    .eq("content_item_id", postId)
    .eq("is_resolved", false);

  if (onlyOperator) {
    query = query.eq("author_type", "operator");
  }

  await query;
}

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

    await autoResolvePostFeedback(supabase, postId);

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

/**
 * Generates/retrieves valid 7-day token and formats WhatsApp magic link
 */
export async function sendForClientReviewAction(
  postIdOrClientId: string,
  origin?: string
) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();
    let clientId: string | null = null;
    let postTitle: string = "your latest LinkedIn perspective";

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
      await autoResolvePostFeedback(supabase, post.id);
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

export async function approveContentAction(contentId: string) {
  try {
    await requireOperatorSession();
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await autoResolvePostFeedback(supabase, contentId);

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

export async function requestContentChangesAction(
  contentId: string,
  feedbackText: string,
  chips: string[] = []
) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

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


export async function createContentAction(formData: FormData) {
  try {
    await requireOperatorSession();
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

export async function updateContentStatusAction(contentId: string, newStatus: string) {
  try {
    await requireOperatorSession();
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
    await requireOperatorSession();
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

export async function updateContentPostAction(postId: string, formData: FormData) {
  try {
    await requireOperatorSession();
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

    if (!postId) {
      return { success: false, error: "Post ID is required." };
    }

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
        const { data: cur } = await supabase
          .from("content_items")
          .select("scheduled_publish_date")
          .eq("id", postId)
          .single();
        if (!cur?.scheduled_publish_date) {
          updateData.scheduled_publish_date = calculateNextPublishSlot(null);
        }
      } else if (status === "published") {
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

    revalidate("/content");
    revalidate(`/content/${postId}`);
    revalidate("/calendar");
    revalidate("/command-center");
    revalidate("/clients");
    revalidate("/review");
    return { success: true, post: updatedPost, reviewToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update post.";
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
