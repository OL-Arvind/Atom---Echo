"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateDbCache } from "@/lib/data/supabase-queries";
import { requireOperatorSession } from "@/lib/auth/session";
import {
  createMeetingSchema,
  createKnowledgeItemSchema,
  formatZodError,
} from "@/lib/validations";
import {
  packMeetingSummary,
  unpackMeetingRecord,
  smartParseConversationNotes,
} from "@/lib/meetings/utils";
import type { ClientMeeting, MeetingChannel } from "@/types/domain";

export { packMeetingSummary, unpackMeetingRecord };

function revalidateClient(clientId: string) {
  invalidateDbCache();
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/command-center");
}


/**
 * Log a new meeting, phone call, or WhatsApp conversation into client memory.
 * Uses smart parsing so the operator only needs to paste raw notes or transcript.
 */
export async function createClientMeetingAction(formData: FormData) {
  try {
    await requireOperatorSession();

    const clientId = String(formData.get("client_id") || "");
    const rawChannel = (formData.get("channel") as MeetingChannel) || "fathom_video";
    const explicitTitle = String(formData.get("title") || "").trim();
    const founderName = String(formData.get("founder_name") || "Founder").trim();
    const rawNotesInput = String(
      formData.get("raw_notes") || formData.get("summary") || ""
    ).trim();
    const explicitMeetingDate = String(formData.get("meeting_date") || "").trim();
    const explicitFathomUrl = String(formData.get("fathom_recording_url") || "").trim();
    const explicitTranscript = String(formData.get("raw_transcript") || "").trim();
    const attendeesInput = String(formData.get("attendees") || "").trim();

    if (!rawNotesInput && !explicitTranscript) {
      return {
        success: false,
        error: "Please enter your conversation notes or paste a transcript.",
      };
    }

    // Run smart parser so the app does the heavy lifting
    const smartParsed = smartParseConversationNotes({
      rawNotes: rawNotesInput || explicitTranscript,
      explicitTitle,
      channel: rawChannel,
      founderName,
      meetingDate: explicitMeetingDate || undefined,
      explicitFathomUrl: explicitFathomUrl || undefined,
    });

    // Merge any explicit array inputs if provided
    const keyDecisionsRaw = formData.get("key_decisions_raw");
    const explicitDecisions =
      typeof keyDecisionsRaw === "string"
        ? keyDecisionsRaw
            .split("\n")
            .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
            .filter(Boolean)
        : [];

    const actionItemsRaw = formData.get("action_items_raw");
    const explicitActions =
      typeof actionItemsRaw === "string"
        ? actionItemsRaw
            .split("\n")
            .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
            .filter(Boolean)
        : [];

    const finalDecisions =
      explicitDecisions.length > 0 ? explicitDecisions : smartParsed.key_decisions;
    const finalActions =
      explicitActions.length > 0 ? explicitActions : smartParsed.action_items;
    const finalTranscript =
      explicitTranscript || smartParsed.raw_transcript || undefined;

    const rawInput = {
      client_id: clientId,
      title: smartParsed.title,
      meeting_date: smartParsed.meeting_date,
      channel: smartParsed.channel,
      attendees: attendeesInput || `Sudeesh D S, ${founderName}`,
      fathom_recording_url: smartParsed.fathom_recording_url,
      summary: smartParsed.summary,
      raw_transcript: finalTranscript,
      key_decisions: finalDecisions,
      action_items: finalActions,
      extract_story: formData.get("extract_story") === "true",
      story_category: formData.get("story_category") || "origin_story",
      story_title: formData.get("story_title") || undefined,
      story_content: formData.get("story_content") || undefined,
    };

    const parsed = createMeetingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      client_id,
      title,
      meeting_date,
      channel,
      attendees,
      fathom_recording_url,
      summary,
      raw_transcript,
      extract_story,
      story_category,
      story_title,
      story_content,
    } = parsed.data;

    const supabase = createAdminClient();

    // Pack channel, attendees, decisions, action_items into summary for guaranteed schema compatibility
    const packedSummary = packMeetingSummary(summary, {
      channel,
      attendees: attendees || null,
      key_decisions: finalDecisions,
      action_items: finalActions,
    });

    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .insert({
        client_id,
        title,
        meeting_date: new Date(meeting_date).toISOString(),
        fathom_recording_url: fathom_recording_url || null,
        raw_transcript: raw_transcript || null,
        summary: packedSummary,
      })
      .select()
      .single();

    if (meetingErr || !meeting) {
      return {
        success: false,
        error: meetingErr?.message || "Failed to log meeting in database.",
      };
    }

    // Optional quick knowledge extraction on create
    if (extract_story && story_title && story_content) {
      await supabase.from("knowledge_items").insert({
        client_id,
        category: story_category,
        title: story_title,
        content: story_content,
        source_meeting_id: meeting.id,
      });
    }

    revalidateClient(client_id);
    return { success: true, meeting: unpackMeetingRecord(meeting) };
  } catch (err: any) {
    console.error("Error in createClientMeetingAction:", err);
    return { success: false, error: err.message || "Unexpected server error." };
  }
}

/**
 * Update an existing client meeting / conversation note in memory.
 */
export async function updateClientMeetingAction(formData: FormData) {
  try {
    await requireOperatorSession();

    const meetingId = String(formData.get("meeting_id") || "").trim();
    const clientId = String(formData.get("client_id") || "").trim();
    const rawChannel = (formData.get("channel") as MeetingChannel) || "fathom_video";
    const explicitTitle = String(formData.get("title") || "").trim();
    const founderName = String(formData.get("founder_name") || "Founder").trim();
    const rawNotesInput = String(
      formData.get("raw_notes") || formData.get("summary") || ""
    ).trim();
    const explicitMeetingDate = String(formData.get("meeting_date") || "").trim();
    const explicitFathomUrl = String(formData.get("fathom_recording_url") || "").trim();
    const explicitTranscript = String(formData.get("raw_transcript") || "").trim();
    const attendeesInput = String(formData.get("attendees") || "").trim();

    if (!meetingId || !clientId) {
      return { success: false, error: "Missing conversation ID." };
    }

    if (!rawNotesInput && !explicitTranscript) {
      return {
        success: false,
        error: "Please enter your conversation notes or paste a transcript.",
      };
    }

    const smartParsed = smartParseConversationNotes({
      rawNotes: rawNotesInput || explicitTranscript,
      explicitTitle,
      channel: rawChannel,
      founderName,
      meetingDate: explicitMeetingDate || undefined,
      explicitFathomUrl: explicitFathomUrl || undefined,
    });

    const finalTranscript =
      smartParsed.raw_transcript || explicitTranscript || null;

    const packedSummary = packMeetingSummary(smartParsed.summary, {
      channel: smartParsed.channel,
      attendees: attendeesInput || `Sudeesh D S, ${founderName}`,
      key_decisions: smartParsed.key_decisions,
      action_items: smartParsed.action_items,
    });

    const supabase = createAdminClient();

    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .update({
        title: smartParsed.title,
        meeting_date: new Date(smartParsed.meeting_date).toISOString(),
        fathom_recording_url: smartParsed.fathom_recording_url || null,
        raw_transcript: finalTranscript,
        summary: packedSummary,
      })
      .eq("id", meetingId)
      .select()
      .single();

    if (meetingErr || !meeting) {
      return {
        success: false,
        error: meetingErr?.message || "Failed to update conversation.",
      };
    }

    revalidateClient(clientId);
    return { success: true, meeting: unpackMeetingRecord(meeting) };
  } catch (err: any) {
    console.error("Error in updateClientMeetingAction:", err);
    return { success: false, error: err.message || "Unexpected server error." };
  }
}

/**
 * Delete a client meeting from memory.
 */
export async function deleteClientMeetingAction(meetingId: string, clientId: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidateClient(clientId);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteClientMeetingAction:", err);
    return { success: false, error: err.message || "Failed to delete meeting." };
  }
}

/**
 * Create or extract a discrete Knowledge Item (Proof point, origin story, metric, framework)
 * linked to a client and optionally to a specific source meeting.
 */
export async function createKnowledgeItemAction(formData: FormData) {
  try {
    await requireOperatorSession();

    let verified_metrics: Record<string, string> = {};
    const rawMetrics = formData.get("verified_metrics_json");
    if (typeof rawMetrics === "string" && rawMetrics.trim()) {
      try {
        verified_metrics = JSON.parse(rawMetrics);
      } catch {
        // Ignored
      }
    }

    const rawInput = {
      client_id: formData.get("client_id"),
      category: formData.get("category"),
      title: formData.get("title"),
      content: formData.get("content"),
      source_meeting_id: formData.get("source_meeting_id") || undefined,
      verified_metrics,
    };

    const parsed = createKnowledgeItemSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const { client_id, category, title, content, source_meeting_id } = parsed.data;
    const supabase = createAdminClient();

    const { data: item, error } = await supabase
      .from("knowledge_items")
      .insert({
        client_id,
        category,
        title,
        content,
        verified_metrics,
        source_meeting_id: source_meeting_id || null,
      })
      .select()
      .single();

    if (error || !item) {
      return { success: false, error: error?.message || "Failed to save story." };
    }

    revalidateClient(client_id);
    return { success: true, item };
  } catch (err: any) {
    console.error("Error in createKnowledgeItemAction:", err);
    return { success: false, error: err.message || "Unexpected server error." };
  }
}

/**
 * Delete a knowledge item.
 */
export async function deleteKnowledgeItemAction(itemId: string, clientId: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    const { error } = await supabase.from("knowledge_items").delete().eq("id", itemId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidateClient(clientId);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteKnowledgeItemAction:", err);
    return { success: false, error: err.message || "Failed to delete story." };
  }
}
