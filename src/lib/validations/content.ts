import { z } from "zod";

export const createContentSchema = z.object({
  engagement_id: z.string().min(1, "Client engagement is required."),
  title: z.string().trim().min(1, "Post title is required."),
  body_markdown: z.string().trim().min(1, "Post content body is required."),
  target_pillar: z.string().trim().optional().default("Thought Leadership"),
  status: z
    .enum([
      "draft",
      "internal_review",
      "client_review",
      "approved",
      "scheduled",
      "published",
      "rejected",
      "paused",
    ])
    .default("draft"),
  scheduled_publish_date: z
    .string()
    .optional()
    .nullable()
    .transform((d) => (d ? d : null)),
});

export const clientFeedbackSchema = z.object({
  postId: z.string().min(1, "Post ID is required."),
  token: z.string().min(1, "Review token is required."),
  feedbackText: z.string().trim().optional().default(""),
  chips: z.array(z.string()).optional().default([]),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type ClientFeedbackInput = z.infer<typeof clientFeedbackSchema>;
