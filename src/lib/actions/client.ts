"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createClientAction(formData: FormData) {
  try {
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

    const name = formData.get("name") as string;
    const founder_name = formData.get("founder_name") as string;
    const founder_title = (formData.get("founder_title") as string) || "Founder & CEO";
    const founder_email = formData.get("founder_email") as string;
    const founder_phone = formData.get("founder_phone") as string;
    const linkedin_url = formData.get("linkedin_url") as string;
    const website_url = formData.get("website_url") as string;
    const service_type = (formData.get("service_type") as string) || "linkedin_branding";
    const monthly_retainer = Number(formData.get("monthly_retainer") || 150000);
    const billing_anchor_day = Number(formData.get("billing_anchor_day") || 1);

    if (!name || !founder_name) {
      return { success: false, error: "Company name and Founder name are required." };
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
      monthly_retainer,
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

    revalidatePath("/clients");
    revalidatePath("/command-center");
    return { success: true, clientId: client.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
