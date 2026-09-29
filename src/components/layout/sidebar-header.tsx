"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PanelLeftClose } from "lucide-react";
import { SidebarTooltip } from "@/components/ui/sidebar-tooltip";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div
      style={{
        padding: isCollapsed ? "0 12px" : "0 14px",
        borderBottom: "1px solid var(--color-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: isCollapsed ? "center" : "space-between",
        height: "52px",
        boxSizing: "border-box",
      }}
    >
      {isCollapsed ? (
        <SidebarTooltip content="Expand sidebar" hint="[" enabled={isCollapsed}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
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
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "background 150ms ease-out, transform 150ms ease-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-base-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Image
              src="/icon-symbol-dark.png"
              alt="Atom & Echo"
              width={22}
              height={22}
              priority
              className="theme-logo-light object-contain w-[22px] h-[22px] select-none transition-transform duration-150 group-hover:scale-95"
            />
            <Image
              src="/icon-symbol-white.png"
              alt="Atom & Echo"
              width={22}
              height={22}
              priority
              className="theme-logo-dark object-contain w-[22px] h-[22px] select-none transition-transform duration-150 group-hover:scale-95"
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
              src="/brand-wordmark-dark.svg"
              alt="Atom & Echo"
              width={76}
              height={28}
              priority
              unoptimized
              className="theme-logo-light object-contain h-[28px] w-auto select-none"
            />
            <Image
              src="/brand-wordmark-white.svg"
              alt="Atom & Echo"
              width={76}
              height={28}
              priority
              unoptimized
              className="theme-logo-dark object-contain h-[28px] w-auto select-none"
            />
          </Link>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
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
              border: "none",
              background: "transparent",
              color: "var(--color-ink-tertiary)",
              cursor: "pointer",
              transition: "background 120ms ease-out, color 120ms ease-out, transform 150ms ease-out",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-ink)";
              e.currentTarget.style.background = "var(--color-base-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-ink-tertiary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <PanelLeftClose size={14} strokeWidth={1.8} />
          </button>
        </>
      )}
    </div>
  );
}
