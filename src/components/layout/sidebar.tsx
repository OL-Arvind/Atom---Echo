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
} from "lucide-react";
import { AtomEchoLogo } from "@/components/ui/logo";

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
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Content Engine",
    href: "/content",
    icon: CalendarDays,
  },
  {
    name: "Outbound Campaigns",
    href: "/campaigns",
    icon: SendHorizontal,
  },
  {
    name: "Tool Billing & Leakage",
    href: "/billing",
    icon: Wrench,
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-zinc-800/80 bg-[#09090B] text-white">
      {/* Brand Header with Real Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-5">
        <Link href="/command-center" className="btn-pressable group">
          <AtomEchoLogo size={34} showText={true} />
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">
          Attention Surface
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/command-center" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn-pressable group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-[0_2px_8px_rgba(255,255,255,0.12)]"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors duration-150 ${
                      isActive ? "text-black" : "text-zinc-500 group-hover:text-white"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`tabular-numbers font-mono rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
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
        <div className="mt-8 border-t border-zinc-800/80 pt-4">
          <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">
            <span>Client Workspaces</span>
            <Link
              href="/clients"
              className="text-[10px] text-zinc-300 hover:text-white font-bold transition-colors"
            >
              Directory
            </Link>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400">
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Manage founder retainers, content pipelines, and pass-through software seats.
            </p>
            <Link
              href="/clients"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-zinc-300 transition-colors"
            >
              <span>Go to Client Workspaces &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operator Session Footer */}
      <div className="border-t border-zinc-800/80 p-3">
        <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-sm">
              SD
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white">Sudeesh D S</p>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Founder (Admin)
              </p>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-zinc-400" />
        </div>
      </div>
    </aside>
  );
}
