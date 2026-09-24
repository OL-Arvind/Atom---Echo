"use client";

import React, { ReactNode } from "react";
import { HeaderActions } from "./header-actions";

interface PageHeaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  showTitleInPage?: boolean;
  portalActionsToTopNav?: boolean;
}

export function PageHeader({
  title,
  description,
  children,
  showTitleInPage = false,
  portalActionsToTopNav = true,
}: PageHeaderProps) {
  return (
    <>
      {/* Portal primary actions into sticky TopNav bar */}
      {children && portalActionsToTopNav && (
        <HeaderActions>{children}</HeaderActions>
      )}

      {/* In-page status / subtitle strip */}
      {(description || (showTitleInPage && title) || (children && !portalActionsToTopNav)) && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center -mt-1 pb-1">
          <div className="min-w-0">
            {showTitleInPage && title && (
              <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] mb-1">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xs sm:text-[13px] text-[var(--color-ink-secondary)] leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>

          {children && !portalActionsToTopNav && (
            <div className="flex items-center gap-2.5 shrink-0 ml-auto">
              {children}
            </div>
          )}
        </div>
      )}
    </>
  );
}
