"use client";

import React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeToggle } from "./theme-toggle";
import type { AuthUser } from "@/lib/auth/dummy-auth";

interface SidebarFooterProps {
  isCollapsed: boolean;
  user: AuthUser;
  onToggleSidebar: () => void;
  onOpenLogoutModal: () => void;
}

export function SidebarFooter({
  isCollapsed,
  user,
  onToggleSidebar,
  onOpenLogoutModal,
}: SidebarFooterProps) {
  return (
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
                onToggleSidebar();
              }}
              aria-label="Expand sidebar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-ink-muted)",
                cursor: "pointer",
                transition: "background 120ms ease-out, color 120ms ease-out, transform 150ms ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-base-subtle)";
                e.currentTarget.style.color = "var(--color-ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-ink-muted)";
              }}
            >
              <PanelLeftOpen size={16} strokeWidth={1.8} />
            </button>
          </SidebarTooltip>

          {/* Theme Switcher Button */}
          <SidebarTooltip content="Toggle Theme" enabled={isCollapsed}>
            <div>
              <ThemeToggle className="w-8 h-8 rounded-[6px]" />
            </div>
          </SidebarTooltip>

          {/* User Avatar Button */}
          <SidebarTooltip content={user.name} enabled={isCollapsed}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLogoutModal();
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
          {/* Theme Switcher Labeled */}
          <ThemeToggle showLabel={true} className="mb-0.5" />

          {/* Collapse Sidebar Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              color: "var(--color-ink-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "background 120ms ease-out, color 120ms ease-out, transform 150ms ease-out",
              marginBottom: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-ink)";
              e.currentTarget.style.background = "var(--color-base-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-ink-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <PanelLeftClose size={14} strokeWidth={1.8} />
            <span style={{ flex: 1, textAlign: "left" }}>Collapse sidebar</span>
            <kbd
              style={{
                fontFamily: "var(--font-sans)",
                fontVariantNumeric: "tabular-nums",
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
            onClick={onOpenLogoutModal}
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
              transition: "background 120ms ease-out, border-color 120ms ease-out, transform 150ms ease-out",
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
                  fontFamily: "var(--font-sans)",
                  fontVariantNumeric: "tabular-nums",
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
  );
}
