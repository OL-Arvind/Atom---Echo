import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = "https://pnmytneursgogfyogino.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl0bmV1cnNnb2dmeW9naW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTc0MDU0MywiZXhwIjoyMTA1MzE2NTQzfQ.Npof_XGUnBUfXjtEH31n-hm0ylxtp37FPUlmwFXtaVY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🚀 Starting Supabase Database Seeding for Atom & Echo OS...");

  // 1. Organization
  const orgId = crypto.randomUUID();
  console.log("Creating organization...");
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .upsert(
      {
        id: orgId,
        name: "Atom & Echo",
        slug: "atom-and-echo",
        currency: "INR",
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (orgErr) {
    console.error("❌ Organization error:", orgErr);
    return;
  }
  const resolvedOrgId = org.id;
  console.log(`✅ Organization established: ${org.name} (${resolvedOrgId})`);

  // 2. Clients
  console.log("Creating clients...");
  const clientChetanId = crypto.randomUUID();
  const clientFlorianId = crypto.randomUUID();
  const clientMustafaId = crypto.randomUUID();

  const clientsData = [
    {
      id: clientChetanId,
      organization_id: resolvedOrgId,
      name: "Debtworks",
      founder_name: "Chetan Ahuja",
      founder_title: "Founder & CEO",
      founder_email: "chetan@debtworks.in",
      founder_phone: "+91 98765 43210",
      linkedin_url: "https://linkedin.com/in/chetan-ahuja",
      website_url: "https://debtworks.in",
      status: "active",
    },
    {
      id: clientFlorianId,
      organization_id: resolvedOrgId,
      name: "Florian Health",
      founder_name: "Florian M.",
      founder_title: "CEO & Co-Founder",
      founder_email: "florian@florianhealth.com",
      status: "active",
    },
    {
      id: clientMustafaId,
      organization_id: resolvedOrgId,
      name: "OrbitXPay",
      founder_name: "Mustafa Q.",
      founder_title: "Head of Growth",
      founder_email: "mustafa@orbitxpay.com",
      status: "active",
    },
  ];

  const { data: insertedClients, error: clientsErr } = await supabase
    .from("clients")
    .upsert(clientsData)
    .select();

  if (clientsErr) {
    console.error("❌ Clients error:", clientsErr);
    return;
  }
  console.log(`✅ Seeded ${insertedClients.length} clients`);

  // 3. Client Contexts
  console.log("Creating client contexts...");
  const contextsData = [
    {
      client_id: clientChetanId,
      positioning_statement:
        "Veteran investment banker turning founder advocate, advising Series A/B founders on raising structured debt without equity dilution.",
      target_audience_icp:
        "Venture-backed B2B SaaS and consumer tech founders in India & SEA ($1M–$10M ARR).",
      tone_archetype: "Pragmatic, contrarian, numbers-grounded operator.",
      voice_guidelines:
        "Short punchy paragraphs. Lead with hard debt covenants and real interest spread examples. Avoid theoretical startup platitudes.",
      taboo_words: ["synergy", "game-changer", "delve", "rockstar", "deep dive", "disruptive"],
      core_pillars: [
        "Venture Debt vs. Dilutive Equity",
        "Debt Covenants & Default Triggers",
        "Treasury Management for Startups",
        "Founder War Stories from Boardrooms",
      ],
    },
    {
      client_id: clientFlorianId,
      positioning_statement:
        "Pioneering preventative clinical health protocols for high-performing tech executives.",
      target_audience_icp: "C-suite executives, tech leaders, and biohackers.",
      tone_archetype: "Scientific, calm, authoritative yet accessible.",
      voice_guidelines: "Cite PubMed studies, maintain calm clinical authority, avoid hyperbole.",
      taboo_words: ["miracle cure", "biohack your life", "hustle", "guru"],
      core_pillars: ["Metabolic Biomarkers", "Deep Sleep Architecture", "Executive Longevity Protocols"],
    },
  ];

  const { error: ctxErr } = await supabase.from("client_contexts").upsert(contextsData);
  if (ctxErr) console.error("❌ Client Context error:", ctxErr);
  else console.log("✅ Seeded client context intelligence vaults");

  // 4. Engagements
  console.log("Creating engagements...");
  const engChetanPbId = crypto.randomUUID();
  const engChetanOutreachId = crypto.randomUUID();
  const engFlorianPbId = crypto.randomUUID();
  const engMustafaOutreachId = crypto.randomUUID();

  const engagementsData = [
    {
      id: engChetanPbId,
      client_id: clientChetanId,
      service_type: "linkedin_branding",
      status: "active",
      monthly_retainer: 150000,
      billing_frequency: "monthly",
      billing_anchor_day: 1,
      start_date: "2026-06-01",
      renewal_date: "2026-12-01",
    },
    {
      id: engChetanOutreachId,
      client_id: clientChetanId,
      service_type: "cold_outreach",
      status: "active",
      monthly_retainer: 80000,
      billing_frequency: "monthly",
      billing_anchor_day: 1,
      start_date: "2026-07-01",
    },
    {
      id: engFlorianPbId,
      client_id: clientFlorianId,
      service_type: "linkedin_branding",
      status: "active",
      monthly_retainer: 120000,
      billing_frequency: "monthly",
      billing_anchor_day: 15,
      start_date: "2026-07-15",
    },
    {
      id: engMustafaOutreachId,
      client_id: clientMustafaId,
      service_type: "cold_outreach",
      status: "active",
      monthly_retainer: 100000,
      billing_frequency: "monthly",
      billing_anchor_day: 20,
      start_date: "2026-08-01",
    },
  ];

  const { data: insertedEngs, error: engErr } = await supabase
    .from("engagements")
    .upsert(engagementsData)
    .select();

  if (engErr) {
    console.error("❌ Engagements error:", engErr);
    return;
  }
  console.log(`✅ Seeded ${insertedEngs.length} commercial service engagements`);

  // 5. Content Items
  console.log("Creating content pipeline items...");
  const contentItemsData = [
    {
      id: crypto.randomUUID(),
      engagement_id: engChetanPbId,
      title: "The 3 Debt Covenants That Kill Series B Startups",
      body_markdown: `Most founders celebrate closing a $5M venture debt facility without reading clause 14.3.\n\nHere is how covenant traps actually work in down markets:\n\n1. Minimum Cash Balance covenants tied to 6 months runway.\n2. Cross-default clauses on equipment leases.\n3. Revenue-growth clawbacks.\n\nIf you are a founder raising debt this quarter: do not sign personal indemnity clauses without carveouts.`,
      content_format: "text_only",
      status: "client_review",
      target_pillar: "Debt Covenants & Default Triggers",
      scheduled_publish_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      engagement_id: engChetanPbId,
      title: "Why Dilutive Equity is More Expensive Than 16% Venture Debt",
      body_markdown: `When interest rates touched 14%, VCs advised founders to raise 'safe' priced equity rounds.\n\nHere is the real math at Series A:\n\nSelling 20% of your company for $3M costs you $20M at a $100M exit.\nPaying 15% interest on $3M venture debt costs you $450k.\n\nDilution is permanent. Debt is a utility.`,
      content_format: "text_only",
      status: "approved",
      target_pillar: "Venture Debt vs. Dilutive Equity",
      scheduled_publish_date: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      engagement_id: engFlorianPbId,
      title: "Metabolic Markers of Executive Burnout",
      body_markdown: `Cortisol dysregulation is not an abstract concept; it shows up in fasting insulin and HRV drops 3 months before cognitive fatigue hits.\n\nHere is the clinical protocol we run for tech founders working 70+ hour weeks.`,
      content_format: "text_only",
      status: "draft",
      target_pillar: "Metabolic Biomarkers",
    },
  ];

  const { data: insertedContent, error: contentErr } = await supabase
    .from("content_items")
    .upsert(contentItemsData)
    .select();

  if (contentErr) console.error("❌ Content items error:", contentErr);
  else console.log(`✅ Seeded ${insertedContent.length} content pipeline items`);

  // 6. Tool Expenses (Pass-through leakage prevention)
  console.log("Creating unbilled tool expenses...");
  const toolExpensesData = [
    {
      id: crypto.randomUUID(),
      engagement_id: engChetanOutreachId,
      description: "Clay Enterprise Credits (5,000 enrichments)",
      amount: 24000,
      currency: "INR",
      incurred_date: "2026-09-02",
      status: "unbilled",
    },
    {
      id: crypto.randomUUID(),
      engagement_id: engChetanOutreachId,
      description: "Instantly Custom Mailbox Warmup Pool (15 inboxes)",
      amount: 12500,
      currency: "INR",
      incurred_date: "2026-09-05",
      status: "unbilled",
    },
    {
      id: crypto.randomUUID(),
      engagement_id: engMustafaOutreachId,
      description: "Apollo.io Professional Seats for Growth Reps",
      amount: 8000,
      currency: "INR",
      incurred_date: "2026-09-10",
      status: "unbilled",
    },
  ];

  const { data: insertedExpenses, error: expenseErr } = await supabase
    .from("tool_expenses")
    .upsert(toolExpensesData)
    .select();

  if (expenseErr) console.error("❌ Tool expenses error:", expenseErr);
  else console.log(`✅ Seeded ${insertedExpenses.length} pass-through tool expenses`);

  // 7. Client Review Token (Zero-Login PWA link)
  console.log("Creating client review token...");
  const { error: tokenErr } = await supabase.from("review_tokens").upsert({
    id: crypto.randomUUID(),
    client_id: clientChetanId,
    token_hash: "chetan-review-token-123",
    expires_at: new Date(Date.now() + 86400000 * 14).toISOString(),
    revoked: false,
  });

  if (tokenErr) console.error("❌ Review token error:", tokenErr);
  else console.log("✅ Seeded zero-login review token: 'chetan-review-token-123'");

  // 8. Client Requests (Urgent Support & Emergency Hold)
  console.log("Creating client requests...");
  const requestsData = [
    {
      id: crypto.randomUUID(),
      client_id: clientChetanId,
      title: "Covenant Update: Do not mention specific lender names",
      description: "Per board NDA, keep mezzanine lender examples anonymous.",
      category: "content_pivot",
      priority: "high",
      status: "in_progress",
    },
    {
      id: crypto.randomUUID(),
      client_id: clientFlorianId,
      title: "Add PubMed reference link to circadian rhythm post",
      description: "Ensure footnote references 2025 Stanford sleep study.",
      category: "design_tweak",
      priority: "normal",
      status: "submitted",
    },
  ];

  const { data: insertedRequests, error: reqErr } = await supabase
    .from("client_requests")
    .upsert(requestsData)
    .select();

  if (reqErr) console.error("❌ Client requests error:", reqErr);
  else console.log(`✅ Seeded ${insertedRequests.length} client operational requests`);

  console.log("\n🎉 SUPABASE SEEDING COMPLETED SUCCESSFULLY!");
}

seed();
