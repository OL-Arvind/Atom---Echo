"use client";

import React from "react";
import Link from "next/link";
import {
  Newspaper,
  Users,
  Feather,
  Calendar,
  Send,
  Receipt,
  Activity,
} from "lucide-react";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";

const NAV_ITEMS = [
  { name: "Editorial Desk", href: "/command-center", icon: Newspaper, section: "ops" },
  { name: "Client Roster", href: "/clients", icon: Users, section: "ops" },
  { name: "Content Studio", href: "/content", icon: Feather, section: "ops" },
  { name: "Publishing Schedule", href: "/calendar", icon: Calendar, section: "ops" },
  { name: "Outbound & GTM", href: "/campaigns", icon: Send, section: "revenue" },
  { name: "Retainers & Billing", href: "/billing", icon: Receipt, section: "revenue" },
  { name: "Activity Log", href: "/operations", icon: Activity, section: "system" },
];

const SECTIONS: Record<string, string> = {
  ops: "Editorial & Roster",
  revenue: "Commercials",
  system: "Operations",
};

interface SidebarNavProps {
  isCollapsed: boolean;
  pathname: string;
  activeNavSection: string | null;
}

export function SidebarNav({ isCollapsed, pathname, activeNavSection }: SidebarNavProps) {
  const grouped = ["ops", "revenue", "system"];

  return (
    <nav
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: isCollapsed ? "12px 8px" : "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: isCollapsed ? "4px" : "0",
      }}
    >
      {grouped.map((section, idx) => {
        const items = NAV_ITEMS.filter((i) => i.section === section);
        return (
          <div key={section} style={{ marginBottom: isCollapsed ? "8px" : "18px" }}>
            {isCollapsed ? (
              idx > 0 ? (
                <div
                  style={{
                    height: "1px",
                    background: "var(--color-line-subtle)",
                    margin: "6px 8px 10px",
                  }}
                />
              ) : null
            ) : (
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "9.5px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                  padding: "0 8px",
                  marginBottom: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                {SECTIONS[section]}
              </div>
            )}

            {items.map((item) => {
              const effectivePath = activeNavSection || pathname;
              const isActive =
                effectivePath === item.href ||
                (item.href !== "/command-center" && effectivePath.startsWith(item.href));
              const Icon = item.icon;
              return (
                <SidebarTooltip
                  key={item.href}
                  content={item.name}
                  enabled={isCollapsed}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="active:scale-[0.98] select-none"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: "9px",
                      padding: isCollapsed ? "8px 0" : "7px 8px",
                      width: isCollapsed ? "44px" : "auto",
                      margin: isCollapsed ? "0 auto 2px auto" : "0 0 1px 0",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--color-ink)" : "var(--color-ink-tertiary)",
                      background: isActive ? "var(--color-base-subtle)" : "transparent",
                      transition: "transform 150ms ease-out, background 120ms ease, color 120ms ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--color-ink-secondary)";
                        e.currentTarget.style.background = "var(--color-line-subtle)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--color-ink-tertiary)";
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <Icon
                      size={isCollapsed ? 16 : 14}
                      color={isActive ? "var(--color-accent)" : "currentColor"}
                      strokeWidth={isActive ? 2 : 1.75}
                      style={{ flexShrink: 0 }}
                    />

                    {!isCollapsed && (
                      <>
                        <span
                          style={{
                            lineHeight: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </span>
                        {isActive && (
                          <div
                            style={{
                              marginLeft: "auto",
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              background: "var(--color-accent)",
                              boxShadow: "0 0 6px rgba(211, 255, 90, 0.4)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </>
                    )}

                    {isCollapsed && isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "3px",
                          height: "16px",
                          borderRadius: "0 2px 2px 0",
                          background: "var(--color-ink)",
                        }}
                      />
                    )}
                  </Link>
                </SidebarTooltip>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
