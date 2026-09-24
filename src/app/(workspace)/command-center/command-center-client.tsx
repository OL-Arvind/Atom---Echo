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
import { approveContentAction } from "@/lib/actions/content";
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
    if (filter === "review") return alerts.filter((a) => a.entity_type === "content_item");
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-zinc-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Command Center"
        description={
          isDayZero
            ? "Welcome to Atom & Echo. Add your first client to start tracking content and billing."
            : alerts.length === 0
            ? "Everything is on schedule. No pending reviews or holds right now."
            : `${alerts.length} item${alerts.length === 1 ? "" : "s"} need your attention today.`
        }
      >
        <OnboardClientModal buttonText="Add Client" />
      </PageHeader>


      {/* 2-Column Split Console (ClickUp / Stripe Light Studio Model) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Attention Queue & Horizon (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Attention Queue Container */}
          <div className="rounded-xl border border-zinc-200/90 bg-white shadow-xs overflow-hidden">
            {/* Header with Filter Pills */}
            <div className="border-b border-zinc-150 p-3.5 bg-zinc-50/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 tracking-tight">Attention Required</span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-200/80 text-zinc-700 font-medium tabular-nums">
                    {alerts.length}
                  </span>
                </div>
                <Link
                  href="/operations"
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Activity log &rarr;
                </Link>
              </div>

              {/* Clean Filter Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: "all", label: "All", count: alerts.length },
                  {
                    id: "review",
                    label: "Reviews",
                    count: alerts.filter((a) => a.entity_type === "content_item").length,
                  },
                  {
                    id: "request",
                    label: "Requests",
                    count: alerts.filter((a) => a.entity_type === "client_request").length,
                  },
                  {
                    id: "billing",
                    label: "Billing",
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
                        ? "bg-white text-zinc-900 font-medium shadow-2xs border border-zinc-200"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60"
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
              <div className="divide-y divide-zinc-100">
                {filteredAlerts.map((alert: any) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  const isCritical = alert.urgency === "critical";
                  const isReview = alert.entity_type === "content_item";
                  const isBillingExpense = alert.entity_type === "billing";
                  const isInvoiceDraft = alert.entity_type === "invoice_draft";
                  const isToolRenewal = alert.entity_type === "tool_renewal";

                  let primaryLabel = alert.client_name || alert.founder_name || alert.title;
                  let secondaryLabel = alert.reason || alert.title;
                  let badgeLabel = "Attention";

                  if (isReview) {
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
                    : isReview
                    ? "bg-amber-500"
                    : isInvoiceDraft
                    ? "bg-emerald-500"
                    : isToolRenewal
                    ? "bg-violet-500"
                    : isBillingExpense
                    ? "bg-sky-500"
                    : "bg-zinc-400";

                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected
                          ? "bg-zinc-50 border-l-2 border-l-zinc-900"
                          : "hover:bg-zinc-50/70"
                      }`}
                    >
                      {/* Status Dot */}
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotColor}`} />

                      {/* Content Details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-900 truncate">
                            {primaryLabel}
                          </span>
                          <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
                            {badgeLabel}
                          </span>
                        </div>

                        <p className="text-[12.5px] text-zinc-600 line-clamp-1">
                          {secondaryLabel}
                        </p>

                        <div className="text-[11px] text-zinc-400 pt-0.5">
                          Waiting on {alert.waiting_on}
                        </div>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 shrink-0 self-center transition-transform ${
                          isSelected ? "text-zinc-900 translate-x-0.5" : "text-zinc-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center space-y-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-zinc-700">Queue is clear</p>
                <p className="text-[11.5px] text-zinc-400">All deliverables in this category are up to date.</p>
              </div>
            )}
          </div>

          {/* Upcoming Posts Horizon */}
          <div className="rounded-xl border border-zinc-200/90 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-150">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 tracking-tight">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span>Upcoming Posts</span>
              </div>
              <Link
                href="/content"
                className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                View all &rarr;
              </Link>
            </div>

            {initialData.scheduledPosts && initialData.scheduledPosts.length > 0 ? (
              <div className="space-y-1.5">
                {initialData.scheduledPosts.slice(0, 3).map((post: any) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 text-xs gap-3 transition-colors border border-transparent hover:border-zinc-200/60"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium tabular-nums">
                          {formatDisplayDateIST(post.scheduled_publish_date, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-zinc-500 text-[11px] truncate">
                          &middot; {post.engagements?.clients?.founder_name || "Founder"}
                        </span>
                      </div>
                      <p className="text-zinc-800 font-medium truncate text-[12px]">{post.title}</p>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      {post.target_pillar || "Post"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-3 text-center">
                No scheduled posts right now. Approved drafts will appear here automatically.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Dedicated Instant Action Inspector (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="rounded-xl border border-zinc-200/90 bg-white p-6 space-y-5 sticky top-6 shadow-xs">
              {/* CASE 1: CONTENT ITEM REVIEW */}
              {selectedAlert.entity_type === "content_item" && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Waiting for Client Review
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900 leading-snug">
                        {selectedAlert.post_title || selectedAlert.title}
                      </h2>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 pt-0.5">
                        <span className="text-zinc-800 font-medium">{selectedAlert.founder_name}</span>
                        <span>&middot;</span>
                        <span>{selectedAlert.target_pillar || "Thought Leadership"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* LinkedIn Live Post Preview Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">Draft Preview</span>
                      <span className="text-[11px] text-zinc-400">LinkedIn Preview</span>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4.5 space-y-3">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-zinc-200/70">
                        <div className="h-8 w-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-xs text-zinc-700 font-semibold">
                          {(selectedAlert.founder_name || "F")[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-900">{selectedAlert.founder_name}</div>
                          <div className="text-[11px] text-zinc-500">Founder Profile &middot; Thought Leadership</div>
                        </div>
                      </div>

                      <div className="text-[13px] text-zinc-800 leading-relaxed whitespace-pre-line select-text font-sans">
                        {selectedAlert.body_markdown || "No draft content written yet."}
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        onClick={() => copyReviewLink(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                      >
                        {copiedToken === selectedAlert.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Review Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openWhatsAppPing(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 text-xs font-medium px-4 py-2 rounded-md transition-colors shadow-2xs"
                      >
                        <WhatsAppIcon size={14} className="text-[#25D366]" />
                        <span>Message on WhatsApp</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-150 text-xs">
                      {selectedAlert.review_token ? (
                        <Link
                          href={`/review/${selectedAlert.review_token}`}
                          target="_blank"
                          className="text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Preview Client View</span>
                        </Link>
                      ) : (
                        <span className="text-zinc-400">No review link generated</span>
                      )}

                      <button
                        onClick={() => handleQuickApprove(selectedAlert)}
                        disabled={isPending}
                        className="text-zinc-600 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
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
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                        <span className="text-xs text-sky-700 font-medium bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                          Software Expenses to Bill
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        {selectedAlert.title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {selectedAlert.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Tool List */}
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-500 flex justify-between">
                      <span className="font-medium text-zinc-700">Unbilled Software Expenses</span>
                      <span className="text-zinc-900 font-semibold font-mono">
                        Total: ₹{initialData.unbilledExpensesTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 divide-y divide-zinc-200/70">
                      {initialData.unbilledExpenses && initialData.unbilledExpenses.length > 0 ? (
                        initialData.unbilledExpenses.map((exp: any, i: number) => (
                          <div key={exp.id || i} className="p-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-zinc-900 font-medium">{exp.description}</div>
                              <div className="text-[11px] text-zinc-500">
                                Client: {exp.engagements?.clients?.name || exp.client || "Client"}
                              </div>
                            </div>
                            <div className="font-mono text-zinc-900 font-semibold tabular-nums">
                              ₹{Number(exp.amount).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-zinc-500">
                          No unbilled software expenses recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => handleQuickDraftInvoice()}
                      disabled={isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      <span>{isPending ? "Generating..." : "Create Invoice (Include Software Expenses)"}</span>
                    </button>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-150 text-xs text-zinc-500">
                      <span>Pass software costs directly to client</span>
                      <Link href="/billing" className="text-zinc-700 hover:text-zinc-900 font-medium transition-colors">
                        View Invoices & Billing &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 3: CLIENT REQUEST / EMERGENCY HOLD */}
              {selectedAlert.entity_type === "client_request" && (
                <>
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs text-rose-700 font-medium bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          Client Request / Hold
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        {selectedAlert.title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Client: {selectedAlert.founder_name || "Client"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-800 leading-relaxed select-text font-sans">
                      {selectedAlert.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    {selectedAlert.client_id && (
                      <Link
                        href={`/clients/${selectedAlert.client_id}`}
                        className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                      >
                        <span>View Client Profile</span>
                      </Link>
                    )}

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 bg-white text-zinc-700 border border-zinc-200 text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-50 transition-colors shadow-2xs"
                    >
                      <span>Mark as Done</span>
                    </button>
                  </div>
                </>
              )}

              {/* CASE 4: DRAFT INVOICE AWAITING SIGN-OFF */}
              {selectedAlert.entity_type === "invoice_draft" && (
                <>
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Draft Invoice Awaiting Sign-off
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        {selectedAlert.title}
                      </h2>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 pt-0.5">
                        <span className="text-zinc-800 font-medium">{selectedAlert.client_name || "Client"}</span>
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
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Invoice Summary Banner */}
                  <div className="flex items-baseline justify-between p-4 rounded-lg bg-zinc-50/80 border border-zinc-200">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">
                        Total Invoice Amount
                      </span>
                      <div className="text-2xl font-bold font-mono text-zinc-900 tabular-nums">
                        ₹{Number(selectedAlert.total_amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-400 block">Status</span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Draft &middot; Waiting on Sudeesh
                      </span>
                    </div>
                  </div>

                  {/* Line Items Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-medium text-zinc-700">Line Items &amp; Retainer</span>
                      <span className="text-[11px] text-zinc-400">
                        {selectedAlert.line_items?.length || 0} line item{selectedAlert.line_items?.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-150">
                      {selectedAlert.line_items && selectedAlert.line_items.length > 0 ? (
                        selectedAlert.line_items.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-3">
                              <p className="font-medium text-zinc-900 truncate">{item.description}</p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] text-zinc-400">Qty: {item.quantity}</p>
                              )}
                            </div>
                            <div className="font-mono font-semibold text-zinc-900 tabular-nums shrink-0">
                              ₹{Number(item.total_price || item.amount || item.unit_price || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-zinc-500">
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
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                      >
                        <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isPending ? "Approving..." : "Approve Invoice"}</span>
                      </button>

                      <Link
                        href={`/billing/invoices/${selectedAlert.entity_id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 text-xs font-medium px-4 py-2.5 rounded-md transition-colors shadow-2xs"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                        <span>View Full Invoice</span>
                      </Link>

                      <button
                        onClick={() => openInvoiceWhatsAppPing(selectedAlert)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 text-xs font-medium px-4 py-2.5 rounded-md transition-colors shadow-2xs"
                      >
                        <WhatsAppIcon size={14} className="text-[#25D366]" />
                        <span>WhatsApp Summary</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-150 text-xs text-zinc-500">
                      <span>Approval confirms amounts &amp; readies dispatch</span>
                      <Link href="/billing" className="text-zinc-700 hover:text-zinc-900 font-medium transition-colors">
                        All Invoices &rarr;
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* CASE 5: TOOL SUBSCRIPTION RENEWAL */}
              {selectedAlert.entity_type === "tool_renewal" && (
                <>
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-xs text-violet-700 font-medium bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                          Tool Renewal Alert
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        {selectedAlert.tool_name || selectedAlert.title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Renews on {selectedAlert.next_renewal_date}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Subscription Cost:</span>
                      <span className="font-mono font-semibold text-zinc-900">
                        {selectedAlert.currency || "INR"} {Number(selectedAlert.cost_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Allocation:</span>
                      <span className="font-medium text-zinc-800">
                        {selectedAlert.default_pass_through ? "Client Pass-through" : "Agency Overhead"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 pt-1 border-t border-zinc-200/60">
                      {selectedAlert.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <Link
                      href="/billing"
                      className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <span>Manage Tool Catalog</span>
                    </Link>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 bg-white text-zinc-700 border border-zinc-200 text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-50 transition-colors shadow-2xs"
                    >
                      <span>Mark Reviewed</span>
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
                  <div className="flex items-start justify-between border-b border-zinc-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-zinc-400 shrink-0" />
                        <span className="text-xs text-zinc-700 font-medium bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                          Operational Alert
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-zinc-900">
                        {selectedAlert.title}
                      </h2>
                      {selectedAlert.waiting_on && (
                        <p className="text-xs text-zinc-500">
                          Waiting on: {selectedAlert.waiting_on}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                    <p className="text-xs text-zinc-800 leading-relaxed select-text font-sans">
                      {selectedAlert.reason || "Operational item requiring review."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      onClick={() => handleDismissAlert(selectedAlert.id)}
                      className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <span>Mark as Resolved</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200/90 bg-white p-12 text-center space-y-3 shadow-xs">
              <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  All caught up
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  No pending reviews, client holds, or unbilled software expenses right now.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
