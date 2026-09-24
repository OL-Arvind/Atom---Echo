"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { isUserLoggedIn } from "@/lib/auth/dummy-auth";

function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    if (!isUserLoggedIn()) {
      router.push("/login");
    }
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
      <main className="flex-1 p-6 md:p-8 bg-[var(--color-base)]">{children}</main>
    </div>
  );
}

import { HeaderProvider } from "./header-context";

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
