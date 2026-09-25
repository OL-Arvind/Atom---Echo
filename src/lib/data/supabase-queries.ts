import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayDateStringIST, toDateStringIST } from "@/lib/date-utils";

export async function getClientsFromDb() {
  try {
    const supabase = createAdminClient();
    const { data: clients, error } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        founder_name,
        founder_title,
        founder_email,
        founder_phone,
        linkedin_url,
        website_url,
        status,
        created_at,
        engagements (
          id,
          service_type,
          status,
          monthly_retainer,
          billing_frequency,
          billing_anchor_day,
          start_date,
          renewal_date,
          content_items (
            id,
            status,
            scheduled_publish_date
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !clients || clients.length === 0) {
      return [];
    }

    return clients;
  } catch (err) {
    console.error("Error fetching clients from Supabase:", err);
    return [];
  }
}

export async function getClientByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      const { data: client, error } = await supabase
        .from("clients")
        .select(`
          id,
          name,
          founder_name,
          founder_title,
          founder_email,
          founder_phone,
          linkedin_url,
          website_url,
          status,
          created_at,
          engagements (
            id,
            service_type,
            status,
            monthly_retainer,
            billing_frequency,
            billing_anchor_day,
            start_date,
            renewal_date
          ),
          client_contexts (
            id,
            positioning_statement,
            target_audience_icp,
            tone_archetype,
            voice_guidelines,
            taboo_words,
            core_pillars
          )
        `)
        .eq("id", id)
        .single();

      if (!error && client) {
        const engagementIds = (client.engagements || []).map((e: { id: string }) => e.id);
        const nowIso = new Date().toISOString();

        const [postsRes, toolsRes, requestsRes, credsRes, tokensRes] = await Promise.all([
          engagementIds.length > 0
            ? supabase
                .from("content_items")
                .select("*")
                .in("engagement_id", engagementIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
          engagementIds.length > 0
            ? supabase
                .from("tool_expenses")
                .select("*")
                .in("engagement_id", engagementIds)
                .order("incurred_date", { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase
            .from("client_requests")
            .select("*")
            .eq("client_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("credentials")
            .select("id, client_id, platform, username_or_email, two_factor_method, notes, created_at")
            .eq("client_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("review_tokens")
            .select("id, token_hash, expires_at, revoked, last_accessed_at")
            .eq("client_id", id)
            .eq("revoked", false)
            .gt("expires_at", nowIso)
            .order("created_at", { ascending: false }),
        ]);

        return {
          ...client,
          context: Array.isArray(client.client_contexts)
            ? client.client_contexts[0]
            : client.client_contexts,
          content_items: postsRes.data || [],
          tool_expenses: toolsRes.data || [],
          client_requests: requestsRes.data || [],
          credentials: credsRes.data || [],
          review_tokens: tokensRes.data || [],
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Error in getClientByIdFromDb:", err);
    return null;
  }
}

export async function getCommandCenterDataFromDb() {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const todayStr = getTodayDateStringIST();
    const todayDate = new Date();
    const fiveDaysFromNowStr = toDateStringIST(new Date(todayDate.getTime() + 5 * 86400000));

    // Execute all 10 independent queries concurrently via Promise.all
    const [
      clientsRes,
      engagementsRes,
      reviewPostsRes,
      scheduledPostsRes,
      unbilledExpensesRes,
      urgentRequestsRes,
      reviewTokensRes,
      unresolvedFeedbackRes,
      renewingToolsRes,
      draftInvoicesRes,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, founder_name, founder_phone, status, website_url"),
      supabase
        .from("engagements")
        .select("id, client_id, service_type, monthly_retainer, status, billing_anchor_day")
        .eq("status", "active"),
      supabase
        .from("content_items")
        .select(`
          id,
          title,
          status,
          target_pillar,
          body_markdown,
          scheduled_publish_date,
          created_at,
          engagements (
            id,
            clients (
              id,
              name,
              founder_name,
              founder_phone
            )
          )
        `)
        .eq("status", "client_review"),
      supabase
        .from("content_items")
        .select(`
          id,
          title,
          status,
          target_pillar,
          scheduled_publish_date,
          body_markdown,
          engagements (
            clients (
              name,
              founder_name
            )
          )
        `)
        .in("status", ["scheduled", "published"])
        .order("scheduled_publish_date", { ascending: true })
        .limit(6),
      supabase
        .from("tool_expenses")
        .select(`
          id,
          description,
          amount,
          currency,
          incurred_date,
          status,
          engagements (
            id,
            clients (
              id,
              name
            )
          )
        `)
        .eq("status", "unbilled"),
      supabase
        .from("client_requests")
        .select(`
          id,
          title,
          description,
          category,
          priority,
          status,
          created_at,
          clients (
            id,
            name,
            founder_name
          )
        `)
        .in("status", ["submitted", "in_progress"])
        .order("priority", { ascending: false }),
      supabase
        .from("review_tokens")
        .select("client_id, token_hash, expires_at")
        .eq("revoked", false)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),
      supabase
        .from("content_feedback")
        .select(`
          id,
          comment,
          author_name,
          author_type,
          created_at,
          is_resolved,
          content_items (
            id,
            title,
            body_markdown,
            target_pillar,
            status,
            engagements (
              id,
              clients (
                id,
                name,
                founder_name,
                founder_phone
              )
            )
          )
        `)
        .eq("is_resolved", false)
        .eq("author_type", "client")
        .order("created_at", { ascending: false }),
      supabase
        .from("tool_subscriptions")
        .select("id, tool_name, cost_amount, currency, next_renewal_date, default_pass_through")
        .gte("next_renewal_date", todayStr)
        .lte("next_renewal_date", fiveDaysFromNowStr)
        .order("next_renewal_date", { ascending: true }),
      supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total_amount,
          subtotal_amount,
          tax_amount,
          due_date,
          created_at,
          engagements (
            id,
            service_type,
            monthly_retainer,
            clients (
              id,
              name,
              founder_name,
              founder_phone,
              founder_email
            )
          ),
          invoice_line_items (
            id,
            description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq("status", "draft")
        .order("created_at", { ascending: false }),
    ]);

    const clients = clientsRes.data || [];
    const activeClients = clients.filter((c) => c.status === "active");

    const activeEngagements = engagementsRes.data || [];
    const mrrTotal = activeEngagements.reduce((acc, e) => acc + Number(e.monthly_retainer || 0), 0);
    const brandingCount = activeEngagements.filter((e) => e.service_type === "linkedin_branding").length;
    const outreachCount = activeEngagements.filter((e) => e.service_type === "cold_outreach").length;

    const reviewPosts = reviewPostsRes.data || [];
    const scheduledPosts = scheduledPostsRes.data || [];
    const unbilledExpenses = unbilledExpensesRes.data || [];
    const urgentRequests = urgentRequestsRes.data || [];
    const reviewTokens = reviewTokensRes.data || [];
    const unresolvedFeedback = unresolvedFeedbackRes.data || [];
    const renewingTools = renewingToolsRes.data || [];
    const draftInvoices = draftInvoicesRes.data || [];

    const totalLeakage = unbilledExpenses.reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const tokenMap = new Map<string, string>();
    for (const t of reviewTokens) {
      if (!tokenMap.has(t.client_id)) {
        tokenMap.set(t.client_id, t.token_hash);
      }
    }

    // Derive operational alerts dynamically from actual records
    const alerts: any[] = [];

    // Alert 0: Client Content Revision Feedback (Immediate Action Required)
    for (const fb of unresolvedFeedback) {
      const post = fb.content_items as any;
      const client = (post?.engagements as any)?.clients;
      const clientName = client?.name || "Client";
      const founderName = fb.author_name || client?.founder_name || "Founder";
      const founderPhone = client?.founder_phone || "+919876543210";
      const postTitle = post?.title || "Thought Leadership Post";
      const token = (client?.id && tokenMap.get(client.id)) || "";

      alerts.push({
        id: `alert-feedback-${fb.id}`,
        urgency: "urgent",
        title: `${founderName} (${clientName}): Revision Requested`,
        reason: fb.comment || `Client requested changes on "${postTitle}".`,
        waiting_on: "Team revision (Nikhil)",
        entity_id: fb.id,
        feedback_id: fb.id,
        post_id: post?.id,
        post_title: postTitle,
        post_status: post?.status,
        body_markdown: post?.body_markdown,
        target_pillar: post?.target_pillar,
        client_id: client?.id,
        client_name: clientName,
        founder_name: founderName,
        founder_phone: founderPhone,
        review_token: token,
        comment: fb.comment,
        feedback_created_at: fb.created_at,
        entity_type: "content_feedback",
        next_action: "Revise Post",
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

      alerts.push({
        id: `alert-post-${post.id}`,
        urgency: "warning",
        title: `${founderName} (${clientName}): Post Waiting for Review`,
        reason: `Post "${post.title}" is waiting for client approval before scheduling.`,
        waiting_on: founderName,
        entity_id: post.id,
        client_id: client?.id,
        founder_name: founderName,
        founder_phone: founderPhone,
        review_token: token,
        post_title: post.title,
        body_markdown: post.body_markdown,
        target_pillar: post.target_pillar,
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

    return {
      activeClientsCount: activeClients.length,
      pendingReviewCount: reviewPosts.length + unresolvedFeedback.length,
      unbilledExpensesTotal: totalLeakage,
      mrrTotal,
      brandingCount,
      outreachCount,
      alerts,
      clients,
      reviewPosts,
      unresolvedFeedback,
      scheduledPosts,
      unbilledExpenses,
    };
  } catch (err) {
    console.error("Error in getCommandCenterDataFromDb:", err);
    return {
      activeClientsCount: 0,
      pendingReviewCount: 0,
      unbilledExpensesTotal: 0,
      mrrTotal: 0,
      brandingCount: 0,
      outreachCount: 0,
      alerts: [],
      clients: [],
      reviewPosts: [],
      unresolvedFeedback: [],
      scheduledPosts: [],
      unbilledExpenses: [],
    };
  }
}

export interface ReviewPortalData {
  valid: boolean;
  reason?: "not_found" | "revoked" | "expired";
  client: {
    id: string;
    name: string;
    founder_name: string;
    founder_title?: string;
    founder_email?: string;
    founder_phone?: string;
    linkedin_url?: string;
  } | null;
  pendingPosts: Array<{
    id: string;
    title: string;
    body_markdown: string;
    target_pillar?: string;
    scheduled_publish_date?: string;
    created_at: string;
  }>;
  approvedPosts: Array<{
    id: string;
    title: string;
    body_markdown: string;
    target_pillar?: string;
    scheduled_publish_date?: string;
    created_at: string;
    status: string;
  }>;
  publishedPosts: Array<{
    id: string;
    title: string;
    body_markdown: string;
    target_pillar?: string;
    published_at?: string;
    linkedin_post_url?: string;
    created_at: string;
    status: string;
  }>;
  token: string;
  tokenRecord?: any;
}

export async function getReviewPortalDataByToken(token: string): Promise<ReviewPortalData> {
  const emptyResult: ReviewPortalData = {
    valid: false,
    reason: "not_found",
    client: null,
    pendingPosts: [],
    approvedPosts: [],
    publishedPosts: [],
    token: token || "",
  };

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return emptyResult;
  }

  try {
    const supabase = createAdminClient();
    const cleanToken = token.trim();
    const hashed = crypto.createHash("sha256").update(cleanToken).digest("hex");

    // 1. Fetch token record
    const { data: tokenRecord, error: tokenErr } = await supabase
      .from("review_tokens")
      .select(`
        id,
        client_id,
        token_hash,
        expires_at,
        revoked,
        created_at
      `)
      .or(`token_hash.eq.${hashed},token_hash.eq.${cleanToken}`)
      .maybeSingle();

    if (tokenErr || !tokenRecord) {
      return { ...emptyResult, reason: "not_found" };
    }

    if (tokenRecord.revoked) {
      return { ...emptyResult, reason: "revoked", tokenRecord };
    }

    const expiresAt = new Date(tokenRecord.expires_at).getTime();
    if (expiresAt <= Date.now()) {
      return { ...emptyResult, reason: "expired", tokenRecord };
    }

    // Fire-and-forget update of last_accessed_at
    Promise.resolve(
      supabase
        .from("review_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", tokenRecord.id)
    ).catch(() => {});

    // 2 & 3. Fetch client details and engagements concurrently
    const [clientRes, engagementsRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, founder_name, founder_title, founder_email, founder_phone, linkedin_url")
        .eq("id", tokenRecord.client_id)
        .single(),
      supabase
        .from("engagements")
        .select("id")
        .eq("client_id", tokenRecord.client_id),
    ]);

    const client = clientRes.data;
    if (clientRes.error || !client) {
      return { ...emptyResult, reason: "not_found" };
    }

    const engagementIds = (engagementsRes.data || []).map((e) => e.id);

    if (engagementIds.length === 0) {
      return {
        valid: true,
        client,
        pendingPosts: [],
        approvedPosts: [],
        publishedPosts: [],
        token: cleanToken,
        tokenRecord,
      };
    }

    // 4. Fetch all relevant content items for this client's engagements
    const { data: allItems } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        body_markdown,
        target_pillar,
        status,
        scheduled_publish_date,
        published_at,
        linkedin_post_url,
        created_at
      `)
      .in("engagement_id", engagementIds)
      .in("status", ["client_review", "approved", "scheduled", "published"])
      .order("created_at", { ascending: false });

    const items = allItems || [];

    const pendingPosts = items
      .filter((i) => i.status === "client_review")
      .map((i) => ({
        id: i.id,
        title: i.title,
        body_markdown: i.body_markdown,
        target_pillar: i.target_pillar || undefined,
        scheduled_publish_date: i.scheduled_publish_date || undefined,
        created_at: i.created_at,
      }));

    const approvedPosts = items
      .filter((i) => i.status === "approved" || i.status === "scheduled")
      .sort((a, b) => {
        const dateA = a.scheduled_publish_date ? new Date(a.scheduled_publish_date).getTime() : 0;
        const dateB = b.scheduled_publish_date ? new Date(b.scheduled_publish_date).getTime() : 0;
        return dateA - dateB;
      })
      .map((i) => ({
        id: i.id,
        title: i.title,
        body_markdown: i.body_markdown,
        target_pillar: i.target_pillar || undefined,
        scheduled_publish_date: i.scheduled_publish_date || undefined,
        created_at: i.created_at,
        status: i.status,
      }));

    const publishedPosts = items
      .filter((i) => i.status === "published")
      .map((i) => ({
        id: i.id,
        title: i.title,
        body_markdown: i.body_markdown,
        target_pillar: i.target_pillar || undefined,
        published_at: i.published_at || undefined,
        linkedin_post_url: i.linkedin_post_url || undefined,
        created_at: i.created_at,
        status: i.status,
      }));

    return {
      valid: true,
      client,
      pendingPosts,
      approvedPosts,
      publishedPosts,
      token: cleanToken,
      tokenRecord,
    };
  } catch (err) {
    console.error("Error in getReviewPortalDataByToken:", err);
    return emptyResult;
  }
}

export async function getReviewPostByToken(token: string) {
  try {
    const portalData = await getReviewPortalDataByToken(token);
    if (!portalData.valid || !portalData.client) {
      return null;
    }

    return {
      tokenRecord: portalData.tokenRecord,
      client: portalData.client,
      post: portalData.pendingPosts[0] || null,
      pendingCount: portalData.pendingPosts.length,
      pendingPosts: portalData.pendingPosts,
      approvedPosts: portalData.approvedPosts,
    };
  } catch (err) {
    console.error("Error in getReviewPostByToken:", err);
    return null;
  }
}

export async function getContentStudioDataFromDb() {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const [postsRes, engagementsRes, tokensRes] = await Promise.all([
      supabase
        .from("content_items")
        .select(`
          id,
          title,
          body_markdown,
          target_pillar,
          status,
          scheduled_publish_date,
          published_at,
          linkedin_post_url,
          created_at,
          engagements (
            id,
            service_type,
            clients (
              id,
              name,
              founder_name,
              founder_phone,
              client_contexts (
                taboo_words
              )
            )
          ),
          content_feedback (
            id,
            comment,
            author_name,
            created_at
          )
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("engagements")
        .select(`
          id,
          service_type,
          clients (
            id,
            name,
            founder_name,
            client_contexts (
              taboo_words
            )
          )
        `)
        .eq("status", "active"),
      supabase
        .from("review_tokens")
        .select("client_id, token_hash, expires_at")
        .eq("revoked", false)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),
    ]);

    const formattedEngagements = (engagementsRes.data || []).map((eng: any) => {
      const client = eng.clients;
      const ctx = Array.isArray(client?.client_contexts)
        ? client.client_contexts[0]
        : client?.client_contexts;
      return {
        id: eng.id,
        clientName: client?.name || "Client",
        founderName: client?.founder_name || "Founder",
        serviceType: eng.service_type,
        tabooWords: ctx?.taboo_words || [],
      };
    });

    const tokenMap: Record<string, string> = {};
    for (const t of tokensRes.data || []) {
      if (!tokenMap[t.client_id]) {
        tokenMap[t.client_id] = t.token_hash;
      }
    }

    return {
      posts: postsRes.data || [],
      engagements: formattedEngagements,
      tokenMap,
    };
  } catch (err) {
    console.error("Error in getContentStudioDataFromDb:", err);
    return {
      posts: [],
      engagements: [],
      tokenMap: {},
    };
  }
}

export async function getBillingDataFromDb() {
  try {
    const supabase = createAdminClient();

    const [expensesRes, invoicesRes, clientsRes, toolSubscriptionsRes] = await Promise.all([
      supabase
        .from("tool_expenses")
        .select(`
          id,
          description,
          amount,
          currency,
          incurred_date,
          status,
          engagements (
            id,
            service_type,
            monthly_retainer,
            clients (
              id,
              name,
              founder_name
            )
          )
        `)
        .order("incurred_date", { ascending: false }),
      supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          subtotal_amount,
          total_amount,
          status,
          created_at,
          engagements (
            clients (
              id,
              name,
              founder_name
            )
          ),
          invoice_line_items (
            id,
            description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select(`
          id,
          name,
          founder_name,
          engagements (
            id,
            service_type,
            monthly_retainer
          )
        `)
        .eq("status", "active"),
      supabase
        .from("tool_subscriptions")
        .select("*")
        .order("next_renewal_date", { ascending: true }),
    ]);

    return {
      expenses: expensesRes.data || [],
      invoices: invoicesRes.data || [],
      clients: clientsRes.data || [],
      toolSubscriptions: toolSubscriptionsRes.data || [],
    };
  } catch (err) {
    console.error("Error in getBillingDataFromDb:", err);
    return {
      expenses: [],
      invoices: [],
      clients: [],
      toolSubscriptions: [],
    };
  }
}

export async function getToolSubscriptionsFromDb() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tool_subscriptions")
      .select("*")
      .order("next_renewal_date", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("Error fetching tool subscriptions:", err);
    return [];
  }
}

export async function getInvoiceByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(`
        id,
        engagement_id,
        invoice_number,
        issue_date,
        due_date,
        subtotal_amount,
        tax_amount,
        total_amount,
        currency,
        status,
        paid_at,
        created_at,
        engagements (
          id,
          service_type,
          monthly_retainer,
          billing_anchor_day,
          clients (
            id,
            name,
            founder_name,
            founder_title,
            founder_email,
            founder_phone,
            linkedin_url
          )
        ),
        invoice_line_items (
          id,
          invoice_id,
          tool_expense_id,
          description,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("id", id)
      .single();

    if (error || !invoice) return null;

    return invoice;
  } catch (err) {
    console.error("Error fetching invoice by id:", err);
    return null;
  }
}

export async function getOperationsDataFromDb() {
  try {
    const supabase = createAdminClient();

    const [credLogsRes, requestsRes, feedbackRes] = await Promise.all([
      supabase
        .from("credential_audit_logs")
        .select(`
          id,
          action,
          ip_address,
          user_agent,
          created_at,
          credentials (
            platform,
            clients (
              name,
              founder_name
            )
          ),
          users (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("client_requests")
        .select(`
          id,
          title,
          description,
          category,
          priority,
          status,
          created_at,
          clients (
            id,
            name,
            founder_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("content_feedback")
        .select(`
          id,
          comment,
          author_name,
          author_type,
          created_at,
          content_items (
            title,
            engagements (
              clients (
                name
              )
            )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return {
      credentialLogs: credLogsRes.data || [],
      clientRequests: requestsRes.data || [],
      feedback: feedbackRes.data || [],
    };
  } catch (err) {
    console.error("Error in getOperationsDataFromDb:", err);
    return {
      credentialLogs: [],
      clientRequests: [],
      feedback: [],
    };
  }
}

export async function getCalendarDataFromDb() {
  try {
    const supabase = createAdminClient();

    const [contentPostsRes, engagementsRes, toolSubsRes, allClientsRes] = await Promise.all([
      supabase
        .from("content_items")
        .select(`
          id,
          title,
          status,
          target_pillar,
          body_markdown,
          scheduled_publish_date,
          published_at,
          linkedin_post_url,
          created_at,
          engagements (
            id,
            service_type,
            clients (
              id,
              name,
              founder_name,
              founder_title,
              linkedin_url
            )
          )
        `)
        .not("scheduled_publish_date", "is", null)
        .order("scheduled_publish_date", { ascending: true }),
      supabase
        .from("engagements")
        .select(`
          id,
          service_type,
          status,
          monthly_retainer,
          billing_anchor_day,
          start_date,
          renewal_date,
          clients (
            id,
            name,
            founder_name
          )
        `)
        .eq("status", "active"),
      supabase
        .from("tool_subscriptions")
        .select(`
          id,
          tool_name,
          billing_cycle,
          cost_amount,
          currency,
          next_renewal_date,
          default_pass_through
        `)
        .not("next_renewal_date", "is", null),
      supabase
        .from("clients")
        .select("id, name, founder_name")
        .order("name", { ascending: true }),
    ]);

    return {
      contentPosts: contentPostsRes.data || [],
      engagements: engagementsRes.data || [],
      toolSubscriptions: toolSubsRes.data || [],
      clients: allClientsRes.data || [],
    };
  } catch (err) {
    console.error("Error in getCalendarDataFromDb:", err);
    return {
      contentPosts: [],
      engagements: [],
      toolSubscriptions: [],
      clients: [],
    };
  }
}

export async function getContentPostByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();

    const { data: post, error: postErr } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        body_markdown,
        content_format,
        status,
        target_pillar,
        scheduled_publish_date,
        published_at,
        linkedin_post_url,
        created_at,
        updated_at,
        engagements (
          id,
          service_type,
          status,
          monthly_retainer,
          clients (
            id,
            name,
            founder_name,
            founder_title,
            founder_email,
            founder_phone,
            linkedin_url,
            website_url
          )
        )
      `)
      .eq("id", id)
      .single();

    if (postErr || !post) {
      return null;
    }

    const clientId = (post.engagements as any)?.clients?.id;
    const nowIso = new Date().toISOString();

    const [ctxRes, kItemsRes, tokensRes, fbRes] = await Promise.all([
      clientId
        ? supabase
            .from("client_contexts")
            .select("*")
            .eq("client_id", clientId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      clientId
        ? supabase
            .from("knowledge_items")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      clientId
        ? supabase
            .from("review_tokens")
            .select("token_hash, expires_at")
            .eq("client_id", clientId)
            .eq("revoked", false)
            .gt("expires_at", nowIso)
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
      supabase
        .from("content_feedback")
        .select("id, author_type, author_name, comment, created_at")
        .eq("content_item_id", id)
        .order("created_at", { ascending: false }),
    ]);

    const tokens = tokensRes.data || [];

    return {
      post,
      context: ctxRes.data || null,
      knowledgeItems: kItemsRes.data || [],
      feedbackItems: fbRes.data || [],
      reviewToken: tokens.length > 0 ? tokens[0].token_hash : null,
    };
  } catch (err) {
    console.error("Error in getContentPostByIdFromDb:", err);
    return null;
  }
}
