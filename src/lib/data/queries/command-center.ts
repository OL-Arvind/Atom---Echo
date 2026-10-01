import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayDateStringIST, toDateStringIST } from "@/lib/date-utils";
import { withDbCache } from "./cache";
import { buildOperationalAlerts } from "./command-center-builder";
import { getOperationalTasksForDate } from "@/lib/tasks/storage";
import type { OperationalTask } from "@/types/domain";

export async function getCommandCenterDataFromDb() {
  return withDbCache("command_center_data", async () => {
    try {
      const supabase = createAdminClient();
      const nowIso = new Date().toISOString();
      const todayStr = getTodayDateStringIST();
      const todayStartIso = `${todayStr}T00:00:00+05:30`;
      const todayEndIso = `${todayStr}T23:59:59+05:30`;
      const todayDate = new Date();
      const fiveDaysFromNowStr = toDateStringIST(new Date(todayDate.getTime() + 5 * 86400000));

      // Execute all independent queries concurrently via Promise.all
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
        stalledDraftsRes,
        teamUsersRes,
        persistedTasks,
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, founder_name, founder_phone, status, website_url, linkedin_url"),
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
            content_feedback (
              id,
              comment,
              author_name,
              author_type,
              is_resolved,
              created_at
            ),
            engagements (
              id,
              clients (
                id,
                name,
                founder_name,
                founder_phone,
                linkedin_url,
                website_url,
                client_contexts (
                  taboo_words,
                  voice_guidelines,
                  positioning_statement
                )
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
          .eq("status", "scheduled")
          .gte("scheduled_publish_date", todayStartIso)
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
              founder_name,
              founder_phone,
              linkedin_url,
              website_url
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
              scheduled_publish_date,
              created_at,
              engagements (
                id,
                clients (
                  id,
                  name,
                  founder_name,
                  founder_phone,
                  linkedin_url,
                  website_url,
                  client_contexts (
                    taboo_words,
                    voice_guidelines,
                    positioning_statement
                  )
                )
              )
            )
          `)
          .eq("is_resolved", false)
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
            content_feedback (
              id,
              comment,
              author_name,
              author_type,
              is_resolved,
              created_at
            ),
            engagements (
              id,
              clients (
                id,
                name,
                founder_name,
                founder_phone,
                linkedin_url,
                website_url,
                client_contexts (
                  taboo_words,
                  voice_guidelines,
                  positioning_statement
                )
              )
            )
          `)
          .in("status", ["draft", "internal_review"])
          .order("created_at", { ascending: false }),
        supabase
          .from("users")
          .select("id, full_name, email, role")
          .eq("is_active", true)
          .order("full_name", { ascending: true }),
        getOperationalTasksForDate(supabase, todayStr),
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
      const pipelineDraftsAndQa = stalledDraftsRes.data || [];

      const teamMembers = (teamUsersRes?.data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name || u.email,
        email: u.email,
        role: u.role,
      }));

      const operationalTasks: OperationalTask[] = [...(persistedTasks || [])];

      // Auto-synthesize 1-min system follow-up tasks for overdue review posts (> 48h)
      const nowMs = Date.now();
      const fortyEightHoursMs = 48 * 3600 * 1000;
      const overduePosts = reviewPosts.filter((p: any) => {
        const sentTime = p.created_at ? new Date(p.created_at).getTime() : 0;
        return sentTime > 0 && nowMs - sentTime > fortyEightHoursMs;
      });

      for (const post of overduePosts) {
        const client = (post.engagements as any)?.clients;
        const founderName = client?.founder_name || "Founder";
        const postTitle = post.title || "Perspective";
        const systemTaskId = `sys-followup-${post.id}`;

        if (!operationalTasks.some((t) => t.id === systemTaskId || t.source_entity_id === post.id)) {
          operationalTasks.push({
            id: systemTaskId,
            organization_id: "system",
            title: `Follow up with ${founderName} on review ("${postTitle}")`,
            estimated_minutes: 1,
            due_date: todayStr,
            assigned_to: null,
            client_id: client?.id || null,
            client_name: client?.name || null,
            is_completed: false,
            completed_at: null,
            source_type: "system_generated",
            source_entity_type: "content_item",
            source_entity_id: post.id,
            created_at: post.created_at || nowIso,
          });
        }
      }

      const totalLeakage = unbilledExpenses.reduce((acc, t) => acc + Number(t.amount || 0), 0);

      const tokenMap = new Map<string, string>();
      for (const t of reviewTokens) {
        if (!tokenMap.has(t.client_id)) {
          tokenMap.set(t.client_id, t.token_hash);
        }
      }

      const alerts = await buildOperationalAlerts({
        supabase,
        todayEndIso,
        reviewPosts,
        scheduledPosts,
        unbilledExpenses,
        urgentRequests,
        reviewTokens,
        unresolvedFeedback,
        renewingTools,
        draftInvoices,
        pipelineDraftsAndQa,
        totalLeakage,
        tokenMap,
      });

      const internalQaCount = pipelineDraftsAndQa.filter((p) => p.status === "internal_review").length;

      return {
        activeClientsCount: activeClients.length,
        pendingReviewCount: reviewPosts.length + unresolvedFeedback.length + internalQaCount,
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
        operationalTasks,
        teamMembers,
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
        operationalTasks: [],
        teamMembers: [],
      };
    }
  });
}
