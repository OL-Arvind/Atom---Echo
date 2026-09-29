import { createAdminClient } from "@/lib/supabase/admin";
import { withDbCache } from "./cache";

export async function getOperationsDataFromDb() {
  return withDbCache("operations_data", async () => {
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
  });
}

export async function getCalendarDataFromDb() {
  return withDbCache("calendar_data", async () => {
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
          .select("id, name, founder_name, founder_email, website_url")
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
  });
}
