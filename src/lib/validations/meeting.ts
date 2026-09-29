import { z } from "zod";
import { flexibleUrlSchema } from "./common";

export const meetingChannelSchema = z.enum([
  "fathom_video",
  "google_meet",
  "zoom",
  "phone_call",
  "whatsapp",
  "in_person",
]);

export const createMeetingSchema = z.object({
  client_id: z.string().min(1, "Client is required."),
  title: z.string().trim().min(1, "Meeting or conversation title is required."),
  meeting_date: z.string().min(1, "Date and time is required."),
  channel: meetingChannelSchema.default("fathom_video"),
  attendees: z.string().trim().optional().default(""),
  fathom_recording_url: flexibleUrlSchema,
  summary: z.string().trim().min(1, "Executive summary or conversation context is required."),
  raw_transcript: z.string().trim().optional().default(""),
  key_decisions: z.array(z.string()).optional().default([]),
  action_items: z.array(z.string()).optional().default([]),
  // Optional quick story extraction on create
  extract_story: z.boolean().optional().default(false),
  story_category: z
    .enum([
      "origin_story",
      "case_study",
      "metric_proof",
      "framework",
      "contrarian_opinion",
    ])
    .optional()
    .default("origin_story"),
  story_title: z.string().trim().optional().default(""),
  story_content: z.string().trim().optional().default(""),
});

export const createKnowledgeItemSchema = z.object({
  client_id: z.string().min(1, "Client is required."),
  category: z.enum([
    "origin_story",
    "case_study",
    "metric_proof",
    "framework",
    "contrarian_opinion",
  ]),
  title: z.string().trim().min(1, "Story or proof point title is required."),
  content: z.string().trim().min(1, "Story narrative or verified proof details are required."),
  source_meeting_id: z.string().optional().nullable().transform((v) => v || null),
  verified_metrics: z.record(z.string(), z.string()).optional().default({}),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type CreateKnowledgeItemInput = z.infer<typeof createKnowledgeItemSchema>;
