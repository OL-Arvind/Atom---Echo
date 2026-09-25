"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvoiceStatus, ToolBillingCycle } from "@/types/domain";
import {
  createToolSubscriptionSchema,
  updateInvoiceStatusSchema,
  formatZodError,
} from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";

/**
 * Register a new software tool subscription to the agency catalog
 */
export async function createToolSubscriptionAction(formData: FormData) {
  try {
    await requireOperatorSession();
    const rawInput = {
      tool_name: formData.get("tool_name"),
      cost_amount: formData.get("cost_amount") || undefined,
      currency: formData.get("currency") || undefined,
      billing_cycle: formData.get("billing_cycle") || undefined,
      next_renewal_date: formData.get("next_renewal_date"),
      default_pass_through: formData.get("default_pass_through") || undefined,
    };

    const parsed = createToolSubscriptionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      tool_name: toolName,
      cost_amount: costAmount,
      currency,
      billing_cycle: billingCycle,
      next_renewal_date: nextRenewalDate,
      default_pass_through: defaultPassThrough,
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

    const { data: tool, error } = await supabase
      .from("tool_subscriptions")
      .insert({
        organization_id: orgId,
        tool_name: toolName,
        cost_amount: costAmount,
        currency,
        billing_cycle: billingCycle,
        next_renewal_date: nextRenewalDate,
        default_pass_through: defaultPassThrough,
      })
      .select()
      .single();

    if (error || !tool) {
      return { success: false, error: error?.message || "Failed to create tool subscription." };
    }

    revalidatePath("/billing");
    revalidatePath("/command-center");
    revalidatePath("/calendar");
    return { success: true, tool };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a tool subscription from the catalog
 */
export async function deleteToolSubscriptionAction(id: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("tool_subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/billing");
    revalidatePath("/command-center");
    revalidatePath("/calendar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Transition invoice lifecycle: draft -> approved -> sent -> paid (or cancelled)
 */
export async function updateInvoiceStatusAction(invoiceId: string, status: InvoiceStatus) {
  try {
    const parsed = updateInvoiceStatusSchema.safeParse({ invoice_id: invoiceId, status });
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const supabase = createAdminClient();

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "paid") {
      updatePayload.paid_at = new Date().toISOString();
    } else if (status === "draft" || status === "approved") {
      updatePayload.paid_at = null;
    }

    const { data: inv, error } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", invoiceId)
      .select(`
        id,
        invoice_number,
        status,
        total_amount,
        engagement_id,
        engagements (
          clients (
            id,
            name
          )
        )
      `)
      .single();

    if (error || !inv) {
      return { success: false, error: error?.message || "Failed to update invoice status." };
    }

    // If invoice marked as paid, update associated tool expenses from drafted_in_invoice to invoiced/reimbursed
    if (status === "paid") {
      const { data: lineItems } = await supabase
        .from("invoice_line_items")
        .select("tool_expense_id")
        .eq("invoice_id", invoiceId)
        .not("tool_expense_id", "is", null);

      const expenseIds = (lineItems || [])
        .map((li) => li.tool_expense_id)
        .filter(Boolean) as string[];

      if (expenseIds.length > 0) {
        await supabase
          .from("tool_expenses")
          .update({ status: "invoiced", updated_at: new Date().toISOString() })
          .in("id", expenseIds);
      }
    }

    revalidatePath("/billing");
    revalidatePath(`/billing/invoices/${invoiceId}`);
    revalidatePath("/command-center");
    return { success: true, invoice: inv };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Automated Billing Anchor Engine:
 * Scans active clients. For any client whose billing anchor day is within the next 7 days
 * (or on today's cycle) and who has not yet been invoiced this month, automatically
 * drafts an invoice combining base monthly retainer + unbilled pass-through tool expenses.
 */
export async function runBillingAnchorCycleAction() {
  try {
    const supabase = createAdminClient();
    const today = new Date();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const todayIso = today.toISOString().split("T")[0];

    // First and last day of current calendar month for idempotency checks
    const monthStartIso = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
    const monthEndIso = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

    // 1. Fetch all active clients with active engagements
    const { data: clients, error: clientErr } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        founder_name,
        engagements (
          id,
          service_type,
          status,
          monthly_retainer,
          billing_anchor_day
        )
      `)
      .eq("status", "active");

    if (clientErr || !clients) {
      return { success: false, error: clientErr?.message || "Failed to fetch clients." };
    }

    const draftedInvoices: any[] = [];
    const skippedClients: string[] = [];

    for (const client of clients) {
      const engagements = (client.engagements || []).filter(
        (e: any) => e.status === "active"
      );

      for (const eng of engagements) {
        const anchorDay = Number(eng.billing_anchor_day || 1);

        // Check if anchor day is within the upcoming 7-day window
        // Example: If anchor is day 1, window is days 24-31 or day 1
        let isApproachingAnchor = false;

        // Days until anchor
        let daysUntilAnchor = anchorDay - currentDay;
        if (daysUntilAnchor < 0) {
          // Wrapped to next month
          const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          daysUntilAnchor += daysInCurrentMonth;
        }

        // Trigger condition: within 7 days of anchor day (or on anchor day)
        if (daysUntilAnchor <= 7) {
          isApproachingAnchor = true;
        }

        if (!isApproachingAnchor) {
          continue;
        }

        // IDEMPOTENCY CHECK: Check if an active/draft invoice was already issued for this engagement this month
        const { data: existingInvoices } = await supabase
          .from("invoices")
          .select("id, invoice_number, created_at, status")
          .eq("engagement_id", eng.id)
          .gte("issue_date", monthStartIso)
          .lte("issue_date", monthEndIso)
          .neq("status", "cancelled");

        if (existingInvoices && existingInvoices.length > 0) {
          skippedClients.push(`${client.name} (Already invoiced: ${existingInvoices[0].invoice_number})`);
          continue;
        }

        // Fetch unbilled tool expenses for this engagement
        const { data: expenses } = await supabase
          .from("tool_expenses")
          .select("*")
          .eq("engagement_id", eng.id)
          .eq("status", "unbilled");

        const unbilledExpenses = expenses || [];
        const retainer = Number(eng.monthly_retainer || 0);
        const expensesTotal = unbilledExpenses.reduce(
          (acc, e) => acc + Number(e.amount || 0),
          0
        );
        const subtotal = retainer + expensesTotal;

        const invoiceNum = `INV-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dueDate = new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0];

        // Create invoice
        const { data: invoice, error: invErr } = await supabase
          .from("invoices")
          .insert({
            engagement_id: eng.id,
            invoice_number: invoiceNum,
            issue_date: todayIso,
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
          console.error(`Failed to auto-draft invoice for ${client.name}:`, invErr);
          continue;
        }

        // Build line items: Base Retainer + each individual unbilled software seat
        const serviceLabel =
          eng.service_type === "linkedin_branding"
            ? "Founder Personal Branding Retainer"
            : eng.service_type === "cold_outreach"
            ? "Outbound Growth Retainer"
            : "Hybrid Growth Retainer";

        const lineItems = [
          {
            invoice_id: invoice.id,
            description: `Monthly Retainer: ${serviceLabel}`,
            quantity: 1,
            unit_price: retainer,
            total_price: retainer,
          },
          ...unbilledExpenses.map((exp) => ({
            invoice_id: invoice.id,
            tool_expense_id: exp.id,
            description: `Software Pass-Through: ${exp.description || "Tool license"}`,
            quantity: 1,
            unit_price: Number(exp.amount),
            total_price: Number(exp.amount),
          })),
        ];

        await supabase.from("invoice_line_items").insert(lineItems);

        // Update tool expenses to drafted_in_invoice
        if (unbilledExpenses.length > 0) {
          const expIds = unbilledExpenses.map((e) => e.id);
          await supabase
            .from("tool_expenses")
            .update({ status: "drafted_in_invoice", updated_at: new Date().toISOString() })
            .in("id", expIds);
        }

        draftedInvoices.push({
          clientName: client.name,
          invoiceNumber: invoiceNum,
          subtotal,
          expensesCount: unbilledExpenses.length,
        });
      }
    }

    revalidatePath("/billing");
    revalidatePath("/command-center");
    revalidatePath("/calendar");

    return {
      success: true,
      draftedCount: draftedInvoices.length,
      draftedInvoices,
      skippedClients,
    };
  } catch (err: any) {
    return { success: false, error: err.message, draftedCount: 0 };
  }
}
