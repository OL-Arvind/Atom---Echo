import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPostRevisions } from "@/lib/revisions/storage";
import type { ContentStatus } from "@/types/domain";

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
    last_client_feedback?: string;
    last_client_feedback_at?: string;
    previous_body_markdown?: string;
    version_number?: number;
    previous_version_number?: number;
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
  sharedCredentials: Array<{
    id: string;
    platform: string;
    username_or_email: string;
    two_factor_method?: string | null;
    notes?: string | null;
    access_scope: "client_shared";
    created_at?: string;
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
    sharedCredentials: [],
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

    // 4. Fetch client's shared credentials
    let rawCreds: any[] = [];
    const credsScopeRes = await supabase
      .from("credentials")
      .select("id, platform, username_or_email, two_factor_method, notes, access_scope, created_at")
      .eq("client_id", tokenRecord.client_id)
      .order("created_at", { ascending: false });

    if (credsScopeRes.error && credsScopeRes.error.message?.includes("access_scope")) {
      const fallbackCreds = await supabase
        .from("credentials")
        .select("id, platform, username_or_email, two_factor_method, notes, created_at")
        .eq("client_id", tokenRecord.client_id)
        .order("created_at", { ascending: false });
      rawCreds = fallbackCreds.data || [];
    } else {
      rawCreds = credsScopeRes.data || [];
    }

    const sharedCredentials = rawCreds
      .filter((c: any) => {
        if (c.access_scope === "client_shared") return true;
        if (!c.access_scope && typeof c.notes === "string" && c.notes.includes("[scope:client_shared]")) {
          return true;
        }
        return false;
      })
      .map((c: any) => {
        let cleanNotes = c.notes;
        if (typeof cleanNotes === "string") {
          cleanNotes = cleanNotes
            .replace("[scope:client_shared]", "")
            .replace("[scope:agency_only]", "")
            .trim() || null;
        }
        return {
          id: c.id,
          platform: c.platform,
          username_or_email: c.username_or_email,
          two_factor_method: c.two_factor_method || null,
          notes: cleanNotes,
          access_scope: "client_shared" as const,
          created_at: c.created_at,
        };
      });

    const engagementIds = (engagementsRes.data || []).map((e) => e.id);

    if (engagementIds.length === 0) {
      return {
        valid: true,
        client,
        pendingPosts: [],
        approvedPosts: [],
        publishedPosts: [],
        sharedCredentials,
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
        created_at,
        content_feedback (
          id,
          comment,
          author_type,
          created_at
        )
      `)
      .in("engagement_id", engagementIds)
      .in("status", ["client_review", "approved", "scheduled", "published"])
      .order("created_at", { ascending: false });

    const items = allItems || [];

    const pendingPosts = await Promise.all(
      items
        .filter((i) => i.status === "client_review")
        .map(async (i: any) => {
          const clientNotes = (i.content_feedback || [])
            .filter((fb: any) => fb.author_type === "client" && fb.comment)
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          const latestClientNote = clientNotes[0];

          const revs = await fetchPostRevisions(supabase, i.id, {
            id: i.id,
            title: i.title,
            body_markdown: i.body_markdown || "",
            target_pillar: i.target_pillar,
            status: (i.status || "client_review") as ContentStatus,
            created_at: i.created_at,
            feedbackItems: i.content_feedback || [],
          });

          const priorRev = revs.find(
            (r) => (r.body_markdown || "").trim() !== (i.body_markdown || "").trim()
          );

          return {
            id: i.id,
            title: i.title,
            body_markdown: i.body_markdown,
            target_pillar: i.target_pillar || undefined,
            scheduled_publish_date: i.scheduled_publish_date || undefined,
            created_at: i.created_at,
            last_client_feedback: latestClientNote?.comment || undefined,
            last_client_feedback_at: latestClientNote?.created_at || undefined,
            version_number: revs[0]?.version_number || 1,
            previous_version_number: priorRev?.version_number,
            previous_body_markdown: priorRev?.body_markdown,
          };
        })
    );

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
      sharedCredentials,
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
