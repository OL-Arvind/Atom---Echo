export type ClientStatus = "onboarding" | "active" | "paused" | "churned";
export type ServiceType = "linkedin_branding" | "cold_outreach" | "hybrid_growth";
export type EngagementStatus = "active" | "paused" | "completed";
export type BillingFrequency = "monthly" | "quarterly" | "project";

export type ContentFormat = "text_only" | "carousel_pdf" | "image_single" | "video";
export type ContentStatus =
  | "draft"
  | "internal_review"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "paused";

export type RequestCategory =
  | "emergency_hold"
  | "content_pivot"
  | "design_tweak"
  | "tool_issue"
  | "general_query";
export type RequestPriority = "urgent" | "high" | "normal" | "low";
export type RequestStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "closed";

export type ToolBillingCycle = "monthly" | "annual" | "credits";
export type ExpenseStatus = "unbilled" | "drafted_in_invoice" | "invoiced" | "reimbursed";
export type InvoiceStatus = "draft" | "approved" | "sent" | "paid" | "overdue" | "cancelled";

export interface Client {
  id: string;
  name: string;
  founder_name: string;
  founder_title?: string;
  founder_email?: string;
  founder_phone?: string;
  linkedin_url?: string;
  website_url?: string;
  status: ClientStatus;
  engagements: Engagement[];
  context?: ClientContext;
  created_at: string;
}

export interface Engagement {
  id: string;
  client_id: string;
  service_type: ServiceType;
  status: EngagementStatus;
  monthly_retainer: number;
  billing_frequency: BillingFrequency;
  billing_anchor_day: number;
  start_date: string;
  renewal_date?: string;
  primary_operator_id?: string;
}

export interface ClientContext {
  id: string;
  client_id: string;
  positioning_statement: string;
  target_audience_icp: string;
  tone_archetype: string;
  voice_guidelines: string;
  taboo_words: string[];
  core_pillars: string[];
  knowledge_items?: KnowledgeItem[];
}

export interface KnowledgeItem {
  id: string;
  client_id: string;
  category: "origin_story" | "case_study" | "metric_proof" | "framework" | "contrarian_opinion";
  title: string;
  content: string;
  verified_metrics?: Record<string, string>;
}

export interface ContentItem {
  id: string;
  engagement_id: string;
  client_id: string;
  client_name: string;
  title: string;
  body_markdown: string;
  content_format: ContentFormat;
  status: ContentStatus;
  assigned_writer: string;
  target_pillar: string;
  scheduled_publish_date?: string;
  published_at?: string;
  linkedin_post_url?: string;
  stalled_hours?: number;
  created_at: string;
}

export interface ToolSubscription {
  id: string;
  tool_name: string;
  billing_cycle: ToolBillingCycle;
  cost_amount: number;
  currency: string;
  next_renewal_date: string;
  assigned_client_id?: string;
  assigned_client_name?: string;
  default_pass_through: boolean;
}

export interface ToolExpense {
  id: string;
  engagement_id?: string;
  tool_subscription_id?: string;
  client_id?: string;
  client_name?: string;
  tool_name?: string;
  description: string;
  amount: number;
  currency: string;
  incurred_date: string;
  status: ExpenseStatus;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  tool_expense_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  engagement_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  paid_at?: string | null;
  created_at: string;
  client_name?: string;
  founder_name?: string;
  founder_email?: string;
  founder_phone?: string;
  line_items?: InvoiceLineItem[];
}

export interface ClientRequest {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  assigned_to?: string;
  created_at: string;
}

export interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  entity_type: "content" | "tool" | "invoice" | "request" | "client";
  entity_id: string;
  client_name: string;
  action_label: string;
  action_type: "whatsapp_ping" | "review_post" | "bill_expense" | "resolve_hold";
  created_at: string;
}

export interface ReviewToken {
  id: string;
  client_id: string;
  token_hash: string;
  expires_at: string;
  last_accessed_at?: string;
  revoked: boolean;
  created_at: string;
}

export interface ContentFeedback {
  id: string;
  content_item_id: string;
  author_type: "client" | "operator" | "system";
  author_name: string;
  highlighted_text?: string;
  comment: string;
  is_resolved: boolean;
  created_at: string;
}

