import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { packMeetingSummary } from "../src/lib/meetings/utils";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const BASEWORKS_CLIENT_ID = "d011d0cc-05d3-42c7-aa4d-ae011df54f0e";

async function seed() {
  console.log("Seeding authentic meeting intelligence for BaseWorks...");

  // Read raw transcripts
  const transcript1Path = path.resolve(process.cwd(), "08_REFERENCE/meeting_transcript_1.md");
  const transcript2Path = path.resolve(process.cwd(), "08_REFERENCE/meeting_transcript_2.md");

  const transcript1 = fs.existsSync(transcript1Path) ? fs.readFileSync(transcript1Path, "utf-8") : "";
  const transcript2 = fs.existsSync(transcript2Path) ? fs.readFileSync(transcript2Path, "utf-8") : "";

  // 1. Check existing meetings for BaseWorks
  const { data: existing } = await supabase
    .from("meetings")
    .select("id, title")
    .eq("client_id", BASEWORKS_CLIENT_ID);

  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing meetings for BaseWorks, cleaning up old seed...`);
    for (const m of existing) {
      await supabase.from("meetings").delete().eq("id", m.id);
    }
  }

  // Meeting 1
  const m1Summary = packMeetingSummary(
    "In-depth founder alignment on moving away from generic agency fluff. Discussed agency headquarters relocation towards central Bangalore (BTM/Domlur) to be closer to enterprise clients. Agreed on aggressive follow-up with prospective client Nishant. Explored strategic expansion to X (Twitter) as a complementary platform to LinkedIn specifically for AI and developer credibility.",
    {
      channel: "fathom_video",
      attendees: "Sudeesh D S, Aravind (Founder & CEO, BaseWorks)",
      key_decisions: [
        "Atom & Echo to build presence on X (Twitter) for AI thought leadership in addition to LinkedIn",
        "Prioritize central Bangalore client visits over remote Electronic City calls",
        "Close Nishant on custom AI operating system demo",
      ],
      action_items: [
        "Text Nishant to schedule enterprise workflow demo",
        "Outline initial positioning themes for BaseWorks engineering narrative",
      ],
    }
  );

  const { data: meeting1, error: err1 } = await supabase
    .from("meetings")
    .insert({
      client_id: BASEWORKS_CLIENT_ID,
      title: "Atom & Echo x BaseWorks - Operational Discovery & Strategic Positioning",
      meeting_date: "2026-09-15T10:00:00.000Z",
      fathom_recording_url: "https://fathom.video/share/-KPexcu2MytRJey24fVHbGb9Zg4EsQZR",
      summary: m1Summary,
      raw_transcript: transcript1,
    })
    .select()
    .single();

  if (err1) {
    console.error("Error inserting meeting 1:", err1);
  } else {
    console.log("✓ Meeting 1 inserted:", meeting1.title);

    // Insert extracted knowledge item for Meeting 1
    await supabase.from("knowledge_items").insert({
      client_id: BASEWORKS_CLIENT_ID,
      category: "contrarian_opinion",
      title: "Why X Beats LinkedIn for AI Credibility",
      content:
        "As a LinkedIn agency founder, I shouldn't say this, but X is fundamentally better than LinkedIn when it comes to raw AI engineering and developer tools. The highest-signal AI researchers and operators discuss breakthroughs there first.",
      source_meeting_id: meeting1.id,
    });
    console.log("  ✓ Extracted story inserted: Why X Beats LinkedIn for AI Credibility");
  }

  // Meeting 2
  const m2Summary = packMeetingSummary(
    "Concrete timeline and scope agreement for the Phase 1 Operating Core. Sudeesh emphasized getting the core plumbing and automated state transitions locked down before spending time on secondary branding elements. Aravind presented the client subscription tiers (10 vs 20 posts/mo) and automated pass-through expense billing. Finalized the 18-day timeline with V1 target on September 23.",
    {
      channel: "fathom_video",
      attendees: "Sudeesh D S, Aravind (Founder & CEO, BaseWorks)",
      key_decisions: [
        "Deliver core operational plumbing before secondary cosmetic branding",
        "Lock 18-day sprint with V1 delivery scheduled for September 23",
        "Structure retainers based on post volume tiers plus zero-markup software pass-through",
      ],
      action_items: [
        "Implement Slice 1-5 core architecture",
        "Finalize SVG brand animation assets",
      ],
    }
  );

  const { data: meeting2, error: err2 } = await supabase
    .from("meetings")
    .insert({
      client_id: BASEWORKS_CLIENT_ID,
      title: "Atom & Echo x BaseWorks II - Phase 1 Scope & Technical Execution Roadmap",
      meeting_date: "2026-09-15T14:30:00.000Z",
      fathom_recording_url: "https://fathom.video/share/sWx7kE9BkuTqrV6Cqf31czQTrex6rDaS",
      summary: m2Summary,
      raw_transcript: transcript2,
    })
    .select()
    .single();

  if (err2) {
    console.error("Error inserting meeting 2:", err2);
  } else {
    console.log("✓ Meeting 2 inserted:", meeting2.title);

    // Insert extracted knowledge item for Meeting 2
    await supabase.from("knowledge_items").insert({
      client_id: BASEWORKS_CLIENT_ID,
      category: "origin_story",
      title: "The 18-Day Operating System Sprint",
      content:
        "We set an aggressive 18-day delivery milestone to replace chaotic Notion spreadsheets with a deterministic operating core: 'Leave the branding aside for a few days, get the base technicalities right first.'",
      verified_metrics: { timeline: "18 days", v1_target: "Sept 23, 2026" },
      source_meeting_id: meeting2.id,
    });
    console.log("  ✓ Extracted story inserted: The 18-Day Operating System Sprint");
  }

  // Meeting 3: WhatsApp debrief sample
  const m3Summary = packMeetingSummary(
    "Aravind sent a voice note debriefing a conversation with an enterprise logistics prospect. They had a database outage at 2 AM that took 4 hours to recover due to bad connection pool limits in Prisma. Wanted to turn this into an engineering perspective post highlighting why direct connection pooling and WAL replication matter.",
    {
      channel: "whatsapp",
      attendees: "Aravind (Founder & CEO)",
      key_decisions: [
        "Draft a post on 'The 2 AM Database Migration Disaster'",
        "Use technical operator tone; avoid marketing jargon",
      ],
      action_items: [
        "Draft perspective post before Friday",
        "Linter check taboo buzzwords",
      ],
    }
  );

  const { data: meeting3, error: err3 } = await supabase
    .from("meetings")
    .insert({
      client_id: BASEWORKS_CLIENT_ID,
      title: "WhatsApp Voice Note: The 2 AM Database Outage Story",
      meeting_date: "2026-09-18T16:15:00.000Z",
      summary: m3Summary,
      raw_transcript:
        "[16:15] Aravind (Voice Note 01:42): Hey Sudeesh, just got off the phone with this Series B CTO in Bangalore. They lost 4 hours of production traffic last night because Prisma choked on connections during a batch migration. He told me: 'I wish we had just used raw SQL and PgBouncer from day one.' Let's write a post on this tomorrow. It's a huge pain point for our ICP.",
    })
    .select()
    .single();

  if (err3) {
    console.error("Error inserting meeting 3:", err3);
  } else {
    console.log("✓ Meeting 3 (WhatsApp) inserted:", meeting3.title);
  }

  console.log("Finished seeding BaseWorks meeting intelligence.");
}

seed().catch(console.error);
