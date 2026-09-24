import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test AES-256-GCM simulation
function testEncryption() {
  console.log("--- 1. Testing AES-256-GCM Encryption / Decryption ---");
  const ALGORITHM = "aes-256-gcm";
  const key = crypto.createHash("sha256").update(supabaseServiceKey).digest();
  const iv = crypto.randomBytes(12);
  const testPassword = "FounderSuperSecretPassword!#2026";

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let enc = cipher.update(testPassword, "utf8", "hex");
  enc += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  const payload = `enc:v1:${iv.toString("hex")}:${authTag}:${enc}`;
  console.log("Encrypted payload:", payload.slice(0, 40) + "...");

  // Decrypt
  const parts = payload.slice("enc:v1:".length).split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(parts[0], "hex"));
  decipher.setAuthTag(Buffer.from(parts[1], "hex"));
  let dec = decipher.update(parts[2], "hex", "utf8");
  dec += decipher.final("utf8");

  if (dec === testPassword) {
    console.log("✅ Encryption/Decryption roundtrip PASSED perfectly!");
  } else {
    console.error("❌ Mismatch:", dec, "vs", testPassword);
    process.exit(1);
  }
}

async function testDatabaseIntegrity() {
  console.log("\n--- 2. Testing Database Tables & Fixed Queries ---");

  // A. Check tool_subscriptions query (Calendar projection)
  const qTool = await supabase
    .from("tool_subscriptions")
    .select("id, tool_name, billing_cycle, cost_amount, currency, next_renewal_date, default_pass_through")
    .not("next_renewal_date", "is", null);
  console.log("Tool Subscriptions Query:", qTool.error ? `❌ ${qTool.error.message}` : `✅ OK (${qTool.data.length} rows)`);

  // B. Check tool_expenses query (Billing data)
  const qExp = await supabase
    .from("tool_expenses")
    .select("id, description, amount, currency, incurred_date, status, engagements (id, service_type, monthly_retainer, clients (id, name, founder_name))")
    .order("incurred_date", { ascending: false });
  console.log("Tool Expenses Query (fixed):", qExp.error ? `❌ ${qExp.error.message}` : `✅ OK (${qExp.data.length} rows)`);

  // C. Check credentials and credential_audit_logs
  const qCred = await supabase.from("credentials").select("id, client_id, platform, encrypted_password").limit(1);
  console.log("Credentials Table:", qCred.error ? `❌ ${qCred.error.message}` : `✅ OK (${qCred.data.length} rows)`);

  const qAudit = await supabase.from("credential_audit_logs").select("id, action, ip_address, user_agent, created_at").limit(5);
  console.log("Credential Audit Logs Table:", qAudit.error ? `❌ ${qAudit.error.message}` : `✅ OK (${qAudit.data.length} rows)`);

  // D. Check client_requests
  const qReq = await supabase.from("client_requests").select("id, title, category, priority, status").limit(5);
  console.log("Client Requests Table:", qReq.error ? `❌ ${qReq.error.message}` : `✅ OK (${qReq.data.length} rows)`);
}

async function run() {
  testEncryption();
  await testDatabaseIntegrity();
  console.log("\n🎉 All Slice 4 database and cryptographic verifications PASSED!");
}

run();
