"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { FeedbackInspector } from "./inspectors/feedback-inspector";
import { PostInspector } from "./inspectors/post-inspector";
import { BillingInspector } from "./inspectors/billing-inspector";
import { RequestInspector } from "./inspectors/request-inspector";
import { InvoiceInspector } from "./inspectors/invoice-inspector";
import { ToolRenewalInspector } from "./inspectors/tool-renewal-inspector";
import type {
  CommandCenterAlert,
  CommandCenterExpenseItem,
} from "@/types/domain";

interface AlertInspectorPaneProps {
  selectedAlert: CommandCenterAlert | null;
  unbilledExpensesTotal: number;
  unbilledExpenses: CommandCenterExpenseItem[];
  copiedToken: string | null;
  isPending: boolean;
  onCopyReviewLink: (alert: CommandCenterAlert) => void;
  onOpenWhatsAppPing: (alert: CommandCenterAlert) => void;
  onQuickApprove: (alert: CommandCenterAlert) => void;
  onResolveFeedback: (alert: CommandCenterAlert) => void;
  onOpenFeedbackWhatsAppPing: (alert: CommandCenterAlert) => void;
  onQuickDraftInvoice: (clientId?: string) => void;
  onApproveInvoice: (alert: CommandCenterAlert) => void;
  onOpenInvoiceWhatsAppPing: (alert: CommandCenterAlert) => void;
  onResolveClientRequest: (alert: CommandCenterAlert) => void;
  onAdvanceToolRenewal: (alert: CommandCenterAlert) => void;
}

export function AlertInspectorPane({
  selectedAlert,
  unbilledExpensesTotal,
  unbilledExpenses,
  copiedToken,
  isPending,
  onCopyReviewLink,
  onOpenWhatsAppPing,
  onQuickApprove,
  onResolveFeedback,
  onOpenFeedbackWhatsAppPing,
  onQuickDraftInvoice,
  onApproveInvoice,
  onOpenInvoiceWhatsAppPing,
  onResolveClientRequest,
  onAdvanceToolRenewal,
}: AlertInspectorPaneProps) {
  if (!selectedAlert) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-3">
        <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)] font-display">
            Editorial Desk is Clear
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 max-w-sm mx-auto leading-relaxed">
            No pending founder reviews, editorial revisions, or unbilled tooling right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {selectedAlert.entity_type === "content_feedback" && (
        <FeedbackInspector
          selectedAlert={selectedAlert}
          isPending={isPending}
          onOpenFeedbackWhatsAppPing={onOpenFeedbackWhatsAppPing}
          onResolveFeedback={onResolveFeedback}
        />
      )}

      {selectedAlert.entity_type === "content_item" && (
        <PostInspector
          selectedAlert={selectedAlert}
          copiedToken={copiedToken}
          isPending={isPending}
          onCopyReviewLink={onCopyReviewLink}
          onOpenWhatsAppPing={onOpenWhatsAppPing}
          onQuickApprove={onQuickApprove}
        />
      )}

      {selectedAlert.entity_type === "billing" && (
        <BillingInspector
          selectedAlert={selectedAlert}
          unbilledExpensesTotal={unbilledExpensesTotal}
          unbilledExpenses={unbilledExpenses}
          isPending={isPending}
          onQuickDraftInvoice={onQuickDraftInvoice}
        />
      )}

      {selectedAlert.entity_type === "client_request" && (
        <RequestInspector
          selectedAlert={selectedAlert}
          isPending={isPending}
          onResolveClientRequest={onResolveClientRequest}
        />
      )}

      {selectedAlert.entity_type === "invoice_draft" && (
        <InvoiceInspector
          selectedAlert={selectedAlert}
          isPending={isPending}
          onApproveInvoice={onApproveInvoice}
          onOpenInvoiceWhatsAppPing={onOpenInvoiceWhatsAppPing}
        />
      )}

      {selectedAlert.entity_type === "tool_renewal" && (
        <ToolRenewalInspector
          selectedAlert={selectedAlert}
          isPending={isPending}
          onAdvanceToolRenewal={onAdvanceToolRenewal}
        />
      )}

      {/* FALLBACK FOR ANY OTHER OPERATIONAL ALERT */}
      {![
        "content_feedback",
        "content_item",
        "billing",
        "client_request",
        "invoice_draft",
        "tool_renewal",
      ].includes(selectedAlert.entity_type) && (
        <>
          <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                  <span className="font-semibold text-[var(--color-ink)]">Operational Alert</span>
                  {selectedAlert.waiting_on && (
                    <>
                      <span className="text-[var(--color-line-strong)]">&middot;</span>
                      <span className="text-[var(--color-ink-muted)]">Waiting on: {selectedAlert.waiting_on}</span>
                    </>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-ink)] truncate leading-snug">
                  {selectedAlert.title}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-5 sm:px-8 sm:py-6 space-y-4 overflow-y-auto min-h-0">
            <div className="max-w-3xl border-l-2 border-[var(--color-line-strong)] pl-4 py-1.5">
              <p className="text-[13.5px] text-[var(--color-ink)] leading-relaxed select-text font-sans">
                {selectedAlert.reason || "Operational item requiring review."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
