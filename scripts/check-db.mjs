import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCounts() {
  const tables = [
    "organizations",
    "users",
    "clients",
    "engagements",
    "client_contexts",
    "credentials",
    "credential_audit_logs",
    "meetings",
    "knowledge_items",
    "client_requests",
    "tool_subscriptions",
    "invoices",
    "invoice_line_items",
    "tool_expenses",
    "content_items",
    "review_tokens",
    "content_feedback",
    "audit_logs"
  ];

  console.log("--- TABLE ROW COUNTS ---");
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`${t}: ERROR ${error.message}`);
    } else {
      console.log(`${t}: ${count} rows`);
    }
  }

  // Check clients details if any
  const { data: clients } = await supabase.from("clients").select("id, name, founder_name, created_at");
  console.log("\nClients in DB:", clients);
}

checkCounts();
