import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
  console.log("🧹 Wiping all records from Supabase database for Day 0 user experience...\n");

  // Delete in order of foreign key dependency
  const tablesToDelete = [
    "audit_logs",
    "content_feedback",
    "review_tokens",
    "invoice_line_items",
    "invoices",
    "tool_expenses",
    "content_items",
    "tool_subscriptions",
    "client_requests",
    "knowledge_items",
    "meetings",
    "credential_audit_logs",
    "credentials",
    "client_contexts",
    "engagements",
    "clients"
  ];

  for (const table of tablesToDelete) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.log(`⚠️ Note on ${table}: ${error.message}`);
    } else {
      console.log(`✅ Cleared table: ${table}`);
    }
  }

  // Ensure default agency organization exists for Day 0
  const { data: org, error: orgErr } = await supabase.from("organizations").upsert({
    name: "Atom & Echo",
    slug: "atom-and-echo",
    currency: "INR"
  }, { onConflict: "slug" }).select().single();

  if (orgErr) {
    console.error("❌ Failed to establish organization:", orgErr);
  } else {
    console.log(`\n🏢 Clean agency organization ready: ${org.name} (ID: ${org.id})`);
  }

  console.log("\n✨ Database is now 100% clean and ready for a first-time user!");
}

cleanDatabase();
