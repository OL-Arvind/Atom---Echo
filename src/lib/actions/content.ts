"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function approveContentAction(contentId: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("content_items")
      .update({ status: "approved" })
      .eq("id", contentId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/command-center");
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
    
    // Update post status to internal_review
    const { error: updateErr } = await supabase
      .from("content_items")
      .update({ status: "internal_review" })
      .eq("id", contentId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Insert feedback record
    const fullComment = chips.length > 0 
      ? `[Tags: ${chips.join(", ")}] ${feedbackText}`.trim()
      : feedbackText;

    const { error: feedbackErr } = await supabase
      .from("content_feedback")
      .insert({
        content_item_id: contentId,
        author_type: "client",
        feedback_text: fullComment,
      });

    if (feedbackErr) {
      console.warn("Could not insert feedback record:", feedbackErr.message);
    }

    revalidatePath("/command-center");
    revalidatePath("/clients");
    return { success: true };
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

    revalidatePath("/command-center");
    revalidatePath("/clients");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
