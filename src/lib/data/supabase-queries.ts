import { createAdminClient } from "@/lib/supabase/admin";

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
          renewal_date
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients from Supabase:", error.message);
      return [];
    }

    return clients || [];
  } catch (err) {
    console.error("Error fetching clients from Supabase:", err);
    return [];
  }
}

export async function getClientByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (!isUuid) {
      return null;
    }

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

    if (error || !client) {
      return null;
    }

    const engagementIds = (client.engagements || []).map((e: any) => e.id);
    let contentItems: any[] = [];
    let toolExpenses: any[] = [];
    let clientRequests: any[] = [];

    if (engagementIds.length > 0) {
      const { data: posts } = await supabase
        .from("content_items")
        .select("*")
        .in("engagement_id", engagementIds)
        .order("created_at", { ascending: false });
      if (posts) contentItems = posts;

      const { data: tools } = await supabase
        .from("tool_expenses")
        .select("*")
        .in("engagement_id", engagementIds)
        .order("incurred_date", { ascending: false });
      if (tools) toolExpenses = tools;
    }

    const { data: requests } = await supabase
      .from("client_requests")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });
    if (requests) clientRequests = requests;

    return {
      ...client,
      context: Array.isArray(client.client_contexts)
        ? client.client_contexts[0]
        : client.client_contexts,
      content_items: contentItems,
      tool_expenses: toolExpenses,
      client_requests: clientRequests,
    };
  } catch (err) {
    console.error("Error in getClientByIdFromDb:", err);
    return null;
  }
}

export async function getCommandCenterDataFromDb() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch active clients count and list
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, founder_name, status");

    const activeClients = clients?.filter((c) => c.status === "active") || [];

    // 2. Fetch posts in client review
    const { data: reviewPosts } = await supabase
      .from("content_items")
      .select(`
        id,
        title,
        status,
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
      .eq("status", "client_review");

    // 3. Fetch unbilled tool expenses
    const { data: unbilledExpenses } = await supabase
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
      .eq("status", "unbilled");

    const totalLeakage = (unbilledExpenses || []).reduce((acc, t) => acc + Number(t.amount || 0), 0);

    // 4. Fetch urgent client requests
    const { data: urgentRequests } = await supabase
      .from("client_requests")
      .select(`
        id,
        title,
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
      .order("priority", { ascending: false });

    // Derive operational alerts dynamically from actual records
    const alerts: any[] = [];

    // Alert 1: Urgent Client Requests (Emergency holds, tone pivots)
    for (const req of urgentRequests || []) {
      const clientName = (req.clients as any)?.name || "Client";
      alerts.push({
        id: `alert-req-${req.id}`,
        urgency: req.priority === "urgent" ? "critical" : "warning",
        title: `${clientName}: ${req.title}`,
        reason: `Client submitted an urgent request in category '${req.category}'. Requires triage.`,
        waiting_on: "Operator triage",
        entity_id: req.id,
        entity_type: "client_request",
        next_action: "Review Request",
      });
    }

    // Alert 2: Posts pending client review
    for (const post of reviewPosts || []) {
      const client = (post.engagements as any)?.clients;
      const clientName = client?.name || "Client";
      const founderName = client?.founder_name || "Founder";
      alerts.push({
        id: `alert-post-${post.id}`,
        urgency: "warning",
        title: `${founderName} (${clientName}): Post Pending Client Review`,
        reason: `Post "${post.title}" is awaiting client feedback before scheduling.`,
        waiting_on: founderName,
        entity_id: post.id,
        entity_type: "content_item",
        next_action: "Copy WhatsApp Link",
      });
    }

    // Alert 3: Unbilled tool expenses
    if (totalLeakage > 0) {
      alerts.push({
        id: "alert-tool-leakage",
        urgency: "info",
        title: `Unbilled Third-Party Tool Costs (₹${totalLeakage.toLocaleString("en-IN")})`,
        reason: `${unbilledExpenses?.length} unbilled tool expenses detected across active client engagements.`,
        waiting_on: "Monthly Invoice Draft",
        entity_id: "billing",
        entity_type: "billing",
        next_action: "Draft Invoices",
      });
    }

    return {
      activeClientsCount: activeClients.length,
      pendingReviewCount: (reviewPosts || []).length,
      unbilledExpensesTotal: totalLeakage,
      alerts,
      clients: clients || [],
      reviewPosts: reviewPosts || [],
      unbilledExpenses: unbilledExpenses || [],
    };
  } catch (err) {
    console.error("Error in getCommandCenterDataFromDb:", err);
    return {
      activeClientsCount: 0,
      pendingReviewCount: 0,
      unbilledExpensesTotal: 0,
      alerts: [],
      clients: [],
      reviewPosts: [],
      unbilledExpenses: [],
    };
  }
}

export async function getReviewPostByToken(token: string) {
  try {
    const supabase = createAdminClient();
    const { data: tokenRecord, error: tokenErr } = await supabase
      .from("review_tokens")
      .select(`
        id,
        token_hash,
        expires_at,
        revoked,
        clients (
          id,
          name,
          founder_name,
          engagements (
            id,
            service_type,
            content_items (
              id,
              title,
              body_markdown,
              status,
              target_pillar,
              scheduled_publish_date
            )
          )
        )
      `)
      .eq("token_hash", token)
      .eq("revoked", false)
      .single();

    if (tokenErr || !tokenRecord) {
      return null;
    }

    const client = tokenRecord.clients as any;
    let reviewItem: any = null;

    if (client && client.engagements) {
      for (const eng of client.engagements) {
        if (eng.content_items) {
          const found = eng.content_items.find((item: any) => item.status === "client_review");
          if (found) {
            reviewItem = found;
            break;
          }
        }
      }
    }

    return {
      tokenRecord,
      client,
      post: reviewItem,
    };
  } catch (err) {
    console.error("Error in getReviewPostByToken:", err);
    return null;
  }
}
