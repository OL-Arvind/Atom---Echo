"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Compass,
  Users,
  Feather,
  CreditCard,
  Layers,
  History,
  Plus,
  X,
  ArrowRight,
  ShieldCheck,
  Building2,
  LogOut,
} from "lucide-react";
import { clearStoredUser } from "@/lib/auth/dummy-auth";

interface CommandItem {
  id: string;
  category: "Navigation" | "Actions" | "System";
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenOnboardModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboardModal?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const items: CommandItem[] = [
    {
      id: "nav-cmd",
      category: "Navigation",
      title: "Command Center",
      subtitle: "See what needs attention today, approvals, and upcoming posts",
      icon: Compass,
      action: () => handleNavigate("/command-center"),
    },
    {
      id: "nav-clients",
      category: "Navigation",
      title: "Clients",
      subtitle: "View all client profiles, retainers, passwords, and voice guidelines",
      icon: Users,
      action: () => handleNavigate("/clients"),
    },
    {
      id: "nav-content",
      category: "Navigation",
      title: "Content",
      subtitle: "Draft, review, and schedule LinkedIn posts",
      icon: Feather,
      action: () => handleNavigate("/content"),
    },
    {
      id: "nav-billing",
      category: "Navigation",
      title: "Invoices & Billing",
      subtitle: "Track monthly retainers and bill client software expenses",
      icon: CreditCard,
      action: () => handleNavigate("/billing"),
    },
    {
      id: "nav-campaigns",
      category: "Navigation",
      title: "Outbound Campaigns",
      subtitle: "View cold outreach sequences, mailboxes, and lead generation",
      icon: Layers,
      action: () => handleNavigate("/campaigns"),
    },
    {
      id: "nav-ops",
      category: "Navigation",
      title: "Activity Log",
      subtitle: "Recent client actions, comments, holds, and login access",
      icon: History,
      action: () => handleNavigate("/operations"),
    },
    {
      id: "act-onboard",
      category: "Actions",
      title: "Add New Client",
      subtitle: "Onboard a new client, set monthly retainer, and service lines",
      icon: Plus,
      action: () => {
        onClose();
        if (onOpenOnboardModal) onOpenOnboardModal();
      },
      badge: "Quick",
    },
    {
      id: "act-logout",
      category: "Actions",
      title: "Log Out",
      subtitle: "Sign out of your operator session and return to the sign in screen",
      icon: LogOut,
      action: async () => {
        onClose();
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch {
          // Ignore network error on signout
        }
        clearStoredUser();
        router.push("/login");
      },
    },
  ];

  const filteredItems = items.filter((item) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] shadow-dialog overflow-hidden text-[var(--color-ink)] animate-in">
        {/* Search Header */}
        <div className="relative flex items-center border-b border-[var(--color-line)] px-4 py-3 bg-[var(--color-base-raised)]">
          <Search className="h-4 w-4 text-[var(--color-ink-muted)] shrink-0 mr-3" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command, account, or action..."
            style={{
              outline: "none",
              boxShadow: "none",
              border: "none",
            }}
            className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 shadow-none"
          />
          <button
            onClick={onClose}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-transparent">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
              No matches found for &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-[var(--radius-sm)] px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium"
                      : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] border shrink-0 ${
                        isSelected
                          ? "border-[var(--color-accent-line)] bg-[var(--color-accent-bg)] text-[var(--color-accent-text)]"
                          : "border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[13px]">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                            [{item.badge}]
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-[var(--color-ink-tertiary)] font-normal truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                      isSelected ? "text-[var(--color-accent-text)] opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-base-raised)] px-4 py-2 text-[10.5px] text-[var(--color-ink-tertiary)] font-sans tabular-nums">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-1 py-0.5 shadow-2xs">↑</kbd>
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-1 py-0.5 shadow-2xs ml-1">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-1.5 py-0.5 shadow-2xs">↵</kbd> to select
            </span>
          </div>
          <span>Atom &amp; Echo OS</span>
        </div>
      </div>
    </div>
  );
}
