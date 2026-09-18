import { notFound } from "next/navigation";
import { getReviewPostByToken } from "@/lib/data/supabase-queries";
import { ReviewPortalClient } from "./review-client";

export const dynamic = "force-dynamic";

export default async function ReviewPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const reviewData = await getReviewPostByToken(token);

  if (!reviewData || !reviewData.post) {
    // Return friendly expired or completed screen
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-zinc-100">
            All Caught Up!
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            There are no pending posts requiring your review right now, or this review link has expired.
          </p>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Atom & Echo OS &middot; Secure Review Portal
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReviewPortalClient
      clientName={reviewData.client.name}
      founderName={reviewData.client.founder_name}
      post={reviewData.post}
      token={token}
    />
  );
}
