"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderContextType {
  customTitle: string | null;
  setCustomTitle: (title: string | null) => void;
  customBreadcrumbs: BreadcrumbItem[] | null;
  setCustomBreadcrumbs: (crumbs: BreadcrumbItem[] | null) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  customTitle: null,
  setCustomTitle: () => {},
  customBreadcrumbs: null,
  setCustomBreadcrumbs: () => {},
});

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);

  return (
    <HeaderContext.Provider
      value={{
        customTitle,
        setCustomTitle,
        customBreadcrumbs,
        setCustomBreadcrumbs,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}
