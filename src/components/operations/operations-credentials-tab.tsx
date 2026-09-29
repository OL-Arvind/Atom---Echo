"use client";

import React from "react";
import { Shield } from "lucide-react";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

export interface OperationsCredentialsTabProps {
  logs: any[];
}

export function OperationsCredentialsTab({ logs }: OperationsCredentialsTabProps) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
        <div className="flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
            Vault Access &amp; Disclosure Trail
          </h2>
        </div>
        <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
          Immutable Audit Log
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
          No credential disclosures recorded yet. Every password reveal or clipboard copy is logged with operator identity and IP context.
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-line-subtle)]">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-sans tabular-nums text-[10.5px] text-[var(--color-ink-tertiary)] uppercase tracking-wider">
                    {log.action}
                  </span>
                  <span className="font-medium text-xs text-[var(--color-ink)]">
                    {log.credentials?.platform || "Platform"}
                  </span>
                  <span className="text-xs text-[var(--color-ink-tertiary)]">
                    ({log.credentials?.clients?.name || "Client"})
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-ink-secondary)] font-sans tabular-nums">
                  Operator: {log.users?.full_name || "Admin"} &middot; IP: {log.ip_address} &middot; UA: {log.user_agent}
                </p>
              </div>

              <span className="font-sans tabular-nums text-[11px] text-[var(--color-ink-tertiary)] shrink-0">
                {formatDisplayDateTimeIST(log.created_at, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
