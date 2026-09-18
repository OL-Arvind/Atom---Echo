import { SendHorizontal, Plus } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-stagger-1 text-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            <SendHorizontal className="h-3.5 w-3.5 text-white" />
            <span>OUTBOUND COLD PIPELINE &middot; LEAD GENERATION</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
            Outbound Campaigns
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Multi-inbox infrastructure, Clay scraping flows, and cold campaign deliverability tracking.
          </p>
        </div>

        <Link
          href="/command-center"
          className="btn-pressable flex min-h-[38px] items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black shadow-[0_1px_4px_rgba(255,255,255,0.15)] hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign Wave</span>
        </Link>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#0C0C0E]/50 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-inner mb-4">
          <SendHorizontal className="h-7 w-7 text-white" />
        </div>
        <h2 className="font-display text-lg font-bold text-white">
          No Active Outbound Campaigns
        </h2>
        <p className="mt-1 max-w-md text-xs text-zinc-400 leading-relaxed">
          Configure outreach campaigns when onboarding clients with Cold Outreach retainers.
        </p>
      </div>
    </div>
  );
}
