"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getExpenseClientId } from "./command-center-utils";
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
import type { CommandCenterAlert, CommandCenterExpenseItem } from "@/types/domain";

interface UseCommandCenterActionsProps {
  alerts: CommandCenterAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<CommandCenterAlert[]>>;
  selectedAlertId: string | null;
  setSelectedAlertId: React.Dispatch<React.SetStateAction<string | null>>;
  showToast: (msg: string) => void;
  unbilledExpenses: CommandCenterExpenseItem[];
  defaultClientId?: string;
}

export function useCommandCenterActions({
  alerts,
  setAlerts,
  selectedAlertId,
  setSelectedAlertId,
  showToast,
  unbilledExpenses,
  defaultClientId,
}: UseCommandCenterActionsProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        (unbilledExpenses || [])
          .map((exp) => getExpenseClientId(exp))
          .filter(Boolean) as string[]
      )
    );
    const targetClientIds = clientId
      ? [clientId]
      : expenseClientIds.length > 0
      ? expenseClientIds
      : defaultClientId
      ? [defaultClientId]
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

  return {
    copiedToken,
    isPending,
    copyReviewLink,
    openWhatsAppPing,
    handleQuickApprove,
    handleResolveFeedback,
    openFeedbackWhatsAppPing,
    handleQuickDraftInvoice,
    handleApproveInvoice,
    handleResolveClientRequest,
    handleAdvanceToolRenewal,
    openInvoiceWhatsAppPing,
  };
}
