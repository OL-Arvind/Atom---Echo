"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { PageHeader } from "@/components/layout/page-header";
import { AlertInspectorPane } from "@/components/command-center/alert-inspector-pane";
import { generateDraftInvoiceAction } from "@/lib/actions/client";
import { approveContentAction, resolveContentFeedbackAction } from "@/lib/actions/content";
import { updateInvoiceStatusAction } from "@/lib/actions/billing";
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

function getScheduledPostFounder(post: CommandCenterScheduledPost): string {
  if (!post.engagements) return "Founder";
  const eng = Array.isArray(post.engagements) ? post.engagements[0] : post.engagements;
  if (!eng || typeof eng !== "object") return "Founder";
  const clients = (eng as Record<string, unknown>).clients;
  if (!clients) return "Founder";
  const client = Array.isArray(clients) ? clients[0] : clients;
  if (!client || typeof client !== "object") return "Founder";
  return ((client as Record<string, unknown>).founder_name as string) || "Founder";
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

  const isDayZero = initialData.activeClientsCount === 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== alertId);
      if (selectedAlertId === alertId) {
        setSelectedAlertId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
    showToast("Item marked as resolved.");
  };

  const copyReviewLink = (alert: CommandCenterAlert) => {
    const token = alert.review_token;
    if (!token) {
      showToast("No active review link available for this client yet.");
      return;
    }
    const shareUrl = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(alert.id);
    showToast(`Copied 1-tap review link for ${alert.founder_name || "Founder"}`);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const openWhatsAppPing = (alert: CommandCenterAlert) => {
    const token = alert.review_token;
    if (!token) {
      showToast("No active review link available for this client yet.");
      return;
    }
    const shareUrl = `${window.location.origin}/review/${token}`;
    const phone = alert.founder_phone ? alert.founder_phone.replace(/[^0-9]/g, "") : "";
    if (!phone) {
      showToast("No WhatsApp phone number configured for this founder.");
      return;
    }
    const message = encodeURIComponent(
      `Hi ${alert.founder_name || "there"}, here is your latest thought leadership post ready for 1-tap review: ${shareUrl}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    showToast(`Opened WhatsApp chat for ${alert.founder_name || "Founder"}`);
  };

  const handleQuickApprove = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await approveContentAction(alert.entity_id);
      if (res.success) {
        showToast(`Approved "${alert.post_title || "Post"}" and scheduled publication`);
        handleDismissAlert(alert.id);
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
        showToast("Client revision marked as resolved.");
        handleDismissAlert(alert.id);
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
    const targetId = clientId || initialData.clients[0]?.id;
    if (!targetId) return;

    startTransition(async () => {
      const res = await generateDraftInvoiceAction(targetId);
      if (res.success) {
        showToast(`Draft invoice generated with client software expenses`);
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const handleApproveInvoice = (alert: CommandCenterAlert) => {
    if (!alert.entity_id) return;
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(alert.entity_id, "approved");
      if (res.success) {
        showToast(`Invoice ${alert.invoice_number || ""} approved for sending.`);
        handleDismissAlert(alert.id);
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
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--color-base-overlay)] text-[var(--color-ink)] text-xs px-4 py-2.5 rounded-lg shadow-dialog border border-[var(--color-line-strong)]">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Command Center"
        description={
          isDayZero
            ? "Welcome to Atom & Echo. Onboard your first founder to capture their conviction and begin the editorial rhythm."
            : alerts.length === 0
            ? "Every client voice is compounding on schedule. No editorial bottlenecks or pending holds."
            : `${alerts.length} founder account${alerts.length === 1 ? "" : "s"} requiring editorial decisions or dispatch sign-off today.`
        }
      >
        <OnboardClientModal buttonText="Onboard Founder" />
      </PageHeader>

      {/* 2-Column Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Attention Queue & Horizon (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Attention Queue Container */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] shadow-xs overflow-hidden">
            {/* Header with Filter Pills */}
            <div className="border-b border-[var(--color-line)] p-3.5 bg-[var(--color-base-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-ink)] tracking-tight">Editorial Queue</span>
                  <span className="text-[11px] font-sans text-[var(--color-ink-tertiary)] font-normal tabular-nums">
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

              {/* Clean Filter Tabs */}
              <div className="flex items-center gap-1">
                {[
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
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as "all" | "review" | "billing" | "request")}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      filter === tab.id
                        ? "bg-[var(--color-base-overlay)] text-[var(--color-ink)] font-medium shadow-2xs border border-[var(--color-line)]"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1 opacity-60 text-[10.5px]">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Queue List Items */}
            {filteredAlerts.length > 0 ? (
              <div className="divide-y divide-[var(--color-line-subtle)]">
                {filteredAlerts.map((alert: CommandCenterAlert) => {
                  const isSelected = selectedAlert?.id === alert.id;
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
                    primaryLabel = `${alert.founder_name || "Client"} (${alert.client_name || "Account"})`;
                    secondaryLabel = `Revision on "${alert.post_title}": ${alert.comment}`;
                    badgeLabel = "Revision requested";
                  } else if (isReview) {
                    primaryLabel = alert.founder_name || alert.client_name || "Client";
                    secondaryLabel = alert.post_title || alert.title;
                    badgeLabel = "Pending review";
                  } else if (isInvoiceDraft) {
                    primaryLabel = `${alert.client_name || "Client"}${alert.founder_name ? ` (${alert.founder_name})` : ""}`;
                    secondaryLabel = `Draft Invoice ${alert.invoice_number || ""} · ₹${Number(alert.total_amount || 0).toLocaleString("en-IN")}`;
                    badgeLabel = "Needs sign-off";
                  } else if (isToolRenewal) {
                    primaryLabel = alert.tool_name || alert.title;
                    secondaryLabel = `Renews ${alert.next_renewal_date} · ${alert.currency || "INR"} ${Number(alert.cost_amount || 0).toLocaleString("en-IN")}`;
                    badgeLabel = "Renewal";
                  } else if (isBillingExpense) {
                    primaryLabel = "Unbilled Software";
                    secondaryLabel = alert.title;
                    badgeLabel = "Software cost";
                  } else if (alert.entity_type === "client_request") {
                    primaryLabel = alert.founder_name || alert.client_name || "Client Request";
                    secondaryLabel = alert.title;
                    badgeLabel = isCritical ? "Urgent hold" : "Client request";
                  }

                  const dotColor = isCritical
                    ? "bg-rose-500"
                    : isFeedback
                    ? "bg-amber-600"
                    : isReview
                    ? "bg-amber-500"
                    : isInvoiceDraft
                    ? "bg-emerald-500"
                    : isToolRenewal
                    ? "bg-violet-500"
                    : isBillingExpense
                    ? "bg-sky-500"
                    : "bg-[var(--color-ink-muted)]";

                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected
                          ? "bg-[var(--color-base-subtle)] border-l-2 border-l-[var(--color-accent)]"
                          : "hover:bg-[var(--color-base-subtle)]"
                      }`}
                    >
                      {/* Status Dot */}
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor}`} />

                      {/* Content Details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--color-ink)] truncate">
                            {primaryLabel}
                          </span>
                          <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0 font-medium">
                            {badgeLabel}
                          </span>
                        </div>

                        <p className="text-[12.5px] text-[var(--color-ink-secondary)] line-clamp-1">
                          {secondaryLabel}
                        </p>

                        <div className="text-[11px] text-[var(--color-ink-muted)] pt-0.5">
                          Waiting on {alert.waiting_on}
                        </div>
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
            ) : (
              <div className="p-8 text-center space-y-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                <p className="text-xs font-medium text-[var(--color-ink-secondary)]">Queue is clear</p>
                <p className="text-[11.5px] text-[var(--color-ink-muted)]">Every founder account in this category is progressing smoothly.</p>
              </div>
            )}
          </div>

          {/* Upcoming Posts Horizon */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink)] tracking-tight">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                <span>Upcoming Publishing Releases</span>
              </div>
              <Link
                href="/content"
                className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
              >
                Studio pipeline &rarr;
              </Link>
            </div>

            {initialData.scheduledPosts && initialData.scheduledPosts.length > 0 ? (
              <div className="space-y-1.5">
                {initialData.scheduledPosts.slice(0, 3).map((post: CommandCenterScheduledPost) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-base-subtle)] text-xs gap-3 transition-colors border border-transparent hover:border-[var(--color-line)]"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-[11px] text-[var(--color-ok-text)] font-medium tabular-nums">
                          {formatDisplayDateIST(post.scheduled_publish_date, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-[var(--color-ink-tertiary)] text-[11px] truncate">
                          &middot; {getScheduledPostFounder(post)}
                        </span>
                      </div>
                      <p className="text-[var(--color-ink)] font-medium truncate text-[12px]">{post.title}</p>
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">
                      {post.target_pillar || "Perspective"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-ink-muted)] py-3 text-center">
                No upcoming releases queued. Once a founder approves a draft, it locks into this schedule.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Dedicated Instant Action Inspector (7 Cols) */}
        <div className="lg:col-span-7">
          <AlertInspectorPane
            selectedAlert={selectedAlert}
            unbilledExpensesTotal={initialData.unbilledExpensesTotal}
            unbilledExpenses={initialData.unbilledExpenses}
            copiedToken={copiedToken}
            isPending={isPending}
            onDismissAlert={handleDismissAlert}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsAppPing={openWhatsAppPing}
            onQuickApprove={handleQuickApprove}
            onResolveFeedback={handleResolveFeedback}
            onOpenFeedbackWhatsAppPing={openFeedbackWhatsAppPing}
            onQuickDraftInvoice={handleQuickDraftInvoice}
            onApproveInvoice={handleApproveInvoice}
            onOpenInvoiceWhatsAppPing={openInvoiceWhatsAppPing}
          />
        </div>
      </div>
    </div>
  );
}
