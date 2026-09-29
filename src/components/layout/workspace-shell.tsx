"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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

  const pathname = usePathname();
  const isCommandCenter = pathname.startsWith("/command-center");
  const isFlushMasthead =
    (pathname.startsWith("/clients/") && pathname !== "/clients") ||
    pathname.startsWith("/content");

  return (
    <div
      className={`transition-[padding-left] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isCollapsed ? "pl-[64px]" : "pl-[220px]"
      } ${isCommandCenter ? "h-[100dvh] flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}`}
    >
      <TopNav />
      <main
        className={`flex-1 bg-[var(--color-base)] ${
          isCommandCenter
            ? "p-0 flex flex-col overflow-hidden min-h-0"
            : isFlushMasthead
            ? "p-0 flex flex-col"
            : "px-5 py-5 lg:px-7 lg:py-6"
        }`}
      >
        {children}
      </main>
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
