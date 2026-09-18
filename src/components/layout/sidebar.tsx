"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  SendHorizontal,
  Wrench,
  LifeBuoy,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeType?: "critical" | "warning" | "neutral";
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Command Center",
    href: "/command-center",
    icon: LayoutDashboard,
    badge: 4,
    badgeType: "critical",
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    badge: "4 Active",
    badgeType: "neutral",
  },
  {
    name: "Content Engine",
    href: "/content",
    icon: CalendarDays,
    badge: 2,
    badgeType: "warning",
  },
  {
    name: "Outbound Campaigns",
    href: "/campaigns",
    icon: SendHorizontal,
  },
  {
    name: "Tool Billing & Expenses",
    href: "/billing",
    icon: Wrench,
    badge: "₹24.9k",
    badgeType: "warning",
  },
  {
    name: "Operations & Requests",
    href: "/operations",
    icon: LifeBuoy,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border-subtle bg-surface shadow-subtle">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border-subtle px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-subtle">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-display text-sm font-bold tracking-tight text-foreground">
              ATOM & ECHO
              <span className="rounded bg-brand-subtle px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                OS
              </span>
            </div>
            <p className="text-[11px] font-medium text-foreground-muted">BaseWorks Cockpit</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Attention Surface
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/command-center" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn-pressable group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium ${
                  isActive
                    ? "bg-brand-subtle text-brand font-semibold shadow-subtle"
                    : "text-foreground-muted hover:bg-canvas hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors duration-150 ${
                      isActive ? "text-brand" : "text-foreground-subtle group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`tabular-numbers rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.badgeType === "critical"
                        ? "bg-status-rose-bg text-status-rose border border-status-rose-border"
                        : item.badgeType === "warning"
                        ? "bg-status-amber-bg text-status-amber border border-status-amber-border"
                        : "bg-canvas text-foreground-muted border border-border-subtle"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Client Management Shortcut */}
        <div className="mt-8 border-t border-border-subtle pt-4">
          <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-foreground-subtle">
            <span>Client Workspaces</span>
            <Link href="/clients" className="text-[10px] text-brand hover:underline font-bold">
              Directory
            </Link>
          </div>
          <div className="px-3 py-2 rounded-lg bg-canvas/60 border border-border-subtle text-xs text-foreground-muted">
            <p className="text-[11px] leading-relaxed">
              Manage founder retainers, content pipelines, and tool subscriptions.
            </p>
            <Link
              href="/clients"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              <span>Go to Client Workspaces &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operator Session Footer */}
      <div className="border-t border-border-subtle p-3">
        <div className="flex items-center justify-between rounded-lg bg-canvas p-2.5 border border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              SD
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">Sudeesh D S</p>
              <p className="text-[10px] text-foreground-muted flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-status-emerald" /> Founder (Admin)
              </p>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-foreground-subtle" />
        </div>
      </div>
    </aside>
  );
}
