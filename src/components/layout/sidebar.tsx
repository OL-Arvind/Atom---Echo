"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Crosshair,
  Users,
  Feather,
  Calendar,
  Send,
  Receipt,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { LogoutModal } from "@/components/auth/logout-modal";
import { getStoredUser, syncSupabaseSessionUser, AuthUser } from "@/lib/auth/dummy-auth";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";
import { UserAvatar } from "@/components/ui/user-avatar";

const NAV_ITEMS = [
  { name: "Command Center", href: "/command-center", icon: Crosshair, section: "ops" },
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

const EMPTY_USER: AuthUser = {
  id: "",
  name: "Operator",
  email: "",
  role: "Authenticated Session",
  initials: "AE",
  provider: "google",
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<AuthUser>(EMPTY_USER);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const grouped = ["ops", "revenue", "system"];

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    syncSupabaseSessionUser().then((synced) => {
      if (synced) setUser(synced);
    });
    const handleAuth = () => {
      const updated = getStoredUser();
      if (updated) setUser(updated);
    };
    window.addEventListener("ae_auth_change", handleAuth);
    return () => window.removeEventListener("ae_auth_change", handleAuth);
  }, []);

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: isCollapsed ? "64px" : "220px",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-base-raised)",
        borderRight: "1px solid var(--color-line)",
        zIndex: 30,
        transition: "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        cursor: "default",
      }}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div
        style={{
          padding: isCollapsed ? "18px 12px 14px" : "18px 14px 14px",
          borderBottom: "1px solid var(--color-line-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          height: "58px",
          boxSizing: "border-box",
        }}
      >
        {isCollapsed ? (
          <SidebarTooltip content="Expand sidebar" hint="[" enabled={isCollapsed}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              aria-label="Expand sidebar"
              className="group"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "7px",
                border: "1px solid transparent",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-base-subtle)";
                e.currentTarget.style.borderColor = "var(--color-line)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <Image
                src="/icon-symbol-white.png"
                alt="Atom & Echo"
                width={22}
                height={22}
                priority
                className="object-contain w-[22px] h-[22px] select-none transition-transform duration-150 group-hover:scale-95"
              />
            </button>
          </SidebarTooltip>
        ) : (
          <>
            <Link
              href="/command-center"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Image
                src="/brand-wordmark-white.svg"
                alt="Atom & Echo"
                width={76}
                height={28}
                priority
                unoptimized
                className="object-contain h-[28px] w-auto select-none"
              />
            </Link>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              title="Collapse sidebar (Ctrl+B or [)"
              aria-label="Collapse sidebar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "5px",
                border: "1px solid transparent",
                background: "transparent",
                color: "var(--color-ink-tertiary)",
                cursor: "pointer",
                transition: "all 0.12s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink)";
                e.currentTarget.style.background = "var(--color-base-subtle)";
                e.currentTarget.style.borderColor = "var(--color-line)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-ink-tertiary)";
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <PanelLeftClose size={14} strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links */}
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
                    fontFamily: "var(--font-sans tabular-nums)",
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
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/command-center" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <SidebarTooltip
                    key={item.href}
                    content={item.name}
                    enabled={isCollapsed}
                  >
                    <Link
                      href={item.href}
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
                        transition: "all 0.12s ease",
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

      {/* Footer — Operator or Expand Bar */}
      <div
        style={{
          padding: isCollapsed ? "10px 8px" : "12px",
          borderTop: "1px solid var(--color-line-subtle)",
          boxSizing: "border-box",
        }}
      >
        {isCollapsed ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            {/* Dedicated Expand Sidebar Button */}
            <SidebarTooltip content="Expand sidebar" hint="[" enabled={isCollapsed}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSidebar();
                }}
                aria-label="Expand sidebar"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "transparent",
                  border: "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-ink-muted)",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-line)";
                  e.currentTarget.style.background = "var(--color-base-subtle)";
                  e.currentTarget.style.color = "var(--color-ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-ink-muted)";
                }}
              >
                <PanelLeftOpen size={16} strokeWidth={1.8} />
              </button>
            </SidebarTooltip>

            {/* User Avatar Button */}
            <SidebarTooltip content={user.name} enabled={isCollapsed}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLogoutModal(true);
                }}
                aria-label={`${user.name} account settings`}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <UserAvatar
                  seed={user.email || user.name}
                  size={32}
                  className="rounded-[6px] hover:border-[var(--color-accent)] transition-colors"
                  alt={user.name}
                />
              </button>
            </SidebarTooltip>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Collapse Sidebar Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid transparent",
                background: "transparent",
                color: "var(--color-ink-muted)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "all 0.12s ease",
                marginBottom: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink)";
                e.currentTarget.style.background = "var(--color-base-subtle)";
                e.currentTarget.style.borderColor = "var(--color-line-subtle)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-ink-muted)";
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <PanelLeftClose size={14} strokeWidth={1.8} />
              <span style={{ flex: 1, textAlign: "left" }}>Collapse sidebar</span>
              <kbd
                style={{
                  fontFamily: "var(--font-sans tabular-nums)",
                  fontSize: "10px",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  border: "1px solid var(--color-line)",
                  background: "var(--color-base-overlay)",
                  color: "var(--color-ink-muted)",
                  lineHeight: 1.2,
                }}
              >
                [
              </kbd>
            </button>

            {/* User Info Button */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Click to manage account or log out"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "var(--color-base-subtle)",
                border: "1px solid var(--color-line)",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.12s ease",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-base-overlay)";
                e.currentTarget.style.borderColor = "var(--color-line-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-base-subtle)";
                e.currentTarget.style.borderColor = "var(--color-line)";
              }}
            >
              <UserAvatar
                seed={user.email || user.name}
                size={28}
                className="rounded-[6px]"
                alt={user.name}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans tabular-nums)",
                    fontSize: "9px",
                    color: "var(--color-ink-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    marginTop: "1.5px",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span>{user.role}</span>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        user={user}
      />
    </aside>
  );
}
