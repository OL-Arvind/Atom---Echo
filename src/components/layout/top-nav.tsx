"use client";

import { Search, Bell, Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function TopNav() {
  const [quickActionSuccess, setQuickActionSuccess] = useState<string | null>(null);

  const handleQuickAdd = () => {
    setQuickActionSuccess("New Post Draft initialized for Chetan Ahuja");
    setTimeout(() => setQuickActionSuccess(null), 3000);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-surface/90 px-6 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Search clients, posts, tool expenses... (⌘K)"
            className="w-full rounded-lg border border-border-subtle bg-canvas py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-foreground-subtle focus:border-brand focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {quickActionSuccess && (
          <div className="flex items-center gap-1.5 rounded-full bg-status-emerald-bg px-3 py-1 text-xs font-semibold text-status-emerald border border-status-emerald-border animate-subtle-fade">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{quickActionSuccess}</span>
          </div>
        )}
      </div>

      {/* Action Strip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border-r border-border-subtle pr-3">
          <div className="flex items-center gap-1.5 rounded-full bg-status-emerald-bg px-2.5 py-1 text-[11px] font-semibold text-status-emerald border border-status-emerald-border">
            <span className="h-2 w-2 rounded-full bg-status-emerald animate-pulse" />
            Supabase Live &middot; Inngest Active
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          aria-label="Draft new content post"
          className="btn-pressable flex h-10 min-h-[40px] items-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-semibold text-white shadow-subtle hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus className="h-4 w-4" />
          <span>Draft Post</span>
        </button>
      </div>
    </header>
  );
}
