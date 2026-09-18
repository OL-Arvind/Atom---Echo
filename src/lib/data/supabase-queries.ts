import { createAdminClient } from "@/lib/supabase/admin";
import { INITIAL_CLIENTS, INITIAL_CONTENT_ITEMS, INITIAL_TOOL_EXPENSES, INITIAL_ALERTS } from "./seed-data";

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

    if (error || !clients || clients.length === 0) {
      console.warn("Falling back to in-memory initial clients:", error?.message);
      return INITIAL_CLIENTS;
    }

    return clients;
  } catch (err) {
    console.error("Error fetching clients from Supabase:", err);
    return INITIAL_CLIENTS;
  }
}

export async function getClientByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();

    // Check if id matches a UUID or if we need to look up by name/fallback
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from("clients").select(`
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
    `);

    if (isUuid) {
      query = query.eq("id", id);
    } else {
      // Allow slug/prefix match like 'client-chetan' matching 'Debtworks'
      if (id.includes("chetan")) query = query.ilike("name", "%Debtworks%");
      else if (id.includes("florian")) query = query.ilike("name", "%Florian%");
      else if (id.includes("orbit")) query = query.ilike("name", "%Orbit%");
      else query = query.eq("id", id);
    }

    const { data: client, error } = await query.single();

    if (error || !client) {
      // Fallback to in-memory seed data
      return INITIAL_CLIENTS.find((c) => c.id === id) || null;
    }

    // Fetch related content items and expenses for this client's engagements
    const engagementIds = (client.engagements || []).map((e: any) => e.id);
    
    let contentItems: any[] = [];
    let toolExpenses: any[] = [];

    if (engagementIds.length > 0) {
      const { data: posts } = await supabase
        .from("content_items")
        .select("*")
        .in("engagement_id", engagementIds);
      if (posts) contentItems = posts;

      const { data: tools } = await supabase
        .from("tool_expenses")
        .select("*")
        .in("engagement_id", engagementIds);
      if (tools) toolExpenses = tools;
    }

    return {
      ...client,
      context: Array.isArray(client.client_contexts)
        ? client.client_contexts[0]
        : client.client_contexts,
      content_items: contentItems,
      tool_expenses: toolExpenses,
    };
  } catch (err) {
    console.error("Error in getClientByIdFromDb:", err);
    return INITIAL_CLIENTS.find((c) => c.id === id) || null;
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

    // Find the pending review post
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
