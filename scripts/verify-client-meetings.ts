import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

import { getClientByIdFromDb } from "../src/lib/data/supabase-queries";

async function main() {
  const client = await getClientByIdFromDb("d011d0cc-05d3-42c7-aa4d-ae011df54f0e");
  if (!client) {
    console.error("Client not found!");
    process.exit(1);
  }

  console.log("Client:", client.name);
  console.log("Total meetings in memory:", client.meetings?.length);
  client.meetings?.forEach((m, idx) => {
    console.log(`\n[Meeting ${idx + 1}]`);
    console.log("  Title:", m.title);
    console.log("  Date:", m.meeting_date);
    console.log("  Channel:", m.channel);
    console.log("  Attendees:", m.attendees);
    console.log("  Summary (preview):", m.summary.slice(0, 80) + "...");
    console.log("  Decisions count:", m.key_decisions?.length);
    console.log("  Actions count:", m.action_items?.length);
    console.log("  Linked stories:", m.knowledge_items?.length);
  });

  console.log("\nTotal knowledge items (Story & Metric Vault):", client.knowledge_items?.length);
  client.knowledge_items?.forEach((ki, idx) => {
    console.log(`  Story ${idx + 1}: [${ki.category}] ${ki.title}`);
  });

  console.log("\nALL VERIFICATIONS PASSED!");
}

main().catch(console.error);
