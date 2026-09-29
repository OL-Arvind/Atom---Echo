import { fetchPostRevisions } from "@/lib/revisions/storage";
import type { ContentStatus } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

interface BuildAlertsParams {
  supabase: SupabaseClient;
  todayEndIso: string;
  reviewPosts: any[];
  scheduledPosts: any[];
  unbilledExpenses: any[];
  urgentRequests: any[];
  reviewTokens: any[];
  unresolvedFeedback: any[];
  renewingTools: any[];
  draftInvoices: any[];
  pipelineDraftsAndQa: any[];
  totalLeakage: number;
  tokenMap: Map<string, string>;
}

export async function buildOperationalAlerts(params: BuildAlertsParams) {
  const {
    supabase,
    todayEndIso,
    reviewPosts,
    unbilledExpenses,
    urgentRequests,
    unresolvedFeedback,
    renewingTools,
    draftInvoices,
    pipelineDraftsAndQa,
    totalLeakage,
    tokenMap,
  } = params;

  const alerts: any[] = [];
  const feedbackPostIds = new Set<string>();
  const postFeedbackLookup = new Map<string, any[]>();

  for (const p of [...reviewPosts, ...pipelineDraftsAndQa]) {
    if (p.id && Array.isArray((p as any).content_feedback)) {
      postFeedbackLookup.set(p.id, (p as any).content_feedback);
    }
  }

  // Alert 0: Content Revision Feedback (Founder or Internal QA)
  for (const fb of unresolvedFeedback) {
    const post = fb.content_items as any;
    if (post?.id) {
      feedbackPostIds.add(post.id);
      const existingFb = postFeedbackLookup.get(post.id) || [];
      if (!existingFb.some((item: any) => item.id === fb.id)) {
        postFeedbackLookup.set(post.id, [...existingFb, fb]);
      }
    }
    const client = (post?.engagements as any)?.clients;
    const clientName = client?.name || "Client";
    const isOperatorNote = fb.author_type === "operator";
    const founderName = isOperatorNote
      ? (fb.author_name || "Editorial QA")
      : (fb.author_name || client?.founder_name || "Founder");
    const founderPhone = client?.founder_phone || "+919876543210";
    const postTitle = post?.title || "Thought Leadership Post";
    const token = (client?.id && tokenMap.get(client.id)) || "";

    const clientContext = client?.client_contexts?.[0];
    const tabooWords = clientContext?.taboo_words || [];
    const voiceGuidelines = clientContext?.voice_guidelines || "";

    alerts.push({
      id: `alert-feedback-${fb.id}`,
      urgency: "urgent",
      title: isOperatorNote
        ? `${clientName}: Internal QA Revision Note`
        : `${founderName} (${clientName}): Revision Requested`,
      reason: fb.comment || `Changes requested on "${postTitle}".`,
      waiting_on: "Writer revision",
      entity_id: fb.id,
      feedback_id: fb.id,
      post_id: post?.id,
      post_title: postTitle,
      post_status: post?.status,
      body_markdown: post?.body_markdown,
      target_pillar: post?.target_pillar,
      scheduled_publish_date: post?.scheduled_publish_date,
      post_created_at: post?.created_at,
      taboo_words: tabooWords,
      voice_guidelines: voiceGuidelines,
      client_id: client?.id,
      client_name: clientName,
      founder_name: client?.founder_name || founderName,
      founder_phone: founderPhone,
      linkedin_url: client?.linkedin_url || undefined,
      website_url: client?.website_url || undefined,
      review_token: token,
      comment: fb.comment,
      feedback_created_at: fb.created_at,
      entity_type: "content_feedback",
      next_action: "Revise in Studio",
    });
  }

  // Alert 1: Urgent Client Requests (Emergency holds, tone pivots)
  for (const req of urgentRequests) {
    const client = req.clients as any;
    const clientName = client?.name || "Client";
    alerts.push({
      id: `alert-req-${req.id}`,
      urgency: req.priority === "urgent" ? "critical" : "warning",
      title: `${clientName}: ${req.title}`,
      reason: req.description || `Client submitted an urgent instruction in category '${req.category}'.`,
      waiting_on: "Team response",
      entity_id: req.id,
      client_id: client?.id,
      founder_name: client?.founder_name,
      founder_phone: client?.founder_phone,
      linkedin_url: client?.linkedin_url || undefined,
      website_url: client?.website_url || undefined,
      category: req.category,
      entity_type: "client_request",
      next_action: "View Request",
    });
  }

  // Alert 2: Posts pending client review
  for (const post of reviewPosts) {
    const client = (post.engagements as any)?.clients;
    const clientName = client?.name || "Client";
    const founderName = client?.founder_name || "Founder";
    const founderPhone = client?.founder_phone || "+919876543210";
    const token = (client?.id && tokenMap.get(client.id)) || "";
    const clientContext = client?.client_contexts?.[0];
    const tabooWords = clientContext?.taboo_words || [];
    const voiceGuidelines = clientContext?.voice_guidelines || "";

    alerts.push({
      id: `alert-post-${post.id}`,
      urgency: "warning",
      title: `${founderName} (${clientName}): Post Waiting for Review`,
      reason: `Post "${post.title}" is waiting for client approval before scheduling.`,
      waiting_on: founderName,
      entity_id: post.id,
      post_id: post.id,
      post_status: "client_review",
      client_id: client?.id,
      client_name: clientName,
      founder_name: founderName,
      founder_phone: founderPhone,
      linkedin_url: client?.linkedin_url || undefined,
      website_url: client?.website_url || undefined,
      review_token: token,
      post_title: post.title,
      body_markdown: post.body_markdown,
      target_pillar: post.target_pillar,
      scheduled_publish_date: post.scheduled_publish_date,
      post_created_at: post.created_at,
      taboo_words: tabooWords,
      voice_guidelines: voiceGuidelines,
      entity_type: "content_item",
      next_action: "Copy WhatsApp Link",
    });
  }

  // Alert 3: Unbilled tool expenses
  if (totalLeakage > 0) {
    alerts.push({
      id: "alert-tool-leakage",
      urgency: "info",
      title: `₹${totalLeakage.toLocaleString("en-IN")} Unbilled Software Expenses`,
      reason: `${unbilledExpenses.length} unbilled tool expenses (HeyReach, Clay, Proxies) incurred across active clients.`,
      waiting_on: "Monthly Invoice Draft",
      entity_id: "billing",
      entity_type: "billing",
      next_action: "Draft Invoices",
    });
  }

  // Alert 4: Tool subscriptions renewing within 5 days
  for (const tool of renewingTools) {
    alerts.push({
      id: `alert-tool-renew-${tool.id}`,
      urgency: "warning",
      title: `${tool.tool_name} Renews Soon`,
      client_name: tool.tool_name,
      tool_name: tool.tool_name,
      cost_amount: Number(tool.cost_amount),
      currency: tool.currency,
      next_renewal_date: tool.next_renewal_date,
      default_pass_through: tool.default_pass_through,
      reason: `Subscription cost: ${tool.currency} ${Number(tool.cost_amount).toLocaleString("en-IN")}. Renews on ${tool.next_renewal_date}.`,
      waiting_on: "License Review",
      entity_id: tool.id,
      entity_type: "tool_renewal",
      next_action: "Review Tool",
    });
  }

  // Alert 5: Pending draft invoices
  for (const inv of draftInvoices) {
    const client = (inv.engagements as any)?.clients;
    const clientName = client?.name || "Client";
    const founderName = client?.founder_name || "Founder";
    alerts.push({
      id: `alert-inv-draft-${inv.id}`,
      urgency: "urgent",
      title: `Draft Invoice ${inv.invoice_number}`,
      client_name: clientName,
      founder_name: founderName,
      founder_phone: client?.founder_phone,
      founder_email: client?.founder_email,
      reason: `₹${Number(inv.total_amount).toLocaleString("en-IN")} pending approval before sending.`,
      waiting_on: "Sudeesh Sign-off",
      entity_id: inv.id,
      entity_type: "invoice_draft",
      next_action: "Review Invoice",
      invoice_number: inv.invoice_number,
      total_amount: Number(inv.total_amount),
      subtotal_amount: Number(inv.subtotal_amount || inv.total_amount),
      due_date: inv.due_date,
      line_items: inv.invoice_line_items || [],
    });
  }

  // Alert 6: Internal Voice QA Queue + Stalled Drafts (Scheduled slot due/past)
  const todayEndMs = new Date(todayEndIso).getTime();
  for (const post of pipelineDraftsAndQa) {
    if (feedbackPostIds.has(post.id)) continue;

    const isInternalQa = post.status === "internal_review";
    const isDueOrOverdue =
      post.scheduled_publish_date &&
      new Date(post.scheduled_publish_date).getTime() <= todayEndMs;

    if (!isInternalQa && !isDueOrOverdue) continue;

    const client = (post.engagements as any)?.clients;
    const clientName = client?.name || "Client";
    const founderName = client?.founder_name || "Founder";
    const founderPhone = client?.founder_phone || "+919876543210";
    const token = (client?.id && tokenMap.get(client.id)) || "";
    const clientContext = client?.client_contexts?.[0];
    const tabooWords = clientContext?.taboo_words || [];
    const voiceGuidelines = clientContext?.voice_guidelines || "";

    alerts.push({
      id: isInternalQa ? `alert-qa-${post.id}` : `alert-stalled-${post.id}`,
      urgency: isDueOrOverdue ? "urgent" : "warning",
      title: isInternalQa
        ? `${clientName}: Ready for Internal Voice QA`
        : `${clientName}: Draft Behind Schedule`,
      reason: isInternalQa
        ? `"${post.title}" is in Voice & QA waiting for editorial sign-off before dispatching to ${founderName}.`
        : `"${post.title}" is scheduled for release but is still in Draft.`,
      waiting_on: isInternalQa ? "Editorial QA (Sudeesh)" : "Assigned Writer",
      entity_id: post.id,
      post_id: post.id,
      post_title: post.title,
      post_status: post.status,
      body_markdown: post.body_markdown,
      client_id: client?.id,
      client_name: clientName,
      founder_name: founderName,
      founder_phone: founderPhone,
      linkedin_url: client?.linkedin_url || undefined,
      website_url: client?.website_url || undefined,
      review_token: token,
      target_pillar: post.target_pillar,
      scheduled_publish_date: post.scheduled_publish_date,
      post_created_at: post.created_at,
      taboo_words: tabooWords,
      voice_guidelines: voiceGuidelines,
      entity_type: "content_item",
      next_action: isInternalQa ? "QA & Send to Founder" : "Open in Studio",
    });
  }

  // Enrich content alerts with revision diff metadata (previous_body_markdown, version numbers)
  await Promise.all(
    alerts.map(async (alert) => {
      if (
        (alert.entity_type === "content_feedback" || alert.entity_type === "content_item") &&
        alert.post_id &&
        alert.body_markdown
      ) {
        const revs = await fetchPostRevisions(supabase, alert.post_id, {
          id: alert.post_id,
          title: alert.post_title || "Perspective",
          body_markdown: alert.body_markdown,
          target_pillar: alert.target_pillar,
          status: (alert.post_status || "draft") as ContentStatus,
          created_at: alert.post_created_at,
          feedbackItems: postFeedbackLookup.get(alert.post_id) || [],
        });
        alert.current_version_number = revs[0]?.version_number || 1;
        const priorDiffRev = revs.find(
          (r) => (r.body_markdown || "").trim() !== (alert.body_markdown || "").trim()
        );
        if (priorDiffRev) {
          alert.previous_version_number = priorDiffRev.version_number;
          alert.previous_body_markdown = priorDiffRev.body_markdown;
        }
      }
    })
  );

  return alerts;
}
