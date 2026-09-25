"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClientReviewToken } from "@/lib/security/token";
import {
  createClientSchema,
  tabooWordSchema,
  toolExpenseSchema,
  updateClientContextSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";

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

    revalidatePath("/clients");
    revalidatePath("/command-center");
    return { success: true, clientId: client.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addTabooWordAction(clientId: string, word: string) {
  try {
    const parsed = tabooWordSchema.safeParse({ clientId, word });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }
    const cleanWord = parsed.data.word;

    const supabase = createAdminClient();
    const { data: ctx } = await supabase
      .from("client_contexts")
      .select("id, taboo_words")
      .eq("client_id", clientId)
      .single();

    if (ctx) {
      const currentWords = ctx.taboo_words || [];
      if (!currentWords.includes(cleanWord)) {
        await supabase
          .from("client_contexts")
          .update({ taboo_words: [...currentWords, cleanWord] })
          .eq("id", ctx.id);
      }
    } else {
      await supabase.from("client_contexts").insert({
        client_id: clientId,
        taboo_words: [cleanWord],
      });
    }

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeTabooWordAction(clientId: string, wordToRemove: string) {
  try {
    const supabase = createAdminClient();

    const { data: ctx } = await supabase
      .from("client_contexts")
      .select("id, taboo_words")
      .eq("client_id", clientId)
      .single();

    if (ctx && ctx.taboo_words) {
      const updatedWords = ctx.taboo_words.filter((w: string) => w !== wordToRemove);
      await supabase
        .from("client_contexts")
        .update({ taboo_words: updatedWords })
        .eq("id", ctx.id);
    }

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateClientContextAction(
  clientId: string,
  contextData: {
    positioning_statement?: string;
    target_audience_icp?: string;
    tone_archetype?: string;
    voice_guidelines?: string;
    core_pillars?: string[];
  }
) {
  try {
    const parsed = updateClientContextSchema.safeParse({
      clientId,
      ...contextData,
    });

    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      positioning_statement,
      target_audience_icp,
      tone_archetype,
      voice_guidelines,
      core_pillars,
    } = parsed.data;

    const supabase = createAdminClient();

    // Check if context row already exists
    const { data: existing } = await supabase
      .from("client_contexts")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("client_contexts")
        .update({
          positioning_statement,
          target_audience_icp,
          tone_archetype,
          voice_guidelines,
          core_pillars,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }
    } else {
      const { error: insertErr } = await supabase.from("client_contexts").insert({
        client_id: clientId,
        positioning_statement,
        target_audience_icp,
        tone_archetype,
        voice_guidelines,
        core_pillars,
        taboo_words: [],
      });

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }
    }

    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/content");
    revalidatePath("/command-center");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function logToolExpenseAction(formData: FormData) {
  try {
    const rawInput = {
      engagement_id: formData.get("engagement_id"),
      tool_name: formData.get("tool_name"),
      description: formData.get("description") || undefined,
      amount: formData.get("amount"),
      client_id: formData.get("client_id") || undefined,
      tool_subscription_id: formData.get("tool_subscription_id") || undefined,
      incurred_date: formData.get("incurred_date") || undefined,
    };

    const parsed = toolExpenseSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      engagement_id: engagementId,
      tool_name: toolName,
      description,
      amount,
      client_id: clientId,
      tool_subscription_id: toolSubscriptionId,
      incurred_date: incurredDate,
    } = parsed.data;

    const supabase = createAdminClient();

    // Combine tool name + description into a single description string
    // (tool_name column does not exist in the DB schema)
    const fullDescription = description
      ? `${toolName} — ${description}`
      : toolName;

    const { error } = await supabase.from("tool_expenses").insert({
      engagement_id: engagementId,
      tool_subscription_id: toolSubscriptionId,
      description: fullDescription,
      amount,
      currency: "INR",
      incurred_date: incurredDate,
      status: "unbilled",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (clientId) {
      revalidatePath(`/clients/${clientId}`);
    }
    revalidatePath("/billing");
    revalidatePath("/command-center");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleEmergencyHoldAction(
  clientId: string,
  shouldHold: boolean,
  reason: string = "Founder requested emergency freeze"
) {
  try {
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

    revalidatePath("/command-center");
    revalidatePath("/operations");
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/content");
    revalidatePath("/calendar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createClientRequestAction(formData: FormData) {
  try {
    const supabase = createAdminClient();
    const clientId = formData.get("client_id") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "general_query";
    const priority = (formData.get("priority") as string) || "normal";

    if (!clientId || !title) {
      return { success: false, error: "Client and title are required." };
    }

    if (category === "emergency_hold") {
      return await toggleEmergencyHoldAction(clientId, true, description || title);
    }

    const { data, error } = await supabase
      .from("client_requests")
      .insert({
        client_id: clientId,
        title,
        description,
        category: category as any,
        priority: priority as any,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/operations");
    revalidatePath("/command-center");
    revalidatePath(`/clients/${clientId}`);
    return { success: true, request: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateClientRequestStatusAction(
  requestId: string,
  newStatus: "submitted" | "in_progress" | "resolved" | "closed"
) {
  try {
    const supabase = createAdminClient();

    const updatePayload: any = { status: newStatus };
    if (newStatus === "resolved" || newStatus === "closed") {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: req, error } = await supabase
      .from("client_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .select("id, client_id, category")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (req?.category === "emergency_hold" && (newStatus === "resolved" || newStatus === "closed")) {
      const { data: remainingHolds } = await supabase
        .from("client_requests")
        .select("id")
        .eq("client_id", req.client_id)
        .eq("category", "emergency_hold")
        .in("status", ["submitted", "in_progress"]);

      if (!remainingHolds || remainingHolds.length === 0) {
        await toggleEmergencyHoldAction(req.client_id, false, "Hold resolved");
      }
    }

    revalidatePath("/operations");
    revalidatePath("/command-center");
    if (req?.client_id) {
      revalidatePath(`/clients/${req.client_id}`);
    }
    return { success: true, request: req };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function generateDraftInvoiceAction(clientId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Fetch client with engagements
    const { data: client } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        engagements (
          id,
          monthly_retainer,
          billing_anchor_day,
          service_type
        )
      `)
      .eq("id", clientId)
      .single();

    if (!client || !client.engagements || client.engagements.length === 0) {
      return { success: false, error: "No active engagement found for client." };
    }

    const primaryEng = client.engagements[0];
    const monthlyRetainer = Number(primaryEng.monthly_retainer || 0);

    // 2. Fetch unbilled tool expenses for this engagement
    const { data: expenses } = await supabase
      .from("tool_expenses")
      .select("*")
      .eq("engagement_id", primaryEng.id)
      .eq("status", "unbilled");

    const toolExpensesList = expenses || [];
    const expensesTotal = toolExpensesList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const subtotal = monthlyRetainer + expensesTotal;

    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0];

    // 3. Create invoice row
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        engagement_id: primaryEng.id,
        invoice_number: invoiceNum,
        issue_date: today,
        due_date: dueDate,
        subtotal_amount: subtotal,
        tax_amount: 0,
        total_amount: subtotal,
        currency: "INR",
        status: "draft",
      })
      .select()
      .single();

    if (invErr || !invoice) {
      return { success: false, error: invErr?.message || "Failed to create invoice." };
    }

    // 4. Create line items
    const lineItems = [
      {
        invoice_id: invoice.id,
        description: `Base Retainer (${primaryEng.service_type === "linkedin_branding" ? "Founder Personal Branding" : "Outbound Campaign"})`,
        quantity: 1,
        unit_price: monthlyRetainer,
        total_price: monthlyRetainer,
      },
      ...toolExpensesList.map((exp) => ({
        invoice_id: invoice.id,
        tool_expense_id: exp.id,
        description: `Software: ${exp.description || exp.tool_name}`,
        quantity: 1,
        unit_price: Number(exp.amount),
        total_price: Number(exp.amount),
      })),
    ];

    await supabase.from("invoice_line_items").insert(lineItems);

    // 5. Update expenses to drafted_in_invoice
    if (toolExpensesList.length > 0) {
      const expIds = toolExpensesList.map((e) => e.id);
      await supabase
        .from("tool_expenses")
        .update({ status: "drafted_in_invoice" })
        .in("id", expIds);
    }

    revalidatePath("/billing");
    revalidatePath("/command-center");
    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      invoiceNumber: invoiceNum,
      subtotal,
      toolExpensesCount: toolExpensesList.length,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function deleteClientAction(clientId: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/clients");
    revalidatePath("/command-center");
    revalidatePath("/billing");
    revalidatePath("/content");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
