"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Crosshair,
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
import { useHeader } from "./header-context";

interface RouteMeta {
  title: string;
  icon: LucideIcon;
  breadcrumbs: { label: string; href?: string }[];
}

function getRouteMetadata(pathname: string): RouteMeta {
  if (pathname.startsWith("/command-center")) {
    return {
      title: "Command Center",
      icon: Crosshair,
      breadcrumbs: [{ label: "Command Center" }],
    };
  }
  if (pathname.startsWith("/clients/")) {
    return {
      title: "Client Profile",
      icon: Users,
      breadcrumbs: [
        { label: "Clients", href: "/clients" },
        { label: "Client 360" },
      ],
    };
  }
  if (pathname.startsWith("/clients")) {
    return {
      title: "Clients",
      icon: Users,
      breadcrumbs: [{ label: "Clients" }],
    };
  }
  if (pathname.startsWith("/content/")) {
    return {
      title: "Post Editor",
      icon: Feather,
      breadcrumbs: [
        { label: "Content", href: "/content" },
        { label: "Post Editor" },
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
      title: "Master Calendar",
      icon: Calendar,
      breadcrumbs: [{ label: "Master Calendar" }],
    };
  }
  if (pathname.startsWith("/campaigns")) {
    return {
      title: "Outbound Campaigns",
      icon: Send,
      breadcrumbs: [{ label: "Outbound Campaigns" }],
    };
  }
  if (pathname.startsWith("/billing")) {
    return {
      title: "Invoices & Billing",
      icon: Receipt,
      breadcrumbs: [{ label: "Invoices & Billing" }],
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
    title: "Command Center",
    icon: Crosshair,
    breadcrumbs: [{ label: "Workspace" }],
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
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          height: "52px",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-line-subtle)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          padding: "0 24px",
        }}
      >
        {/* Left Side: Contextual Section Title & Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] border border-[var(--color-line-subtle)] shrink-0">
            <Icon size={13} strokeWidth={2} />
          </div>

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
                          ? "font-semibold text-[var(--color-ink)] tracking-tight"
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

        {/* Right Side: Global Search & Contextual Action Slot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-line)",
              background: "var(--color-base-subtle)",
              color: "var(--color-ink-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              width: "210px",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent-dim)";
              e.currentTarget.style.color = "var(--color-ink-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-line)";
              e.currentTarget.style.color = "var(--color-ink-muted)";
            }}
          >
            <Search size={12} strokeWidth={1.75} />
            <span style={{ flex: 1 }}>Search clients, posts...</span>
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                padding: "1.5px 4.5px",
                borderRadius: "3px",
                border: "1px solid var(--color-line-strong)",
                background: "var(--color-base-overlay)",
                color: "var(--color-ink-muted)",
                lineHeight: 1.4,
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Action Portal Target */}
          <div id="top-nav-actions" className="flex items-center gap-2 empty:hidden" />
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
