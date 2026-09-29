import type { ClientMeeting, MeetingChannel, KnowledgeItem } from "@/types/domain";

export function packMeetingSummary(
  cleanSummary: string,
  meta: {
    channel: MeetingChannel;
    attendees?: string | null;
    key_decisions?: string[];
    action_items?: string[];
  }
): string {
  const metaJson = JSON.stringify(meta);
  return `<!--AE_MEETING_META:${metaJson}-->\n${cleanSummary}`;
}

export function unpackMeetingRecord(
  raw: any,
  knowledgeItems: KnowledgeItem[] = []
): ClientMeeting {
  let summary = raw.summary || "";
  let channel: MeetingChannel =
    raw.channel || (raw.fathom_recording_url ? "fathom_video" : "google_meet");
  let attendees: string | null = raw.attendees || null;
  let key_decisions: string[] = raw.key_decisions || [];
  let action_items: string[] = raw.action_items || [];

  const metaMatch = summary.match(/<!--AE_MEETING_META:(.*?)-->\n?/);
  if (metaMatch) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (parsed.channel) channel = parsed.channel;
      if (parsed.attendees) attendees = parsed.attendees;
      if (Array.isArray(parsed.key_decisions)) key_decisions = parsed.key_decisions;
      if (Array.isArray(parsed.action_items)) action_items = parsed.action_items;
      summary = summary.replace(metaMatch[0], "").trim();
    } catch {
      // Fallback to raw summary
    }
  }

  // Filter knowledge items linked to this meeting
  const linkedItems = knowledgeItems.filter(
    (item) => item.source_meeting_id === raw.id
  );

  return {
    id: raw.id,
    client_id: raw.client_id,
    title: raw.title,
    meeting_date: raw.meeting_date,
    channel,
    attendees,
    fathom_recording_url: raw.fathom_recording_url || null,
    summary,
    raw_transcript: raw.raw_transcript || null,
    key_decisions,
    action_items,
    created_at: raw.created_at,
    knowledge_items: linkedItems,
  };
}

/**
 * Extracts Fathom or recording link from text if present.
 */
export function extractFathomUrlFromText(text: string): {
  fathomUrl: string | null;
  cleanedText: string;
} {
  const urlRegex = /(https?:\/\/(?:www\.)?fathom\.video\/(?:share\/)?[a-zA-Z0-9_\-]+)/i;
  const match = text.match(urlRegex);
  if (match) {
    const fathomUrl = match[1];
    // Remove standalone URL line if on its own line
    const cleanedText = text
      .replace(new RegExp(`^\\s*${fathomUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m"), "")
      .trim();
    return { fathomUrl, cleanedText };
  }
  return { fathomUrl: null, cleanedText: text };
}

/**
 * Smart parser for zero-friction conversation logging.
 * The user can just paste whatever they have — bullet points, full transcript, or raw notes.
 * The system automatically extracts action items, directives, transcripts, and titles.
 */
export function smartParseConversationNotes(params: {
  rawNotes: string;
  explicitTitle?: string;
  channel: MeetingChannel;
  founderName?: string;
  meetingDate?: string;
  explicitFathomUrl?: string;
}): {
  title: string;
  summary: string;
  channel: MeetingChannel;
  meeting_date: string;
  fathom_recording_url?: string;
  raw_transcript?: string;
  action_items: string[];
  key_decisions: string[];
} {
  const {
    rawNotes,
    explicitTitle,
    channel,
    founderName = "Founder",
    meetingDate,
    explicitFathomUrl,
  } = params;

  // 1. Extract Fathom URL
  const { fathomUrl, cleanedText } = extractFathomUrlFromText(rawNotes);
  const finalFathomUrl = explicitFathomUrl?.trim() || fathomUrl || undefined;

  const lines = cleanedText.split("\n");
  const action_items: string[] = [];
  const key_decisions: string[] = [];
  const contentLines: string[] = [];

  // 2. Scan lines for action items & decisions
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      contentLines.push(line);
      continue;
    }

    // Action items pattern (e.g. "- [ ] do x", "TODO: do x", "Action: do x")
    if (
      /^[-*•]\s*\[[\sXx]?\]/i.test(trimmed) ||
      /^TODO:?/i.test(trimmed) ||
      /^Action(?:\s*Item)?:?/i.test(trimmed) ||
      /^Next\s*steps?:?/i.test(trimmed)
    ) {
      const cleanAction = trimmed
        .replace(/^[-*•]\s*\[[\sXx]?\]\s*/i, "")
        .replace(/^(?:TODO|Action(?:\s*Item)?|Next\s*steps?):?\s*/i, "")
        .trim();
      if (cleanAction) action_items.push(cleanAction);
      continue;
    }

    // Directives / Decisions pattern
    if (
      /^Decision:?/i.test(trimmed) ||
      /^Agreed:?/i.test(trimmed) ||
      /^Directive:?/i.test(trimmed)
    ) {
      const cleanDecision = trimmed
        .replace(/^(?:Decision|Agreed|Directive):?\s*/i, "")
        .trim();
      if (cleanDecision) key_decisions.push(cleanDecision);
      continue;
    }

    contentLines.push(line);
  }

  // 3. Transcript detection: text with timestamps or many speaker lines
  const fullText = contentLines.join("\n").trim();
  const hasTimestamps = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(fullText);
  const speakerTagCount = (fullText.match(/^[A-Z][a-zA-Z\s]{1,25}:/gm) || []).length;
  const isLargeTranscript = fullText.length > 800 && (hasTimestamps || speakerTagCount >= 3);

  let summary = fullText;
  let raw_transcript: string | undefined = undefined;

  if (isLargeTranscript) {
    raw_transcript = fullText;
    // Extract first 3-5 sentences or up to 350 chars as the summary preview
    const firstParagraph = fullText.split(/\n\s*\n/)[0] || fullText;
    summary = firstParagraph.length > 350 ? firstParagraph.slice(0, 350) + "..." : firstParagraph;
  }

  // 4. Smart Title derivation
  let title = explicitTitle?.trim() || "";
  if (!title) {
    // If the first line is short (< 70 chars) and doesn't look like a timestamp
    const firstLine = lines.find((l) => l.trim().length > 0)?.trim() || "";
    if (
      firstLine &&
      firstLine.length <= 70 &&
      !firstLine.startsWith("[") &&
      !firstLine.includes(":") &&
      !firstLine.startsWith("-") &&
      !firstLine.startsWith("*")
    ) {
      title = firstLine;
    } else {
      const channelLabel =
        channel === "phone_call"
          ? "Phone Call"
          : channel === "whatsapp"
          ? "WhatsApp Sync"
          : channel === "fathom_video"
          ? "Video Sync"
          : "Sync Note";

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      title = `${channelLabel} with ${founderName} · ${dateStr}`;
    }
  }

  // Fallback summary if empty
  if (!summary) {
    summary = `Recorded ${channel.replace("_", " ")} conversation with ${founderName}.`;
  }

  const finalDate = meetingDate || new Date().toISOString();

  return {
    title,
    summary,
    channel,
    meeting_date: finalDate,
    fathom_recording_url: finalFathomUrl,
    raw_transcript,
    action_items,
    key_decisions,
  };
}
