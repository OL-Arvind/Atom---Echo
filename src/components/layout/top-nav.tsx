"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Newspaper,
  Users,
  Feather,
  Calendar,
  Send,
  Receipt,
  Activity,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { CommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useHeader } from "./header-context";

interface RouteMeta {
  title: string;
  icon: LucideIcon;
  breadcrumbs: { label: string; href?: string }[];
}

function getRouteMetadata(pathname: string): RouteMeta {
  if (pathname.startsWith("/command-center")) {
    return {
      title: "Editorial Desk",
      icon: Newspaper,
      breadcrumbs: [{ label: "Editorial Desk" }],
    };
  }
  if (pathname.startsWith("/clients/")) {
    return {
      title: "Client Roster",
      icon: Users,
      breadcrumbs: [
        { label: "Client Roster", href: "/clients" },
        { label: "Founder Desk" },
      ],
    };
  }
  if (pathname.startsWith("/clients")) {
    return {
      title: "Client Roster",
      icon: Users,
      breadcrumbs: [{ label: "Client Roster" }],
    };
  }
  if (pathname.startsWith("/content/")) {
    return {
      title: "Story & Post Editor",
      icon: Feather,
      breadcrumbs: [
        { label: "Content Studio", href: "/content" },
        { label: "Story Editor" },
      ],
    };
  }
  if (pathname.startsWith("/content")) {
    return {
      title: "Content Studio",
      icon: Feather,
      breadcrumbs: [{ label: "Content Studio" }],
    };
  }
  if (pathname.startsWith("/calendar")) {
    return {
      title: "Publishing Schedule",
      icon: Calendar,
      breadcrumbs: [{ label: "Publishing Schedule" }],
    };
  }
  if (pathname.startsWith("/campaigns")) {
    return {
      title: "Outbound & GTM",
      icon: Send,
      breadcrumbs: [{ label: "Outbound & GTM" }],
    };
  }
  if (pathname.startsWith("/billing")) {
    return {
      title: "Retainers & Billing",
      icon: Receipt,
      breadcrumbs: [{ label: "Retainers & Billing" }],
    };
  }
  if (pathname.startsWith("/operations")) {
    return {
      title: "Activity Log",
      icon: Activity,
      breadcrumbs: [{ label: "Activity Log" }],
    };
  }
  return {
    title: "Editorial Desk",
    icon: Newspaper,
    breadcrumbs: [{ label: "Editorial Desk" }],
  };
}

export function TopNav() {
  const pathname = usePathname() || "/command-center";
  const { customTitle, customBreadcrumbs } = useHeader();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const routeMeta = getRouteMetadata(pathname);
  const Icon = routeMeta.icon;

  const breadcrumbs = customBreadcrumbs || (
    customTitle
      ? [
          ...routeMeta.breadcrumbs.slice(0, -1),
          { label: customTitle },
        ]
      : routeMeta.breadcrumbs
  );

  return (
    <>
      <header
        className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/90 backdrop-blur-md px-6 transition-colors"
      >
        {/* Left Side: Contextual Section Title & Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={14} strokeWidth={1.8} className="text-[var(--color-ink-tertiary)] shrink-0" />

          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-[13px] min-w-0 truncate">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={idx} className="flex items-center gap-1.5 min-w-0">
                  {idx > 0 && (
                    <ChevronRight
                      size={11}
                      className="text-[var(--color-ink-muted)] shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={`truncate ${
                        isLast
                          ? "font-medium text-[var(--color-ink)] tracking-tight"
                          : "text-[var(--color-ink-tertiary)] font-normal"
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Global Search, Theme Switcher & Contextual Action Slot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] hover:border-[var(--color-line-strong)] text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-all duration-150 w-72 text-left shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <Search size={13} strokeWidth={1.8} className="text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink-secondary)] transition-colors shrink-0" />
            <span className="flex-1 truncate text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink-secondary)] transition-colors">
              Search founders, stories, retainers...
            </span>
            <kbd className="font-sans tabular-nums text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink-secondary)] transition-colors shrink-0">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />

          {/* Action Portal Target */}
          <div id="top-nav-actions" className="flex items-center gap-2 empty:hidden" />
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
