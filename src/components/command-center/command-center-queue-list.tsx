"use client";

import React from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { parseFeedbackComment } from "@/lib/feedback-utils";
import type { CommandCenterAlert } from "@/types/domain";

interface CommandCenterQueueListProps {
  filteredAlerts: CommandCenterAlert[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
}

export function CommandCenterQueueList({
  filteredAlerts,
  selectedAlertId,
  onSelectAlert,
}: CommandCenterQueueListProps) {
  if (filteredAlerts.length === 0) {
    return (
      <div className="p-8 text-center space-y-1.5">
        <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] mx-auto" />
        <p className="text-xs font-medium text-[var(--color-ink)]">Desk is clear</p>
        <p className="text-[11.5px] text-[var(--color-ink-muted)]">
          All client reviews, edits, and tasks are up to date.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-line-subtle)]">
      {filteredAlerts.map((alert: CommandCenterAlert) => {
        const isSelected = selectedAlertId === alert.id;
        const isCritical = alert.urgency === "critical";
        const isFeedback = alert.entity_type === "content_feedback";
        const isReview = alert.entity_type === "content_item";
        const isBillingExpense = alert.entity_type === "billing";
        const isInvoiceDraft = alert.entity_type === "invoice_draft";
        const isToolRenewal = alert.entity_type === "tool_renewal";

        let primaryLabel = alert.client_name || alert.founder_name || alert.title;
        let secondaryLabel = alert.reason || alert.title;
        let badgeLabel = "Attention";

        if (isFeedback) {
          const { tags, note } = parseFeedbackComment(alert.comment);
          primaryLabel = alert.post_title || "LinkedIn Post";
          const tagSnippet = tags.length > 0 ? tags.join(" · ") : "";
          const detail = note || tagSnippet || "Edits requested";
          secondaryLabel = `${alert.founder_name || "Founder"} (${alert.client_name || "Account"}) · ${detail}`;
          badgeLabel = alert.waiting_on?.includes("Internal QA")
            ? "Team edits"
            : "Client edits";
        } else if (isReview) {
          primaryLabel = alert.post_title || alert.title;
          if (alert.post_status === "internal_review") {
            secondaryLabel = `${alert.founder_name || "Founder"} (${alert.client_name || "Account"}) · Ready for internal review`;
            badgeLabel = "Needs review";
          } else if (alert.post_status === "draft") {
            secondaryLabel = `${alert.founder_name || "Founder"} (${alert.client_name || "Account"}) · Draft overdue`;
            badgeLabel = "Draft overdue";
          } else {
            secondaryLabel = `${alert.founder_name || "Founder"} (${alert.client_name || "Account"}) · With founder for sign-off`;
            badgeLabel = "With founder";
          }
        } else if (isInvoiceDraft) {
          primaryLabel = `${alert.client_name || "Client"}${alert.founder_name ? ` (${alert.founder_name})` : ""}`;
          secondaryLabel = `Draft Invoice ${alert.invoice_number || ""} · ₹${Number(alert.total_amount || 0).toLocaleString("en-IN")}`;
          badgeLabel = "Ready to send";
        } else if (isToolRenewal) {
          primaryLabel = alert.tool_name || alert.title;
          secondaryLabel = `Renews ${alert.next_renewal_date} · ${alert.currency || "INR"} ${Number(alert.cost_amount || 0).toLocaleString("en-IN")}`;
          badgeLabel = "Renewal";
        } else if (isBillingExpense) {
          primaryLabel = "Unbilled Software";
          secondaryLabel = alert.title;
          badgeLabel = "Unbilled tool";
        } else if (alert.entity_type === "client_request") {
          primaryLabel = alert.founder_name || alert.client_name || "Client Request";
          secondaryLabel = alert.title;
          badgeLabel = isCritical ? "Urgent request" : "Client request";
        }

        const dotColor = isCritical
          ? "bg-rose-400 ring-2 ring-rose-400/20"
          : isFeedback
          ? "bg-amber-400 ring-2 ring-amber-400/20"
          : isReview
          ? "bg-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20"
          : "bg-[var(--color-ink-muted)]";

        const waitingOnDisplay =
          alert.waiting_on === "Internal QA" ? "Our team" : alert.waiting_on;

        return (
          <div
            key={alert.id}
            onClick={() => onSelectAlert(alert.id)}
            className={`p-4 sm:p-4.5 cursor-pointer transition-all flex items-start gap-3.5 ${
              isSelected
                ? "bg-[var(--color-surface-active)] border-l-2 border-l-[var(--color-sage-border)]"
                : "hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {/* Quiet Status Dot */}
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />

            {/* Content Details */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink)] truncate font-display">
                  {primaryLabel}
                </span>
                <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--color-ink-muted)] shrink-0 font-medium">
                  {badgeLabel}
                </span>
              </div>

              <p className="text-[12.5px] text-[var(--color-ink-secondary)] line-clamp-1 leading-snug">
                {secondaryLabel}
              </p>

              {waitingOnDisplay && (
                <div className="text-[11px] text-[var(--color-ink-muted)] pt-0.5 flex items-center gap-1.5">
                  <span>Waiting on</span>
                  <span className="text-[var(--color-ink-tertiary)]">{waitingOnDisplay}</span>
                </div>
              )}
            </div>

            <ChevronRight
              className={`h-4 w-4 shrink-0 self-center transition-transform ${
                isSelected ? "text-[var(--color-ink)] translate-x-0.5" : "text-[var(--color-ink-ghost)]"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
