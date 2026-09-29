import { revalidatePath } from "next/cache";
import { invalidateDbCache } from "@/lib/data/supabase-queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentRevisionTrigger } from "@/types/domain";

export function revalidate(path: string) {
  invalidateDbCache();
  revalidatePath(path);
}

export function mapStageToTrigger(status: string): ContentRevisionTrigger {
  switch (status) {
    case "internal_review":
      return "sent_to_qa";
    case "client_review":
      return "sent_to_founder";
    case "approved":
    case "scheduled":
      return "approved";
    case "published":
      return "published";
    default:
      return "manual_checkpoint";
  }
}

export async function autoResolvePostFeedback(
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
