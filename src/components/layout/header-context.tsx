"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type StudioOriginSurface =
  | "client"
  | "client-meetings"
  | "command-center"
  | "calendar"
  | "content";

interface HeaderContextType {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
  customBreadcrumbs: BreadcrumbItem[] | null;
  setCustomBreadcrumbs: (crumbs: BreadcrumbItem[] | null) => void;
  activeNavSection: string | null;
  setActiveNavSection: (sectionHref: string | null) => void;
  lastOriginSurface: StudioOriginSurface | null;
  lastClientId: string | null;
}

const HeaderContext = createContext<HeaderContextType>({
  customTitle: null,
  setCustomTitle: () => {},
  customBreadcrumbs: null,
  setCustomBreadcrumbs: () => {},
  activeNavSection: null,
  setActiveNavSection: () => {},
  lastOriginSurface: null,
  lastClientId: null,
});

export function HeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const [activeNavSection, setActiveNavSection] = useState<string | null>(null);
  const [lastOriginSurface, setLastOriginSurface] = useState<StudioOriginSurface | null>(null);
  const [lastClientId, setLastClientId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/clients/")) {
      const parts = pathname.split("/");
      if (parts[2]) {
        setLastClientId(parts[2]);
      }
      setLastOriginSurface("client");
    } else if (pathname === "/clients") {
      setLastOriginSurface("client");
    } else if (pathname.startsWith("/command-center")) {
      setLastOriginSurface("command-center");
    } else if (pathname.startsWith("/calendar")) {
      setLastOriginSurface("calendar");
    } else if (pathname === "/content") {
      setLastOriginSurface("content");
    }
  }, [pathname]);

  return (
    <HeaderContext.Provider
      value={{
        customTitle,
        setCustomTitle,
        customBreadcrumbs,
        setCustomBreadcrumbs,
        activeNavSection,
        setActiveNavSection,
        lastOriginSurface,
        lastClientId,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}
