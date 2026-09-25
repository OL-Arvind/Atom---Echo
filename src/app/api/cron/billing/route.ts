import { NextResponse } from "next/server";
import { runBillingAnchorCycleAction } from "@/lib/actions/billing";
import { getServerOperatorSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Automated Cron Endpoint for Invoicing Cycle
 * Triggered daily by Vercel Cron, Inngest, or an authenticated operator.
 * Finds clients within 7 days of their billing anchor day and drafts consolidated invoices.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const hasValidCronSecret = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!hasValidCronSecret) {
      const operatorSession = await getServerOperatorSession();
      if (!operatorSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await runBillingAnchorCycleAction();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal billing cron error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
