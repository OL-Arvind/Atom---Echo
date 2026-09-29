import { createAdminClient } from "@/lib/supabase/admin";
import { fetchClientDocuments } from "@/lib/documents/storage";
import { unpackMeetingRecord } from "@/lib/meetings/utils";
import { withDbCache } from "./cache";

export async function getClientsFromDb() {
  return withDbCache("clients_all", async () => {
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
            client_id,
            service_type,
            status,
            monthly_retainer,
            billing_frequency,
            billing_anchor_day,
            start_date,
            renewal_date,
            content_items (
              id,
              title,
              status,
              scheduled_publish_date,
              created_at
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
  });
}

export async function getClientRosterDataFromDb() {
  return withDbCache("clients_roster_data", async () => {
    try {
      const supabase = createAdminClient();
      const nowIso = new Date().toISOString();

      const [clientsRes, tokensRes] = await Promise.all([
        supabase
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
              client_id,
              service_type,
              status,
              monthly_retainer,
              billing_frequency,
              billing_anchor_day,
              start_date,
              renewal_date,
              content_items (
                id,
                title,
                status,
                scheduled_publish_date,
                created_at
              )
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("review_tokens")
          .select("client_id, token_hash, expires_at")
          .eq("revoked", false)
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false }),
      ]);

      const clients = (clientsRes.data || []) as unknown as any[];
      const tokenMap: Record<string, string> = {};
      for (const t of tokensRes.data || []) {
        if (!tokenMap[t.client_id]) {
          tokenMap[t.client_id] = t.token_hash;
        }
      }

      return {
        clients,
        tokenMap,
      };
    } catch (err) {
      console.error("Error fetching client roster data:", err);
      return { clients: [], tokenMap: {} };
    }
  });
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
            client_id,
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

        const [
          postsRes,
          toolsRes,
          requestsRes,
          credsRes,
          tokensRes,
          meetingsRes,
          knowledgeRes,
          documentsList,
          invoicesRes,
        ] = await Promise.all([
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
          supabase
            .from("meetings")
            .select("*")
            .eq("client_id", id)
            .order("meeting_date", { ascending: false }),
          supabase
            .from("knowledge_items")
            .select("*")
            .eq("client_id", id)
            .order("created_at", { ascending: false }),
          fetchClientDocuments(supabase, id),
          engagementIds.length > 0
            ? supabase
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
                  invoice_line_items (
                    id,
                    description,
                    quantity,
                    unit_price,
                    total_price
                  )
                `)
                .in("engagement_id", engagementIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
        ]);

        const rawCreds = credsRes.data || [];
        const mappedCreds = rawCreds.map((c: any) => {
          let scope = c.access_scope;
          let cleanNotes = c.notes;
          if (!scope && typeof c.notes === "string") {
            if (c.notes.includes("[scope:client_shared]")) {
              scope = "client_shared";
              cleanNotes = c.notes.replace("[scope:client_shared]", "").trim() || null;
            } else if (c.notes.includes("[scope:agency_only]")) {
              scope = "agency_only";
              cleanNotes = c.notes.replace("[scope:agency_only]", "").trim() || null;
            }
          }
          return {
            ...c,
            notes: cleanNotes,
            access_scope: scope || "agency_only",
          };
        });

        const rawKnowledge = knowledgeRes.data || [];
        const rawMeetings = meetingsRes.data || [];
        const mappedMeetings = rawMeetings.map((m: any) => unpackMeetingRecord(m, rawKnowledge));
        const mappedInvoices = (invoicesRes.data || []).map((inv: any) => ({
          ...inv,
          line_items: inv.invoice_line_items || [],
        }));

        return {
          ...client,
          context: Array.isArray(client.client_contexts)
            ? client.client_contexts[0]
            : client.client_contexts,
          content_items: postsRes.data || [],
          tool_expenses: toolsRes.data || [],
          client_requests: requestsRes.data || [],
          credentials: mappedCreds,
          review_tokens: tokensRes.data || [],
          meetings: mappedMeetings,
          knowledge_items: rawKnowledge,
          documents: documentsList || [],
          invoices: mappedInvoices,
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Error in getClientByIdFromDb:", err);
    return null;
  }
}
