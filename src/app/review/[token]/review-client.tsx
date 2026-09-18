"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, MessageSquare, Sparkles, Send, ShieldCheck, ThumbsUp, AlertCircle } from "lucide-react";
import { approveContentAction, requestContentChangesAction } from "@/lib/actions/content";
import { AtomEchoLogo } from "@/components/ui/logo";

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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-stagger-1">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white border border-zinc-700">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Post Approved!
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Thank you, <span className="font-semibold text-white">{founderName}</span>. Your LinkedIn post has been locked and scheduled for publication.
          </p>
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-left text-xs text-zinc-400">
            <div className="font-semibold text-white font-mono uppercase text-[10px] tracking-widest">
              What happens next:
            </div>
            <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-300">
              <li>Agency calendar updated automatically</li>
              <li>Publishing task assigned to execution team</li>
              <li>Zero extra action required from you</li>
            </ul>
          </div>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
            <span>Verified 1-Click Approval &middot; Atom &amp; Echo OS</span>
          </div>
        </div>
      </div>
    );
  }

  if (feedbackSent) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-stagger-1">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white border border-zinc-700">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-white">
            Feedback Sent to Team
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Sudeesh and the writing team have received your revision notes. A calibrated draft will be ready shortly.
          </p>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-400 font-mono">
            Atom &amp; Echo OS &middot; Real-time Feedback Gateway
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-32">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-black/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AtomEchoLogo size={28} showText={false} />
          <div>
            <div className="text-[10px] font-mono font-semibold tracking-widest text-zinc-400 uppercase">
              Client Review Portal
            </div>
            <div className="text-xs font-bold text-white">
              {clientName} &middot; {founderName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono font-semibold text-zinc-200">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </div>
      </header>

      {/* Main Post Card Container */}
      <main className="mx-auto max-w-lg px-4 pt-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-white">
            <AlertCircle className="h-4 w-4 shrink-0 text-white" />
            <span>{error}</span>
          </div>
        )}

        {/* Pillar Tag */}
        {post.target_pillar && (
          <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-300">
            <Sparkles className="h-3 w-3 text-white" />
            <span>{post.target_pillar}</span>
          </div>
        )}

        {/* Post Title */}
        <h1 className="font-display text-lg font-bold tracking-tight text-white leading-snug">
          {post.title}
        </h1>

        {/* Post Content Box (LinkedIn Styled Preview) */}
        <div className="rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200 font-sans">
            {post.body_markdown}
          </div>
        </div>

        {/* Feedback Drawer (Conditional) */}
        {showFeedbackDrawer && (
          <div className="rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-5 shadow-2xl space-y-3 animate-stagger-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Quick Feedback Tags (Tap to select)
              </span>
              <button
                onClick={() => setShowFeedbackDrawer(false)}
                className="btn-pressable text-xs text-zinc-400 hover:text-white"
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
                    className={`btn-pressable rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-white text-black font-semibold border border-white"
                        : "bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700"
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
            />

            <button
              onClick={handleSendFeedback}
              disabled={isPending || (selectedChips.length === 0 && !commentText.trim())}
              className="btn-pressable flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-black shadow-md hover:bg-zinc-200 disabled:opacity-50 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? "Sending..." : "Submit Revision Request"}</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Bar (Fixed at bottom for mobile ergonomics) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-black/95 p-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={() => setShowFeedbackDrawer(!showFeedbackDrawer)}
            disabled={isPending}
            className="btn-pressable flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <MessageSquare className="h-4 w-4 text-white" />
            <span>Request Changes</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isPending}
            className="btn-pressable flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-black shadow-[0_2px_12px_rgba(255,255,255,0.15)] hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{isPending ? "Approving..." : "Approve Post (1-Tap)"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
