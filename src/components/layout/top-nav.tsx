"use client";

import { Search, Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function TopNav() {
  const [quickActionSuccess, setQuickActionSuccess] = useState<string | null>(null);

  const handleQuickAdd = () => {
    setQuickActionSuccess("New Content Draft ready in editor");
    setTimeout(() => setQuickActionSuccess(null), 3000);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-[#09090B]/85 px-6 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search clients, posts, tool expenses... (⌘K)"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:border-white focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
          />
        </div>

        {quickActionSuccess && (
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white border border-zinc-700 animate-stagger-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            <span>{quickActionSuccess}</span>
          </div>
        )}
      </div>

      {/* Action Strip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border-r border-zinc-800 pr-3">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-300 border border-zinc-800">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Supabase Live &middot; Inngest Active
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          aria-label="Draft new content post"
          className="btn-pressable flex h-9 min-h-[36px] items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-semibold text-black shadow-[0_1px_4px_rgba(255,255,255,0.15)] hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="h-4 w-4" />
          <span>Draft Post</span>
        </button>
      </div>
    </header>
  );
}
