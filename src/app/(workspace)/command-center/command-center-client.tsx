"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Copy,
  RefreshCw,
  MessageCircle,
  ExternalLink,
  Receipt,
  Check,
  X,
  ArrowUpRight,
  FileCheck,
} from "lucide-react";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { generateDraftInvoiceAction } from "@/lib/actions/client";
import { approveContentAction, resolveContentFeedbackAction } from "@/lib/actions/content";
import { updateInvoiceStatusAction } from "@/lib/actions/billing";
import { formatDisplayDateIST } from "@/lib/date-utils";

interface CommandCenterClientProps {
  initialData: {
    activeClientsCount: number;
    pendingReviewCount: number;
    unbilledExpensesTotal: number;
    mrrTotal?: number;
    brandingCount?: number;
    outreachCount?: number;
    alerts: any[];
    clients: any[];
    reviewPosts: any[];
    unresolvedFeedback?: any[];
    scheduledPosts?: any[];
    unbilledExpenses: any[];
  };
}

export function CommandCenterClient({ initialData }: CommandCenterClientProps) {
  const [alerts, setAlerts] = useState(initialData.alerts || []);
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

  const copyReviewLink = (alert: any) => {
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

  const openWhatsAppPing = (alert: any) => {
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

  const handleQuickApprove = (alert: any) => {
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

  const handleResolveFeedback = (alert: any) => {
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

  const openFeedbackWhatsAppPing = (alert: any) => {
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

  const handleApproveInvoice = (alert: any) => {
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

  const openInvoiceWhatsAppPing = (alert: any) => {
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


      {/* 2-Column Split Console (ClickUp / Stripe Light Studio Model) */}
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
                    onClick={() => setFilter(tab.id as any)}
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
                {filteredAlerts.map((alert: any) => {
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
                {initialData.scheduledPosts.slice(0, 3).map((post: any) => (
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
                          &middot; {post.engagements?.clients?.founder_name || "Founder"}
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
          {selectedAlert ? (
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] p-6 space-y-5 sticky top-6 shadow-xs">
              {/* CASE 0: CLIENT CONTENT REVISION FEEDBACK */}
              {selectedAlert.entity_type === "content_feedback" && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                          Founder Revision &amp; Voice Refinement
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
                        {selectedAlert.post_title}
                      </h2>
                      <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                        <span className="text-[var(--color-ink)] font-medium">
                          {selectedAlert.founder_name} ({selectedAlert.client_name})
                        </span>
                        <span>&middot;</span>
                        <span>{selectedAlert.target_pillar || "Thought Leadership"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Feedback Note - Clean Inset */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                      Founder Note &middot; {selectedAlert.founder_name}
                    </div>

                    <div className="border-l-2 border-amber-500/80 bg-[var(--color-base-subtle)] rounded-r-md px-4 py-3">
                      <p className="text-[13px] text-[var(--color-ink)] font-sans leading-relaxed select-text font-normal">
                        {selectedAlert.comment}
                      </p>
                    </div>
                  </div>

                  {/* Post Draft Content Preview */}
                  {selectedAlert.body_markdown && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
                        <span className="font-medium text-[var(--color-ink-secondary)]">Working Story Draft</span>
                        <span className="text-[11px] text-[var(--color-ink-muted)]">
                          Stage: {selectedAlert.post_status === "internal_review" ? "Internal Voice QA" : selectedAlert.post_status === "client_review" ? "Founder Review" : "Draft"}
                        </span>
                      </div>
                      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 max-h-52 overflow-y-auto">
                        <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-line select-text font-sans">
                          {selectedAlert.body_markdown}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      {selectedAlert.post_id && (
                        <Link
                          href={`/content/${selectedAlert.post_id}`}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-primary text-xs"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span>Refine in Story Editor</span>
                        </Link>
                      )}

                      <button
                        onClick={() => openFeedbackWhatsAppPing(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs"
                      >
                        <WhatsAppIcon size={14} className="text-[#25D366]" />
                        <span>Ack on WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleResolveFeedback(selectedAlert)}
                        disabled={isPending}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isPending ? "Updating..." : "Mark as Resolved"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)] text-xs">
                      {selectedAlert.review_token ? (
                        <Link
                          href={`/review/${selectedAlert.review_token}`}
                          target="_blank"
                          className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Preview Founder Desk ↗</span>
                        </Link>
                      ) : (
                        <span className="text-[var(--color-ink-muted)]">Portal active</span>
                      )}

                      <Link
                        href="/operations"
                        className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Editorial audit stream &rarr;</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 1: CONTENT ITEM REVIEW */}
              {selectedAlert.entity_type === "content_item" && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                          Awaiting Founder Sign-Off
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)] leading-snug">
                        {selectedAlert.post_title || selectedAlert.title}
                      </h2>
                      <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                        <span className="text-[var(--color-ink)] font-medium">{selectedAlert.founder_name}</span>
                        <span>&middot;</span>
                        <span>{selectedAlert.target_pillar || "Thought Leadership"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* LinkedIn Live Post Preview Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
                      <span className="font-medium text-[var(--color-ink-secondary)]">Founder Voice Preview</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">Simulated LinkedIn Format</span>
                    </div>

                    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4.5 space-y-3">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--color-line)]">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-base-subtle)] border border-[var(--color-line)] flex items-center justify-center text-xs text-[var(--color-accent)] font-semibold">
                          {(selectedAlert.founder_name || "F")[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--color-ink)]">{selectedAlert.founder_name}</div>
                          <div className="text-[11px] text-[var(--color-ink-tertiary)]">Founder Profile &middot; Thought Leadership</div>
                        </div>
                      </div>

                      <div className="text-[13px] text-[var(--color-ink)] leading-relaxed whitespace-pre-line select-text font-sans">
                        {selectedAlert.body_markdown || "No draft content written yet."}
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        onClick={() => copyReviewLink(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-primary text-xs"
                      >
                        {copiedToken === selectedAlert.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Founder Desk Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openWhatsAppPing(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs"
                      >
                        <WhatsAppIcon size={14} className="text-[#25D366]" />
                        <span>Ping Founder on WhatsApp</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)] text-xs">
                      {selectedAlert.review_token ? (
                        <Link
                          href={`/review/${selectedAlert.review_token}`}
                          target="_blank"
                          className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Preview Client View</span>
                        </Link>
                      ) : (
                        <span className="text-[var(--color-ink-muted)]">No review link generated</span>
                      )}

                      <button
                        onClick={() => handleQuickApprove(selectedAlert)}
                        disabled={isPending}
                        className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{isPending ? "Approving..." : "Approve Post"}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 2: UNBILLED TOOL EXPENSES */}
              {selectedAlert.entity_type === "billing" && (
                <>
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                        <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                          Dedicated Client Tooling
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                        {selectedAlert.title}
                      </h2>
                      <p className="text-xs text-[var(--color-ink-tertiary)]">
                        {selectedAlert.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tool List */}
                  <div className="space-y-2">
                    <div className="text-xs text-[var(--color-ink-tertiary)] flex justify-between">
                      <span className="font-medium text-[var(--color-ink-secondary)]">Transparent Tool Pass-Throughs</span>
                      <span className="text-[var(--color-ink)] font-semibold font-sans tabular-nums">
                        Total: ₹{initialData.unbilledExpensesTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] divide-y divide-[var(--color-line-subtle)]">
                      {initialData.unbilledExpenses && initialData.unbilledExpenses.length > 0 ? (
                        initialData.unbilledExpenses.map((exp: any, i: number) => (
                          <div key={exp.id || i} className="p-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-[var(--color-ink)] font-medium">{exp.description}</div>
                              <div className="text-[11px] text-[var(--color-ink-tertiary)]">
                                Client: {exp.engagements?.clients?.name || exp.client || "Client"}
                              </div>
                            </div>
                            <div className="font-sans text-[var(--color-ink)] font-semibold tabular-nums">
                              ₹{Number(exp.amount).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[var(--color-ink-tertiary)]">
                          No unbilled client tooling recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => handleQuickDraftInvoice()}
                      disabled={isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold py-2.5"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>{isPending ? "Drafting..." : "Draft Retainer & Tooling Invoice"}</span>
                    </button>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-tertiary)]">
                      <span>Transparent pass-through tooling (zero agency markup)</span>
                      <Link href="/billing" className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors">
                        Retainers &amp; Invoices &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 3: CLIENT REQUEST / EMERGENCY HOLD */}
              {selectedAlert.entity_type === "client_request" && (
                <>
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-sans tabular-nums tracking-wider text-[var(--color-ink-tertiary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="uppercase text-[10.5px] font-medium text-[var(--color-ink-secondary)]">
                          Founder Note &middot; Active Hold
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                        {selectedAlert.title}
                      </h2>
                      <p className="text-xs text-[var(--color-ink-tertiary)]">
                        Founder: {selectedAlert.founder_name || "Client"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4">
                    <p className="text-xs text-[var(--color-ink)] leading-relaxed select-text font-sans">
                      {selectedAlert.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    {selectedAlert.client_id && (
                      <Link
                        href={`/clients/${selectedAlert.client_id}`}
                        className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
                      >
                        <span>Open Founder Desk</span>
                      </Link>
                    )}

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 btn btn-secondary text-xs"
                    >
                      <span>Resolve &amp; Resume</span>
                    </button>
                  </div>
                </>
              )}

              {/* CASE 4: DRAFT INVOICE AWAITING SIGN-OFF */}
              {selectedAlert.entity_type === "invoice_draft" && (
                <>
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[11px] text-emerald-400 font-medium font-sans tabular-nums uppercase tracking-wider">
                          Retainer Invoice &middot; Ready for Dispatch
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                        {selectedAlert.title}
                      </h2>
                      <div className="text-xs text-[var(--color-ink-tertiary)] flex items-center gap-1.5 pt-0.5">
                        <span className="text-[var(--color-ink)] font-medium">{selectedAlert.client_name || "Client"}</span>
                        {selectedAlert.founder_name && (
                          <>
                            <span>&middot;</span>
                            <span>Founder: {selectedAlert.founder_name}</span>
                          </>
                        )}
                        {selectedAlert.due_date && (
                          <>
                            <span>&middot;</span>
                            <span>Due: {formatDisplayDateIST(selectedAlert.due_date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Invoice Summary Banner */}
                  <div className="flex items-baseline justify-between p-4 rounded-lg bg-[var(--color-base-subtle)] border border-[var(--color-line)]">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-ink-muted)] block">
                        Total Invoice Amount
                      </span>
                      <div className="text-2xl font-bold font-sans text-[var(--color-ink)] tabular-nums">
                        ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[var(--color-ink-muted)] block">Status</span>
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        Draft &middot; Founder Sign-Off
                      </span>
                    </div>
                  </div>

                  {/* Line Items Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--color-ink-tertiary)]">
                      <span className="font-medium text-[var(--color-ink-secondary)]">Retainer Scope &amp; Tool Infrastructure</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">
                        {selectedAlert.line_items?.length || 0} line item{selectedAlert.line_items?.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] divide-y divide-[var(--color-line-subtle)]">
                      {selectedAlert.line_items && selectedAlert.line_items.length > 0 ? (
                        selectedAlert.line_items.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-3">
                              <p className="font-medium text-[var(--color-ink)] truncate">{item.description}</p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] text-[var(--color-ink-muted)]">Qty: {item.quantity}</p>
                              )}
                            </div>
                            <div className="font-sans font-semibold text-[var(--color-ink)] tabular-nums shrink-0">
                             ₹{Number(item.total_price || item.unit_price || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-[var(--color-ink-tertiary)]">
                          {selectedAlert.reason || "Monthly Retainer draft pending dispatch."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        onClick={() => handleApproveInvoice(selectedAlert)}
                        disabled={isPending}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-accent text-xs font-semibold py-2.5"
                      >
                        <FileCheck className="h-3.5 w-3.5 text-[var(--color-base)]" />
                        <span>{isPending ? "Approving..." : "Approve & Ready for Client"}</span>
                      </button>

                      <Link
                        href={`/billing/invoices/${selectedAlert.entity_id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-xs py-2.5"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                        <span>View Printable Invoice</span>
                      </Link>

                      <button
                        onClick={() => openInvoiceWhatsAppPing(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 btn btn-secondary text-emerald-400 border-[var(--color-line)] text-xs py-2.5"
                      >
                        <WhatsAppIcon size={14} className="text-[#25D366]" />
                        <span>Send WhatsApp Summary</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-tertiary)]">
                      <span>Confirms retainer &amp; software totals for client dispatch</span>
                      <Link href="/billing" className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-medium transition-colors">
                        Retainers &amp; Billing &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 5: TOOL SUBSCRIPTION RENEWAL */}
              {selectedAlert.entity_type === "tool_renewal" && (
                <>
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-[11px] text-violet-400 font-medium font-sans tabular-nums uppercase tracking-wider">
                          Agency Tooling Renewal
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                        {selectedAlert.tool_name || selectedAlert.title}
                      </h2>
                      <p className="text-xs text-[var(--color-ink-tertiary)]">
                        Renews on {selectedAlert.next_renewal_date}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-tertiary)]">Subscription Cost:</span>
                      <span className="font-sans tabular-nums font-semibold text-[var(--color-ink)]">
                        {selectedAlert.currency || "INR"} {Number(selectedAlert.cost_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-tertiary)]">Allocation:</span>
                      <span className="font-medium text-[var(--color-ink)]">
                        {selectedAlert.default_pass_through ? "Client Pass-through" : "Agency Overhead"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-secondary)] pt-1 border-t border-[var(--color-line)]">
                      {selectedAlert.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <Link
                      href="/billing"
                      className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
                    >
                      <span>Tool Infrastructure Catalog</span>
                    </Link>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 btn btn-secondary text-xs"
                    >
                      <span>Acknowledge Renewal</span>
                    </button>
                  </div>
                </>
              )}

              {/* FALLBACK FOR ANY OTHER OPERATIONAL ALERT */}
              {![
                "content_item",
                "billing",
                "client_request",
                "invoice_draft",
                "tool_renewal",
              ].includes(selectedAlert.entity_type) && (
                <>
                  <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                        <span className="text-[11px] text-[var(--color-ink-secondary)] font-medium font-sans tabular-nums uppercase tracking-wider">
                          Operational Alert
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[var(--color-ink)]">
                        {selectedAlert.title}
                      </h2>
                      {selectedAlert.waiting_on && (
                        <p className="text-xs text-[var(--color-ink-tertiary)]">
                          Waiting on: {selectedAlert.waiting_on}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4">
                    <p className="text-xs text-[var(--color-ink)] leading-relaxed select-text font-sans">
                      {selectedAlert.reason || "Operational item requiring review."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 btn btn-primary text-xs"
                    >
                      <span>Mark as Resolved</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-base-overlay)] p-12 text-center space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  Every founder account is on track
                </h3>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 max-w-sm mx-auto leading-relaxed">
                  No pending founder reviews, editorial revisions, or unbilled tooling right now.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
