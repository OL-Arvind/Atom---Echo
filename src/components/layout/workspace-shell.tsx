"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { HeaderProvider } from "./header-context";
import { isUserLoggedIn, syncSupabaseSessionUser } from "@/lib/auth/dummy-auth";

function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    syncSupabaseSessionUser().then((user) => {
      if (!user) {
        router.push("/login");
      }
    });
    const handleAuth = () => {
      if (!isUserLoggedIn()) {
        router.push("/login");
      }
    };
    window.addEventListener("ae_auth_change", handleAuth);
    return () => window.removeEventListener("ae_auth_change", handleAuth);
  }, [router]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-[padding-left] duration-200 ease-in-out ${
        isCollapsed ? "pl-[64px]" : "pl-[220px]"
      }`}
    >
      <TopNav />
      <main className="flex-1 p-4 md:p-5 lg:p-6 bg-[var(--color-base)]">{children}</main>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <HeaderProvider>
        <div className="min-h-[100dvh] bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-accent-bg)] selection:text-[var(--color-accent-text)]">
          <Sidebar />
          <WorkspaceContent>{children}</WorkspaceContent>
        </div>
      </HeaderProvider>
    </SidebarProvider>
  );
}
