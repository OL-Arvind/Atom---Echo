"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  toolExpenseSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { revalidate } from "./helpers";
import { toggleEmergencyHoldAction } from "./management";

export async function logToolExpenseAction(formData: FormData) {
  try {
    await requireOperatorSession();
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
      revalidate(`/clients/${clientId}`);
    }
    revalidate("/billing");
    revalidate("/command-center");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to log tool expense.";
    return { success: false, error: message };
  }
}

export async function createClientRequestAction(formData: FormData) {
  try {
    await requireOperatorSession();
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

    revalidate("/operations");
    revalidate("/command-center");
    revalidate(`/clients/${clientId}`);
    return { success: true, request: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create client request.";
    return { success: false, error: message };
  }
}

export async function updateClientRequestStatusAction(
  requestId: string,
  newStatus: "submitted" | "in_progress" | "resolved" | "closed"
) {
  try {
    await requireOperatorSession();
    const supabase = createAdminClient();

    const updatePayload: Record<string, unknown> = { status: newStatus };
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

    revalidate("/operations");
    revalidate("/command-center");
    if (req?.client_id) {
      revalidate(`/clients/${req.client_id}`);
    }
    return { success: true, request: req };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update request status.";
    return { success: false, error: message };
  }
}

export async function generateDraftInvoiceAction(clientId: string) {
  try {
    await requireOperatorSession();
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
        description: `Software: ${exp.description || (exp as any).tool_name}`,
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

    revalidate("/billing");
    revalidate("/command-center");
    revalidate(`/clients/${clientId}`);

    return {
      success: true,
      invoiceNumber: invoiceNum,
      subtotal,
      toolExpensesCount: toolExpensesList.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate draft invoice.";
    return { success: false, error: message };
  }
}
