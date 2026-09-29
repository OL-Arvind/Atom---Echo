"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { useHeader } from "./header-context";
import { LogoutModal } from "@/components/auth/logout-modal";
import { getStoredUser, syncSupabaseSessionUser, AuthUser } from "@/lib/auth/dummy-auth";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarFooter } from "./sidebar-footer";

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
  const { activeNavSection } = useHeader();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<AuthUser>(EMPTY_USER);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
      className="transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
        overflow: "hidden",
        cursor: "default",
      }}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Navigation Links */}
      <SidebarNav
        isCollapsed={isCollapsed}
        pathname={pathname}
        activeNavSection={activeNavSection}
      />

      {/* Footer — Operator or Expand Bar */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        user={user}
        onToggleSidebar={toggleSidebar}
        onOpenLogoutModal={() => setShowLogoutModal(true)}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        user={user}
      />
    </aside>
  );
}
