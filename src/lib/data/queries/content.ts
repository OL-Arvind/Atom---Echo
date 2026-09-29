import { createAdminClient } from "@/lib/supabase/admin";
import { unpackMeetingRecord } from "@/lib/meetings/utils";
import { fetchPostRevisions } from "@/lib/revisions/storage";
import type { ContentStatus } from "@/types/domain";
import { withDbCache } from "./cache";

export async function getContentStudioDataFromDb() {
  return withDbCache("content_studio_data", async () => {
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
              author_type,
              is_resolved,
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
                taboo_words,
                core_pillars
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
          clientId: client?.id,
          clientName: client?.name || "Client",
          founderName: client?.founder_name || "Founder",
          serviceType: eng.service_type,
          tabooWords: ctx?.taboo_words || [],
          corePillars: ctx?.core_pillars || [],
          clients: client ? { id: client.id, name: client.name } : null,
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
  });
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

    const [ctxRes, kItemsRes, tokensRes, fbRes, meetingsRes] = await Promise.all([
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
        .select("id, author_type, author_name, comment, is_resolved, created_at")
        .eq("content_item_id", id)
        .order("created_at", { ascending: false }),
      clientId
        ? supabase
            .from("meetings")
            .select("*")
            .eq("client_id", clientId)
            .order("meeting_date", { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
    ]);

    const tokens = tokensRes.data || [];
    const rawMeetings = meetingsRes.data || [];
    const latestMeetings = rawMeetings.map((m: any) =>
      unpackMeetingRecord(m, kItemsRes.data || [])
    );
    const feedbackItems = fbRes.data || [];
    const revisions = await fetchPostRevisions(supabase, id, {
      id: post.id,
      title: post.title,
      body_markdown: post.body_markdown || "",
      target_pillar: post.target_pillar,
      status: (post.status || "draft") as ContentStatus,
      created_at: post.created_at,
      updated_at: post.updated_at,
      feedbackItems,
    });

    return {
      post,
      context: ctxRes.data || null,
      knowledgeItems: kItemsRes.data || [],
      feedbackItems,
      revisions,
      reviewToken: tokens.length > 0 ? tokens[0].token_hash : null,
      latestMeetings,
    };
  } catch (err) {
    console.error("Error in getContentPostByIdFromDb:", err);
    return null;
  }
}

export async function getNewContentStudioDataFromDb() {
  try {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const [engagementsRes, kItemsRes, meetingsRes, tokensRes] = await Promise.all([
      supabase
        .from("engagements")
        .select(`
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
            website_url,
            client_contexts (
              id,
              client_id,
              positioning_statement,
              target_audience_icp,
              tone_archetype,
              voice_guidelines,
              taboo_words,
              core_pillars
            )
          )
        `)
        .eq("status", "active"),
      supabase
        .from("knowledge_items")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("meetings")
        .select("*")
        .order("meeting_date", { ascending: false }),
      supabase
        .from("review_tokens")
        .select("client_id, token_hash, expires_at")
        .eq("revoked", false)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false }),
    ]);

    const allKnowledge = kItemsRes.data || [];
    const allMeetings = (meetingsRes.data || []).map((m: any) =>
      unpackMeetingRecord(
        m,
        allKnowledge.filter((k: any) => k.client_id === m.client_id)
      )
    );

    const tokenMap: Record<string, string> = {};
    for (const t of tokensRes.data || []) {
      if (!tokenMap[t.client_id]) {
        tokenMap[t.client_id] = t.token_hash;
      }
    }

    const clientOptions = (engagementsRes.data || [])
      .filter((e: any) => e.clients?.id)
      .map((eng: any) => {
        const client = eng.clients;
        const ctx = Array.isArray(client.client_contexts)
          ? client.client_contexts[0] || null
          : client.client_contexts || null;

        return {
          engagementId: eng.id,
          serviceType: eng.service_type,
          client: {
            id: client.id,
            name: client.name,
            founder_name: client.founder_name,
            founder_title: client.founder_title,
            founder_email: client.founder_email,
            founder_phone: client.founder_phone,
            linkedin_url: client.linkedin_url,
            website_url: client.website_url,
          },
          context: ctx,
          knowledgeItems: allKnowledge.filter((k: any) => k.client_id === client.id),
          latestMeetings: allMeetings
            .filter((m: any) => m.client_id === client.id)
            .slice(0, 5),
          reviewToken: tokenMap[client.id] || null,
        };
      });

    return { clientOptions };
  } catch (err) {
    console.error("Error in getNewContentStudioDataFromDb:", err);
    return { clientOptions: [] };
  }
}
