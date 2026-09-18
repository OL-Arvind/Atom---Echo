"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, MessageSquare, Sparkles, Send, ShieldCheck, ThumbsUp, AlertCircle } from "lucide-react";
import { approveContentAction, requestContentChangesAction } from "@/lib/actions/content";

interface ReviewPortalClientProps {
  clientName: string;
  founderName: string;
  post: {
    id: string;
    title: string;
    body_markdown: string;
    target_pillar?: string;
    scheduled_publish_date?: string;
  };
  token: string;
}

const FEEDBACK_CHIPS = [
  "Make it punchier",
  "Too promotional",
  "Adjust covenant terms",
  "Check numbers/stats",
  "Tone too casual",
  "Ready to publish",
];

export function ReviewPortalClient({
  clientName,
  founderName,
  post,
  token,
}: ReviewPortalClientProps) {
  const [isPending, startTransition] = useTransition();
  const [approved, setApproved] = useState(false);
  const [showFeedbackDrawer, setShowFeedbackDrawer] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveContentAction(post.id);
      if (res.success) {
        setApproved(true);
      } else {
        setError(res.error || "Failed to approve post");
      }
    });
  };

  const handleSendFeedback = () => {
    if (selectedChips.length === 0 && !commentText.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await requestContentChangesAction(post.id, commentText, selectedChips);
      if (res.success) {
        setFeedbackSent(true);
      } else {
        setError(res.error || "Failed to submit feedback");
      }
    });
  };

  if (approved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl animate-scale-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Post Approved!
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Thank you, <span className="font-semibold text-white">{founderName}</span>. Your LinkedIn post has been locked and scheduled for publication.
          </p>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left text-xs text-zinc-400">
            <div className="font-semibold text-zinc-200">What happens next:</div>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Agency calendar updated automatically</li>
              <li>Publishing task assigned to operator</li>
              <li>Zero extra action required from you</li>
            </ul>
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-[11px] text-zinc-500 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verified 1-Click Approval &middot; Atom & Echo OS</span>
          </div>
        </div>
      </div>
    );
  }

  if (feedbackSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-white">
            Feedback Sent to Team
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Sudeesh and the writing team have received your revision notes. A calibrated draft will be ready shortly.
          </p>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            Atom & Echo OS &middot; Real-time Feedback Gateway
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 pb-28">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-[#09090B]/90 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d13202] text-xs font-bold text-white shadow-sm">
            A&E
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              Client Review Portal
            </div>
            <div className="text-xs font-bold text-zinc-100">
              {clientName} &middot; {founderName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
          <Clock className="h-3 w-3" />
          <span>Pending Review</span>
        </div>
      </header>

      {/* Main Post Card Container */}
      <main className="mx-auto max-w-lg px-4 pt-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pillar Tag */}
        {post.target_pillar && (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>{post.target_pillar}</span>
          </div>
        )}

        {/* Post Title */}
        <h1 className="font-display text-lg font-bold tracking-tight text-white leading-snug">
          {post.title}
        </h1>

        {/* Post Content Box (LinkedIn Styled Preview) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-inner">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200 font-sans">
            {post.body_markdown}
          </div>
        </div>

        {/* Feedback Drawer (Conditional) */}
        {showFeedbackDrawer && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl space-y-3 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">
                Quick Feedback Tags (Tap to select)
              </span>
              <button
                onClick={() => setShowFeedbackDrawer(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CHIPS.map((chip) => {
                const isSelected = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    onClick={() => toggleChip(chip)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[#d13202] text-white border border-[#d13202]"
                        : "bg-zinc-800/70 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-800"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add specific notes or rewrite suggestions..."
              rows={3}
              className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-500 focus:border-[#d13202] focus:outline-none"
            />

            <button
              onClick={handleSendFeedback}
              disabled={isPending || (selectedChips.length === 0 && !commentText.trim())}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-500 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? "Sending..." : "Submit Revision Request"}</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Bar (Fixed at bottom for mobile ergonomics) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#09090B]/95 p-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="h-4 w-4 text-amber-400" />
            <span>Request Changes</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{isPending ? "Approving..." : "Approve Post (1-Tap)"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
