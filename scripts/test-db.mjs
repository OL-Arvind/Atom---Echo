import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log("Testing Supabase connection...");
  
  const tablesToCheck = [
    "users",
    "clients",
    "engagements",
    "content_items",
    "tool_expenses",
    "client_requests",
    "client_contexts",
    "credentials",
    "invoices",
    "audit_logs"
  ];

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log(`❌ Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`✅ Table '${table}': Accessible (row count: ${count})`);
    }
  }
}

testConnection();
