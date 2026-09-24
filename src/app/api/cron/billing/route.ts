import { NextResponse } from "next/server";
import { runBillingAnchorCycleAction } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

/**
 * Automated Cron Endpoint for Invoicing Cycle
 * Can be triggered daily by Vercel Cron, Inngest, or external scheduler.
 * Finds clients within 7 days of their billing anchor day and drafts consolidated invoices.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runBillingAnchorCycleAction();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
