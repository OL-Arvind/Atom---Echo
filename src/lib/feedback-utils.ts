/**
 * Utility to parse feedback comments that may contain structured tags like:
 * "[Tags: Sharpen hook, Needs more data] Can we add metrics on churn?"
 */
export interface ParsedFeedback {
  tags: string[];
  note: string;
}

export function parseFeedbackComment(rawComment?: string | null): ParsedFeedback {
  if (!rawComment || typeof rawComment !== "string") {
    return { tags: [], note: "" };
  }

  const trimmed = rawComment.trim();
  const tagMatch = trimmed.match(/^\[Tags:\s*([^\]]+)\]\s*(.*)$/s);

  if (tagMatch) {
    const rawTags = tagMatch[1];
    const rest = tagMatch[2] ? tagMatch[2].trim() : "";
    const tags = rawTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    return { tags, note: rest };
  }

  return { tags: [], note: trimmed };
}
