export interface ReviewSharedCredential {
  id: string;
  platform: string;
  username_or_email: string;
  two_factor_method?: string | null;
  notes?: string | null;
  access_scope?: string;
  created_at?: string;
}

export function isMeaningful(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return !["na", "n/a", "none", "-", "null", "undefined"].includes(lower);
}

export interface ReviewPostItem {
  id: string;
  title: string;
  body_markdown: string;
  target_pillar?: string;
  scheduled_publish_date?: string;
  published_at?: string;
  linkedin_post_url?: string;
  created_at: string;
  status?: string;
  last_client_feedback?: string | null;
  last_client_feedback_at?: string | null;
  previous_body_markdown?: string | null;
  version_number?: number;
  previous_version_number?: number;
}

export interface ReviewPortalClientProps {
  clientName: string;
  founderName: string;
  founderTitle?: string;
  linkedinUrl?: string;
  initialPendingPosts: ReviewPostItem[];
  initialApprovedPosts: ReviewPostItem[];
  publishedPosts?: ReviewPostItem[];
  sharedCredentials?: ReviewSharedCredential[];
  token: string;
  // Backward compatibility in case single post is passed
  post?: ReviewPostItem;
}

export const FEEDBACK_CHIPS = [
  "Make it punchier",
  "Sharpen hook",
  "Tone it down",
  "Add hard metrics",
  "Too generic",
  "Missing context",
  "Fix taboo wording",
  "Stronger callout",
];
