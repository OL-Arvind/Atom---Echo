import { getReviewPortalDataByToken } from "@/lib/data/supabase-queries";
import { ReviewPortalClient } from "./review-client";
import { AtomEchoLogo } from "@/components/ui/logo";
import { Clock, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-base)] px-4 text-center text-[var(--color-ink)] select-none">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 shadow-dialog space-y-4">
          <div className="mx-auto flex items-center justify-center py-1">
            <AtomEchoLogo size={32} variant="wordmark" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
              Private Founder Desk
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              This workspace requires a personalized access link. Open the direct link shared on your WhatsApp by Sudeesh or your editorial lead.
            </p>
          </div>
          <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
            Atom &amp; Echo &middot; Private Founder Access
          </div>
        </div>
      </div>
    );
  }

  const data = await getReviewPortalDataByToken(token);

  if (!data.valid || !data.client) {
    const isExpired = data.reason === "expired";
    const isRevoked = data.reason === "revoked";

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-base)] px-4 text-center text-[var(--color-ink)] select-none">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 shadow-dialog space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-line)]">
            {isExpired ? (
              <Clock className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
              {isExpired
                ? "Founder Desk Link Expired"
                : isRevoked
                ? "Founder Desk Link Updated"
                : "Invalid Desk Link"}
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {isExpired
                ? "For your security, private review links expire after 7 days. Reply on WhatsApp and Sudeesh will send a fresh link immediately."
                : isRevoked
                ? "A newer Founder Desk link has been generated for your account. Check your latest WhatsApp message or ping your editorial lead."
                : "We couldn't match this URL to an active Founder Desk session. Please check the link from your WhatsApp."}
            </p>
          </div>
          <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
            Atom &amp; Echo &middot; Private Founder Access
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReviewPortalClient
      clientName={data.client.name}
      founderName={data.client.founder_name}
      founderTitle={data.client.founder_title || "Founder & CEO"}
      linkedinUrl={data.client.linkedin_url}
      initialPendingPosts={data.pendingPosts}
      initialApprovedPosts={data.approvedPosts}
      publishedPosts={data.publishedPosts}
      token={token}
    />
  );
}
