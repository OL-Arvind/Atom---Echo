import { getBillingDataFromDb } from "@/lib/data/supabase-queries";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await getBillingDataFromDb();

  return (
    <BillingClient
      initialExpenses={data.expenses}
      initialInvoices={data.invoices}
      clients={data.clients}
      toolSubscriptions={data.toolSubscriptions}
    />
  );
}
