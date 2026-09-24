import { getReviewPortalDataByToken } from "@/lib/data/supabase-queries";
import { ReviewPortalClient } from "./[token]/review-client";
import { AtomEchoLogo } from "@/components/ui/logo";
import { Clock, ShieldAlert, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReviewQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token || "";

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--color-base)] px-4 text-center text-[var(--color-ink)] select-none">
        <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-7 shadow-dialog space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink-tertiary)]">
            <AtomEchoLogo size={28} showText={false} />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
              Client Review Portal
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              No review token was provided. Please use the personalized magic link sent to your WhatsApp by Sudeesh or your account team.
            </p>
          </div>
          <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-mono">
            Atom &amp; Echo &middot; Secure Access
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-line)]">
            {isExpired ? (
              <Clock className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-normal text-[var(--color-ink)]">
              {isExpired
                ? "Review Link Expired"
                : isRevoked
                ? "Review Link Revoked"
                : "Invalid Review Link"}
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {isExpired
                ? "This review session has expired (review links remain valid for 7 days for security). Sudeesh or your account lead can send you a fresh link on WhatsApp."
                : isRevoked
                ? "This review session was revoked or updated. Please request a new link from your account lead."
                : "We could not locate an active client review session matching this link. Please check your URL."}
            </p>
          </div>
          <div className="border-t border-[var(--color-line-subtle)] pt-3 text-[11px] text-[var(--color-ink-tertiary)] font-mono">
            Atom &amp; Echo &middot; Zero-Login Security
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
