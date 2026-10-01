"use client";

import React, { useState } from "react";
import { UserCheck, MessageCircle, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { formatRelativeTimeIST } from "@/lib/date-utils";
import type { CommandCenterAlert } from "@/types/domain";

interface WaitingOnClientsListProps {
  waitingAlerts: CommandCenterAlert[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
  onOpenWhatsAppPing: (alert: CommandCenterAlert) => void;
  initiallyExpanded?: boolean;
}

export function WaitingOnClientsList({
  waitingAlerts,
  selectedAlertId,
  onSelectAlert,
  onOpenWhatsAppPing,
  initiallyExpanded = false,
}: WaitingOnClientsListProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  if (waitingAlerts.length === 0) {
    return null;
  }

  const overdueCount = waitingAlerts.filter((a) => {
    const createdMs = a.post_created_at ? new Date(a.post_created_at).getTime() : 0;
    return createdMs > 0 && Date.now() - createdMs > 48 * 3600 * 1000;
  }).length;

  return (
    <div className="border-t border-[var(--color-line)] bg-[var(--color-base-raised)] shrink-0">
      {/* Header Fold */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs hover:bg-[var(--color-surface-hover)] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <UserCheck className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
          <span className="font-sans font-medium text-[var(--color-ink-secondary)]">
            With Founders ({waitingAlerts.length})
          </span>
          {overdueCount > 0 && (
            <span className="text-[10.5px] font-sans font-medium text-amber-400 tabular-nums">
              · {overdueCount} waiting &gt;2 days
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-muted)]">
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expanded In-Flight Items */}
      {isExpanded && (
        <div className="divide-y divide-[var(--color-line-subtle)] border-t border-[var(--color-line-subtle)] bg-[var(--color-surface)]">
          {waitingAlerts.map((alert) => {
            const isSelected = selectedAlertId === alert.id;
            const ageLabel = formatRelativeTimeIST(alert.post_created_at);
            const isOverdue =
              alert.post_created_at &&
              Date.now() - new Date(alert.post_created_at).getTime() > 48 * 3600 * 1000;

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert.id)}
                className={`group p-3 sm:px-5 py-3 cursor-pointer transition-colors flex items-start gap-3 ${
                  isSelected
                    ? "bg-[var(--color-surface-active)] border-l-2 border-l-[var(--color-sage-border)]"
                    : "hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {/* Quiet Status Dot */}
                <span
                  className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    isOverdue
                      ? "bg-amber-400 ring-2 ring-amber-400/20"
                      : "bg-[var(--color-ink-ghost)]"
                  }`}
                />

                {/* Content Details */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--color-ink)] truncate font-display">
                      {alert.post_title || alert.title}
                    </span>
                    <span className="text-[10.5px] font-sans text-[var(--color-ink-muted)] shrink-0 tabular-nums">
                      {ageLabel}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-[var(--color-ink-secondary)] truncate">
                    {alert.founder_name} ({alert.client_name}) · Sent for review
                  </p>
                </div>

                {/* Quick 1-tap WhatsApp nudge trigger for overdue */}
                {isOverdue && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWhatsAppPing(alert);
                    }}
                    title="Send WhatsApp Nudge"
                    className="opacity-80 group-hover:opacity-100 p-1.5 rounded hover:bg-[var(--color-base)] text-emerald-400 shrink-0 transition-opacity"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                )}

                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 self-center transition-transform ${
                    isSelected ? "text-[var(--color-ink)] translate-x-0.5" : "text-[var(--color-ink-ghost)]"
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
