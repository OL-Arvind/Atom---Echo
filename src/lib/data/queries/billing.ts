import { createAdminClient } from "@/lib/supabase/admin";
import { withDbCache } from "./cache";

export async function getBillingDataFromDb() {
  return withDbCache("billing_data", async () => {
    try {
      const supabase = createAdminClient();

      const [expensesRes, invoicesRes, clientsRes, toolSubscriptionsRes] = await Promise.all([
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
              service_type,
              monthly_retainer,
              clients (
                id,
                name,
                founder_name
              )
            )
          `)
          .order("incurred_date", { ascending: false }),
        supabase
          .from("invoices")
          .select(`
            id,
            invoice_number,
            issue_date,
            due_date,
            subtotal_amount,
            total_amount,
            status,
            created_at,
            engagements (
              clients (
                id,
                name,
                founder_name
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
          .order("created_at", { ascending: false }),
        supabase
          .from("clients")
          .select(`
            id,
            name,
            founder_name,
            founder_email,
            website_url,
            engagements (
              id,
              service_type,
              monthly_retainer
            )
          `)
          .eq("status", "active"),
        supabase
          .from("tool_subscriptions")
          .select("*")
          .order("next_renewal_date", { ascending: true }),
      ]);

      return {
        expenses: expensesRes.data || [],
        invoices: invoicesRes.data || [],
        clients: clientsRes.data || [],
        toolSubscriptions: toolSubscriptionsRes.data || [],
      };
    } catch (err) {
      console.error("Error in getBillingDataFromDb:", err);
      return {
        expenses: [],
        invoices: [],
        clients: [],
        toolSubscriptions: [],
      };
    }
  });
}

export async function getToolSubscriptionsFromDb() {
  return withDbCache("tool_subscriptions", async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("tool_subscriptions")
        .select("*")
        .order("next_renewal_date", { ascending: true });

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.error("Error fetching tool subscriptions:", err);
      return [];
    }
  });
}

export async function getInvoiceByIdFromDb(id: string) {
  try {
    const supabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return null;

    const { data: invoice, error } = await supabase
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
        engagements (
          id,
          service_type,
          monthly_retainer,
          billing_anchor_day,
          clients (
            id,
            name,
            founder_name,
            founder_title,
            founder_email,
            founder_phone,
            linkedin_url
          )
        ),
        invoice_line_items (
          id,
          invoice_id,
          tool_expense_id,
          description,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("id", id)
      .single();

    if (error || !invoice) return null;

    return invoice;
  } catch (err) {
    console.error("Error fetching invoice by id:", err);
    return null;
  }
}
