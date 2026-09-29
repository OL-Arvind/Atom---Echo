import React, { ReactNode } from "react";

export interface MetricRibbonItem {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  tone?: "default" | "ok" | "warn" | "accent";
}

interface MetricRibbonProps {
  items: MetricRibbonItem[];
  className?: string;
  actionSlot?: ReactNode;
}

export function MetricRibbon({ items, className = "", actionSlot }: MetricRibbonProps) {
  return (
    <div
      className={`card-raised px-4 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {items.map((item, idx) => (
          <React.Fragment key={item.label || idx}>
            {idx > 0 && (
              <div className="h-3.5 w-px bg-[var(--color-line-strong)] hidden sm:block" />
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
                {item.label}:
              </span>
              <span
                className={`font-semibold tabular-nums text-[13px] ${
                  item.tone === "ok"
                    ? "text-[var(--color-ok-text)]"
                    : item.tone === "warn"
                    ? "text-[var(--color-warn-text)]"
                    : item.tone === "accent"
                    ? "text-[var(--color-accent-text)]"
                    : "text-[var(--color-ink)]"
                }`}
              >
                {item.value}
              </span>
              {item.subtext && (
                <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">
                  {item.subtext}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {actionSlot && <div className="shrink-0">{actionSlot}</div>}
    </div>
  );
}
