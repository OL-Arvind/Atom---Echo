import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`card p-12 text-center space-y-3.5 ${className}`}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-base-subtle)] text-[var(--color-ink-muted)] border border-[var(--color-line)]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-normal text-[var(--color-ink)]">
          {title}
        </h3>
        <p className="text-xs text-[var(--color-ink-secondary)] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
