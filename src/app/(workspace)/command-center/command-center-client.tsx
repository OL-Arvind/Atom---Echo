"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { HeaderActions } from "@/components/layout/header-actions";
import { AlertInspectorPane } from "@/components/command-center/alert-inspector-pane";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { CommandCenterQueueList } from "@/components/command-center/command-center-queue-list";
import { CommandCenterUpcomingHorizon } from "@/components/command-center/command-center-upcoming-horizon";
import { getExpenseClientId } from "@/components/command-center/command-center-utils";
import {
  generateDraftInvoiceAction,
  updateClientRequestStatusAction,
} from "@/lib/actions/client";
import {
  approveContentAction,
  resolveContentFeedbackAction,
  sendForClientReviewAction,
} from "@/lib/actions/content";
import {
  advanceToolSubscriptionRenewalAction,
  updateInvoiceStatusAction,
} from "@/lib/actions/billing";
import { formatDisplayDateIST } from "@/lib/date-utils";
import type {
  Client,
  CommandCenterAlert,
  CommandCenterExpenseItem,
  CommandCenterReviewPost,
  CommandCenterScheduledPost,
} from "@/types/domain";

interface CommandCenterClientProps {
  initialData: {
    activeClientsCount: number;
    pendingReviewCount: number;
    unbilledExpensesTotal: number;
    mrrTotal?: number;
    brandingCount?: number;
    outreachCount?: number;
    alerts: CommandCenterAlert[];
    clients: Array<{ id: string; name: string } & Partial<Client>>;
    reviewPosts: CommandCenterReviewPost[];
    unresolvedFeedback?: unknown[];
    scheduledPosts?: CommandCenterScheduledPost[];
    unbilledExpenses: CommandCenterExpenseItem[];
  };
}

export function CommandCenterClient({ initialData }: CommandCenterClientProps) {
  const [alerts, setAlerts] = useState<CommandCenterAlert[]>(initialData.alerts || []);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    initialData.alerts && initialData.alerts.length > 0 ? initialData.alerts[0].id : null
  );
  const [filter, setFilter] = useState<"all" | "review" | "billing" | "request">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const removeAlertFromQueue = (alertId: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== alertId);
      if (selectedAlertId === alertId) {
        setSelectedAlertId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const copyReviewLink = (alert: CommandCenterAlert) => {
    const token = alert.review_token;
    if (token && alert.post_status !== "internal_review") {
      const shareUrl = `${window.location.origin}/review/${token}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedToken(alert.id);
      showToast(`Copied 1-tap review link for ${alert.founder_name || "Founder"}`);
      setTimeout(() => setCopiedToken(null), 2500);
      return;
    }

    const targetId = alert.post_id || alert.entity_id || alert.client_id;
    if (!targetId) {
      showToast("Unable to generate review link for this item.");
      return;
    }

    startTransition(async () => {
      const res = await sendForClientReviewAction(targetId, window.location.origin);
      if (res.success && res.reviewUrl) {
        navigator.clipboard.writeText(res.reviewUrl);
        setCopiedToken(alert.id);
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id
              ? {
                  ...a,
                  post_status: "client_review",
                  review_token: res.token,
                  waiting_on: `${alert.founder_name || "Founder"} (Founder Sign-Off)`,
                }
              : a
          )
        );
        showToast(
          alert.post_status === "internal_review"
            ? `QA approved! Dispatched to ${alert.founder_name || "Founder"} & copied review link`
            : `Copied 1-tap review link for ${alert.founder_name || "Founder"}`
        );
        setTimeout(() => setCopiedToken(null), 2500);
        router.refresh();
      } else {
        showToast(`Error: ${res.error || "Could not generate review link"}`);
      }
    });
  };

  const openWhatsAppPing = (alert: CommandCenterAlert) => {
    const phone = alert.founder_phone ? alert.founder_phone.replace(/[^0-9]/g, "") : "";
    const openWaWithUrl = (shareUrl: string) => {
      const message = encodeURIComponent(
        `Hi ${alert.founder_name || "there"}, here is your latest thought leadership post ready for 1-tap review: ${shareUrl}`
      );
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
      } else {
        window.open(`https://wa.me/?text=${message}`, "_blank");
      }
      showToast(`Opened WhatsApp chat for ${alert.founder_name || "Founder"}`);
    };

    if (alert.review_token && alert.post_status !== "internal_review") {
      openWaWithUrl(`${window.location.origin}/review/${alert.review_token}`);
      return;
    }

    const targetId = alert.post_id || alert.entity_id || alert.client_id;
    if (!targetId) {
      showToast("No active review link available for this client yet.");
      return;
    }

    startTransition(async () => {
      const res = await sendForClientReviewAction(targetId, window.location.origin);
      if (res.success && res.reviewUrl) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id
              ? {
                  ...a,
                  post_status: "client_review",
                  review_token: res.token,
                  waiting_on: `${alert.founder_name || "Founder"} (Founder Sign-Off)`,
                }
              : a
          )
        );
        openWaWithUrl(res.reviewUrl);
        router.refresh();
      } else {
        showToast(`Error: ${res.error || "Could not generate review link"}`);
      }
    });
  };

  const handleQuickApprove = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await approveContentAction(alert.entity_id);
      if (res.success) {
        removeAlertFromQueue(alert.id);
        showToast(`Approved "${alert.post_title || "Post"}" and scheduled publication`);
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const handleResolveFeedback = (alert: CommandCenterAlert) => {
    const feedbackId = alert.feedback_id || alert.entity_id;
    if (!feedbackId) return;
    startTransition(async () => {
      const res = await resolveContentFeedbackAction(feedbackId);
      if (res.success) {
        removeAlertFromQueue(alert.id);
        showToast("Revision note marked as resolved.");
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const openFeedbackWhatsAppPing = (alert: CommandCenterAlert) => {
    const phone = alert.founder_phone ? alert.founder_phone.replace(/[^0-9]/g, "") : "";
    const founderName = alert.founder_name || "there";
    const postTitle = alert.post_title || "your post";
    const message = encodeURIComponent(
      `Hi ${founderName}, we received your revision request on "${postTitle}". We're updating the draft now and will share the new version shortly!`
    );
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
    showToast(`Opened WhatsApp chat for ${founderName}`);
  };

  const handleQuickDraftInvoice = (clientId?: string) => {
    const expenseClientIds = Array.from(
      new Set(
        (initialData.unbilledExpenses || [])
          .map((exp) => getExpenseClientId(exp))
          .filter(Boolean) as string[]
      )
    );
    const targetClientIds = clientId
      ? [clientId]
      : expenseClientIds.length > 0
      ? expenseClientIds
      : initialData.clients[0]?.id
      ? [initialData.clients[0].id]
      : [];

    if (targetClientIds.length === 0) return;

    startTransition(async () => {
      let draftedCount = 0;
      let lastError: string | undefined;
      for (const cid of targetClientIds) {
        const res = await generateDraftInvoiceAction(cid);
        if (res.success) {
          draftedCount++;
        } else {
          lastError = res.error;
        }
      }

      if (draftedCount > 0) {
        removeAlertFromQueue("alert-tool-leakage");
        showToast(
          draftedCount === 1
            ? "Draft invoice generated with pass-through software expenses."
            : `${draftedCount} draft invoices generated with pass-through software expenses.`
        );
        router.refresh();
      } else {
        showToast(`Error: ${lastError || "Could not generate draft invoice."}`);
      }
    });
  };

  const handleApproveInvoice = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(alert.entity_id, "approved");
      if (res.success) {
        removeAlertFromQueue(alert.id);
        showToast(`Invoice ${alert.invoice_number || ""} approved for sending.`);
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const handleResolveClientRequest = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await updateClientRequestStatusAction(alert.entity_id, "resolved");
      if (res.success) {
        removeAlertFromQueue(alert.id);
        showToast("Client request resolved and pipeline resumed.");
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const handleAdvanceToolRenewal = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await advanceToolSubscriptionRenewalAction(alert.entity_id);
      if (res.success) {
        removeAlertFromQueue(alert.id);
        showToast(
          `Confirmed ${res.toolName || "tool"} renewal · Next cycle: ${res.nextRenewalDate}`
        );
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const openInvoiceWhatsAppPing = (alert: CommandCenterAlert) => {
    const phone = alert.founder_phone ? alert.founder_phone.replace(/[^0-9]/g, "") : "";
    const clientName = alert.client_name || "your account";
    const invoiceNum = alert.invoice_number || "Invoice";
    const amount = alert.total_amount ? `₹${Number(alert.total_amount).toLocaleString("en-IN")}` : "";
    const dueDate = alert.due_date ? formatDisplayDateIST(alert.due_date) : "";

    const message = encodeURIComponent(
      `Hi ${alert.founder_name || "there"},\n\n` +
      `Here is the invoice summary for ${clientName}:\n` +
      `📄 Invoice: ${invoiceNum}\n` +
      `💰 Amount: ${amount}\n` +
      (dueDate ? `📅 Due Date: ${dueDate}\n\n` : `\n`) +
      `Please let us know once the transfer is initiated. Thank you!`
    );
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
    showToast(`Opened WhatsApp chat for ${alert.founder_name || "Founder"}`);
  };

  const filteredAlerts = useMemo(() => {
    if (filter === "review") {
      return alerts.filter(
        (a) => a.entity_type === "content_item" || a.entity_type === "content_feedback"
      );
    }
    if (filter === "billing") {
      return alerts.filter(
        (a) =>
          a.entity_type === "billing" ||
          a.entity_type === "invoice_draft" ||
          a.entity_type === "tool_renewal"
      );
    }
    if (filter === "request") return alerts.filter((a) => a.entity_type === "client_request");
    return alerts;
  }, [alerts, filter]);

  const selectedAlert = useMemo(() => {
    return alerts.find((a) => a.id === selectedAlertId) || alerts[0] || null;
  }, [alerts, selectedAlertId]);

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Portal Target into TopNav */}
      <HeaderActions>
        <OnboardClientModal buttonText="Onboard Founder" />
      </HeaderActions>

      {/* Full-bleed Native Workstation Console */}
      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 w-full bg-[var(--color-surface)] overflow-hidden">
        {/* LEFT PANE: Attention Queue & Integrated Horizon (Calibrated 410px Scan Measure) */}
        <div className="w-full lg:w-[410px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--color-line)] bg-[var(--color-base-raised)] h-full min-h-0">
          {/* Header with Filter Tabs */}
          <div className="border-b border-[var(--color-line)] p-4 sm:p-5 bg-[var(--color-base-subtle)]/40 shrink-0">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-ink)] tracking-tight font-display">Editorial Queue</span>
                <span className="text-xs font-sans text-[var(--color-ink-tertiary)] tabular-nums">
                  ({alerts.length})
                </span>
              </div>
              <Link
                href="/operations"
                className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
              >
                Audit trail &rarr;
              </Link>
            </div>

            {/* Cohesive Segmented Filter Track */}
            <SegmentedFilter
              options={[
                { id: "all", label: "All", count: alerts.length },
                {
                  id: "review",
                  label: "Reviews",
                  count: alerts.filter(
                    (a) => a.entity_type === "content_item" || a.entity_type === "content_feedback"
                  ).length,
                },
                {
                  id: "request",
                  label: "Notes",
                  count: alerts.filter((a) => a.entity_type === "client_request").length,
                },
                {
                  id: "billing",
                  label: "Retainers",
                  count: alerts.filter(
                    (a) =>
                      a.entity_type === "billing" ||
                      a.entity_type === "invoice_draft" ||
                      a.entity_type === "tool_renewal"
                  ).length,
                },
              ]}
              value={filter}
              onChange={(val) => setFilter(val as "all" | "review" | "billing" | "request")}
            />
          </div>

          {/* Queue List Items */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <CommandCenterQueueList
              filteredAlerts={filteredAlerts}
              selectedAlertId={selectedAlert?.id ?? null}
              onSelectAlert={setSelectedAlertId}
            />
          </div>

          {/* Integrated Upcoming Releases Horizon */}
          <CommandCenterUpcomingHorizon scheduledPosts={initialData.scheduledPosts} />
        </div>

        {/* RIGHT PANE: Dedicated Instant Action Inspector (Fluid Canvas) */}
        <div className="flex-1 min-w-0 flex flex-col bg-[var(--color-base)]">
          <AlertInspectorPane
            selectedAlert={selectedAlert}
            unbilledExpensesTotal={initialData.unbilledExpensesTotal}
            unbilledExpenses={initialData.unbilledExpenses}
            copiedToken={copiedToken}
            isPending={isPending}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsAppPing={openWhatsAppPing}
            onQuickApprove={handleQuickApprove}
            onResolveFeedback={handleResolveFeedback}
            onOpenFeedbackWhatsAppPing={openFeedbackWhatsAppPing}
            onQuickDraftInvoice={handleQuickDraftInvoice}
            onApproveInvoice={handleApproveInvoice}
            onOpenInvoiceWhatsAppPing={openInvoiceWhatsAppPing}
            onResolveClientRequest={handleResolveClientRequest}
            onAdvanceToolRenewal={handleAdvanceToolRenewal}
          />
        </div>
      </div>
    </div>
  );
}
