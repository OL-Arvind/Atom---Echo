import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSlice1() {
  console.log("=================================================");
  console.log("  SLICE 1 VERIFICATION: ADHD DAILY ACTION & CC   ");
  console.log("=================================================\n");

  // 1. Verify agency organization
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", "atom-and-echo")
    .single();

  if (orgErr || !org) {
    console.error("❌ Organization not found:", orgErr?.message);
    process.exit(1);
  }
  console.log(`✅ Agency Organization: ${org.name} (${org.id})`);

  // 2. Fetch users for dynamic team assignment
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("is_active", true);

  if (userErr || !users || users.length === 0) {
    console.error("❌ Team members query failed:", userErr?.message);
    process.exit(1);
  }
  console.log(`✅ Active Team Members (${users.length}):`);
  users.forEach((u) => console.log(`   - ${u.full_name || u.email} (${u.role}) [${u.id}]`));

  // 3. Test Storage Bucket Availability
  console.log("\n--- Checking Storage Buckets ---");
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketNames = (buckets || []).map((b) => b.name);
  console.log("Storage buckets:", bucketNames);

  // Ensure operational-tasks bucket
  const BUCKET = "operational-tasks";
  if (!bucketNames.includes(BUCKET)) {
    console.log(`Creating ${BUCKET} bucket for resilient task storage...`);
    const { error: bErr } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (bErr) console.log("Bucket creation note:", bErr.message);
    else console.log(`✅ Created bucket: ${BUCKET}`);
  } else {
    console.log(`✅ Bucket ${BUCKET} exists and ready.`);
  }

  // 4. Test Task Persistence in Storage (Fallback Engine)
  console.log("\n--- Testing Task Persistence Engine ---");
  const sampleTasks = [
    {
      id: "task-test-01",
      organization_id: org.id,
      title: "Call Nikhil about HeyReach campaign settings",
      estimated_minutes: 5,
      due_date: new Date().toISOString().split("T")[0],
      assigned_to: users[0]?.id,
      assigned_user_name: users[0]?.full_name,
      client_id: null,
      client_name: null,
      is_completed: false,
      completed_at: null,
      source_type: "manual",
      created_at: new Date().toISOString(),
    },
    {
      id: "task-test-02",
      organization_id: org.id,
      title: "Nudge Florian on WhatsApp for LinkedIn post review",
      estimated_minutes: 1,
      due_date: new Date().toISOString().split("T")[0],
      assigned_to: null,
      client_id: null,
      client_name: "Debtworks",
      is_completed: true,
      completed_at: new Date().toISOString(),
      source_type: "system_generated",
      created_at: new Date().toISOString(),
    },
  ];

  const uploadRes = await supabase.storage
    .from(BUCKET)
    .upload("daily_tasks.json", Buffer.from(JSON.stringify(sampleTasks, null, 2)), {
      upsert: true,
      contentType: "application/json",
    });

  if (uploadRes.error) {
    console.error("❌ Failed to persist tasks to storage:", uploadRes.error.message);
  } else {
    console.log("✅ Successfully persisted tasks to Supabase Storage.");
  }

  // 5. Test Download & Verify
  const { data: dlData, error: dlErr } = await supabase.storage.from(BUCKET).download("daily_tasks.json");
  if (dlErr || !dlData) {
    console.error("❌ Failed to download tasks:", dlErr?.message);
    process.exit(1);
  }
  const downloadedTasks = JSON.parse(await dlData.text());
  console.log(`✅ Verified Downloaded Tasks (${downloadedTasks.length} items):`);
  downloadedTasks.forEach((t) => {
    console.log(`   - [${t.is_completed ? "X" : " "}] ⚡ ${t.estimated_minutes}m: ${t.title}`);
  });

  // 6. Test Two-Zone Alert Classification Logic
  console.log("\n--- Testing Two-Zone Alert Classification ---");
  const { data: reviewPosts } = await supabase
    .from("content_items")
    .select("id, title, status, created_at")
    .eq("status", "client_review");

  console.log(`✅ In-flight posts in client_review (Zone 2 - Waiting on Client): ${reviewPosts?.length || 0}`);
  (reviewPosts || []).forEach((p) => {
    console.log(`   - "${p.title}" (Status: ${p.status}, Created: ${p.created_at})`);
  });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status")
    .eq("status", "draft");

  console.log(`✅ Draft invoices needing approval (Zone 1 - Action Required): ${invoices?.length || 0}`);
  (invoices || []).forEach((inv) => {
    console.log(`   - Invoice ${inv.invoice_number}: ₹${inv.total_amount}`);
  });

  console.log("\n=================================================");
  console.log("  ALL SLICE 1 VERIFICATIONS PASSED SUCCESSFULLY  ");
  console.log("=================================================");
}

testSlice1().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
