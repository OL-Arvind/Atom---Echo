import type { ContentRevision, ContentRevisionTrigger } from "@/types/domain";

export interface StudioClientOption {
  engagementId: string;
  serviceType: string;
  client: {
    id: string;
    name: string;
    founder_name: string;
    founder_title?: string;
    founder_email?: string;
    founder_phone?: string;
    linkedin_url?: string;
    website_url?: string;
  };
  context: any;
  knowledgeItems: any[];
  latestMeetings: any[];
  reviewToken: string | null;
}

export interface ContentEditorClientProps {
  post?: any;
  context?: any;
  knowledgeItems?: any[];
  feedbackItems?: any[];
  revisions?: ContentRevision[];
  reviewToken?: string | null;
  latestMeetings?: any[];
  isNew?: boolean;
  clientOptions?: StudioClientOption[];
  initialClientId?: string;
  initialMeetingId?: string;
  initialPrompt?: string;
  initialFrom?: string;
}

export const DEFAULT_PILLARS = [
  "Thought Leadership",
  "Founder Journey & Origin",
  "Engineering & Tech Contrarian",
  "Customer Case Study",
  "Hiring & Culture",
];

export const PIPELINE_STEPS = [
  { id: "draft", label: "01 Draft" },
  { id: "internal_review", label: "02 Voice & QA" },
  { id: "client_review", label: "03 Founder Desk" },
  { id: "scheduled", label: "04 Scheduled" },
  { id: "published", label: "05 Published" },
] as const;

export function formatTriggerLabel(trigger: ContentRevisionTrigger): string {
  switch (trigger) {
    case "initial_draft":
      return "Initial Draft";
    case "sent_to_qa":
      return "Sent to Editorial QA";
    case "qa_returned":
      return "QA Returned for Revision";
    case "sent_to_founder":
      return "Dispatched to Founder Desk";
    case "founder_returned":
      return "Founder Requested Changes";
    case "manual_checkpoint":
      return "Saved Checkpoint";
    case "restored_version":
      return "Restored Prior Version";
    case "approved":
      return "Approved by Founder";
    case "published":
      return "Published on LinkedIn";
    default:
      return "Version Snapshot";
  }
}
