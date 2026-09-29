"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClientReviewToken } from "@/lib/security/token";
import {
  createClientSchema,
  updateClientSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate } from "./helpers";

export async function createClientAction(formData: FormData) {
  try {
    await requireOperatorSession();
    const rawInput = {
      name: formData.get("name"),
      founder_name: formData.get("founder_name"),
      founder_title: formData.get("founder_title") || undefined,
      founder_email: formData.get("founder_email") || undefined,
      founder_phone: formData.get("founder_phone") || undefined,
      linkedin_url: formData.get("linkedin_url") || undefined,
      website_url: formData.get("website_url") || undefined,
      service_type: formData.get("service_type") || undefined,
      monthly_retainer: formData.get("monthly_retainer") || undefined,
      billing_anchor_day: formData.get("billing_anchor_day") || undefined,
    };

    const parsed = createClientSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      name,
      founder_name,
      founder_title,
      founder_email,
      founder_phone,
      linkedin_url,
      website_url,
      service_type,
      monthly_retainer,
      billing_anchor_day,
    } = parsed.data;

    const supabase = createAdminClient();

    // 1. Get or create default organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "atom-and-echo")
      .single();

    let orgId = org?.id;
    if (!orgId) {
      const { data: newOrg } = await supabase
        .from("organizations")
        .insert({
          name: "Atom & Echo",
          slug: "atom-and-echo",
          currency: "INR",
        })
        .select("id")
        .single();
      orgId = newOrg?.id;
    }

    // 2. Insert Client
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .insert({
        organization_id: orgId,
        name,
        founder_name,
        founder_title,
        founder_email,
        founder_phone,
        linkedin_url,
        website_url,
        status: "active",
      })
      .select()
      .single();

    if (clientErr || !client) {
      return { success: false, error: clientErr?.message || "Failed to create client." };
    }

    // 3. Insert Engagement
    const { error: engErr } = await supabase.from("engagements").insert({
      client_id: client.id,
      service_type,
      status: "active",
      monthly_retainer: monthly_retainer ?? 0,
      billing_frequency: "monthly",
      billing_anchor_day,
      start_date: new Date().toISOString().split("T")[0],
    });

    if (engErr) {
      console.warn("Could not insert engagement:", engErr.message);
    }

    // 4. Initialize empty Client Context
    await supabase.from("client_contexts").insert({
      client_id: client.id,
      positioning_statement: "",
      target_audience_icp: "",
      tone_archetype: "",
      voice_guidelines: "",
      taboo_words: [],
      core_pillars: [],
    });

    // 5. Initialize 7-day Cryptographic Review Token for 1-tap review portal
    await createClientReviewToken(client.id, 7);

    revalidate("/clients");
    revalidate("/command-center");
    return { success: true, clientId: client.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create client.";
    return { success: false, error: message };
  }
}

export async function updateClientAction(formData: FormData) {
  try {
    await requireOperatorSession();
    const rawInput = {
      clientId: formData.get("clientId"),
      name: formData.get("name"),
      founder_name: formData.get("founder_name"),
      founder_title: formData.get("founder_title") || undefined,
      founder_email: formData.get("founder_email") || undefined,
      founder_phone: formData.get("founder_phone") || undefined,
      linkedin_url: formData.get("linkedin_url") || undefined,
      website_url: formData.get("website_url") || undefined,
      status: formData.get("status") || "active",
      service_type: formData.get("service_type") || undefined,
      monthly_retainer: formData.get("monthly_retainer") || undefined,
      billing_anchor_day: formData.get("billing_anchor_day") || undefined,
    };

    const parsed = updateClientSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      clientId,
      name,
      founder_name,
      founder_title,
      founder_email,
      founder_phone,
      linkedin_url,
      website_url,
      status,
      service_type,
      monthly_retainer,
      billing_anchor_day,
    } = parsed.data;

    const supabase = createAdminClient();

    // 1. Update client record
    const { error: clientErr } = await supabase
      .from("clients")
      .update({
        name,
        founder_name,
        founder_title,
        founder_email,
        founder_phone,
        linkedin_url,
        website_url,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (clientErr) {
      return { success: false, error: clientErr.message };
    }

    // 2. Check and update primary engagement if fields provided
    if (
      service_type !== undefined ||
      monthly_retainer !== undefined ||
      billing_anchor_day !== undefined
    ) {
      const { data: existingEngs } = await supabase
        .from("engagements")
        .select("id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (existingEngs && existingEngs.length > 0) {
        const engId = existingEngs[0].id;
        const engUpdate: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (service_type !== undefined) engUpdate.service_type = service_type;
        if (monthly_retainer !== undefined) engUpdate.monthly_retainer = monthly_retainer;
        if (billing_anchor_day !== undefined) engUpdate.billing_anchor_day = billing_anchor_day;

        const { error: engErr } = await supabase
          .from("engagements")
          .update(engUpdate)
          .eq("id", engId);

        if (engErr) {
          console.warn("Could not update primary engagement:", engErr.message);
        }
      } else if (
        service_type ||
        monthly_retainer !== undefined ||
        billing_anchor_day !== undefined
      ) {
        // Insert fallback engagement if client had none
        await supabase.from("engagements").insert({
          client_id: clientId,
          service_type: service_type || "linkedin_branding",
          status: "active",
          monthly_retainer: monthly_retainer ?? 0,
          billing_frequency: "monthly",
          billing_anchor_day: billing_anchor_day || 1,
          start_date: new Date().toISOString().split("T")[0],
        });
      }
    }

    revalidate("/clients");
    revalidate(`/clients/${clientId}`);
    revalidate("/command-center");
    revalidate("/billing");
    revalidate("/content");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update client.";
    return { success: false, error: message };
  }
}

export async function toggleEmergencyHoldAction(
  clientId: string,
  shouldHold: boolean,
  reason: string = "Founder requested emergency freeze"
) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    // 1. Get client with organization
    const { data: client } = await supabase
      .from("clients")
      .select("id, organization_id, name, status")
      .eq("id", clientId)
      .single();

    if (!client) {
      return { success: false, error: "Client not found." };
    }

    // 2. Get client engagements
    const { data: engs } = await supabase
      .from("engagements")
      .select("id")
      .eq("client_id", clientId);

    const engIds = (engs || []).map((e) => e.id);

    if (shouldHold) {
      // Pause all scheduled posts
      if (engIds.length > 0) {
        await supabase
          .from("content_items")
          .update({ status: "paused", updated_at: new Date().toISOString() })
          .in("engagement_id", engIds)
          .eq("status", "scheduled");
      }

      // Check for existing active emergency hold request
      const { data: existingHold } = await supabase
        .from("client_requests")
        .select("id")
        .eq("client_id", clientId)
        .eq("category", "emergency_hold")
        .in("status", ["submitted", "in_progress"])
        .limit(1);

      if (!existingHold || existingHold.length === 0) {
        await supabase.from("client_requests").insert({
          client_id: clientId,
          title: "Publishing Paused",
          description: reason,
          category: "emergency_hold",
          priority: "urgent",
          status: "in_progress",
        });
      }

      // Update client status
      await supabase.from("clients").update({ status: "paused" }).eq("id", clientId);

      // Audit log
      if (client.organization_id) {
        await supabase.from("audit_logs").insert({
          organization_id: client.organization_id,
          event_name: "client.emergency_hold_triggered",
          entity_type: "client",
          entity_id: clientId,
          payload: { reason, client_name: client.name },
        });
      }
    } else {
      // Resume paused posts to scheduled
      if (engIds.length > 0) {
        await supabase
          .from("content_items")
          .update({ status: "scheduled", updated_at: new Date().toISOString() })
          .in("engagement_id", engIds)
          .eq("status", "paused");
      }

      // Resolve open emergency holds
      await supabase
        .from("client_requests")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("client_id", clientId)
        .eq("category", "emergency_hold")
        .in("status", ["submitted", "in_progress"]);

      // Update client status back to active
      await supabase.from("clients").update({ status: "active" }).eq("id", clientId);

      // Audit log
      if (client.organization_id) {
        await supabase.from("audit_logs").insert({
          organization_id: client.organization_id,
          event_name: "client.emergency_hold_released",
          entity_type: "client",
          entity_id: clientId,
          payload: { client_name: client.name },
        });
      }
    }

    revalidate("/command-center");
    revalidate("/operations");
    revalidate("/clients");
    revalidate(`/clients/${clientId}`);
    revalidate("/content");
    revalidate("/calendar");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle emergency hold.";
    return { success: false, error: message };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidate("/clients");
    revalidate("/command-center");
    revalidate("/billing");
    revalidate("/content");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete client.";
    return { success: false, error: message };
  }
}
