"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  AlertOctagon,
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Play,
  Pause,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  createClientRequestAction,
  updateClientRequestStatusAction,
  toggleEmergencyHoldAction,
} from "@/lib/actions/client";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

interface OperationsClientProps {
  initialCredentialLogs: any[];
  initialClientRequests: any[];
  initialFeedback: any[];
  clients: any[];
}

export function OperationsClient({
  initialCredentialLogs,
  initialClientRequests,
  initialFeedback,
  clients,
}: OperationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");
  const [activeTab, setActiveTab] = useState<"requests" | "credentials" | "feedback">("requests");

  // Modal state
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [newCategory, setNewCategory] = useState<string>("general_query");
  const [newPriority, setNewPriority] = useState<string>("normal");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredRequests = useMemo(() => {
    return initialClientRequests.filter((req) => {
      if (categoryFilter !== "all" && req.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "open") {
        return req.status === "submitted" || req.status === "in_progress";
      }
      if (statusFilter === "resolved") {
        return req.status === "resolved" || req.status === "closed";
      }
      return true;
    });
  }, [initialClientRequests, categoryFilter, statusFilter]);

  const activeHoldsCount = initialClientRequests.filter(
    (r) => r.category === "emergency_hold" && (r.status === "submitted" || r.status === "in_progress")
  ).length;

  const handleStatusChange = (requestId: string, newStatus: "submitted" | "in_progress" | "resolved") => {
    startTransition(async () => {
      const res = await updateClientRequestStatusAction(requestId, newStatus);
      if (res.success) {
        showToast(`Request updated to ${newStatus.replace("_", " ")}`);
        router.refresh();
      } else {
        showToast(`Error: ${(res as any).error || "Failed to update"}`);
      }
    });
  };

  const handleReleaseHold = (clientId: string) => {
    startTransition(async () => {
      const res = await toggleEmergencyHoldAction(clientId, false, "Emergency hold resolved from operations board");
      if (res.success) {
        showToast("Emergency hold lifted. Scheduled posts resumed.");
        router.refresh();
      } else {
        showToast(`Error: ${(res as any).error || "Failed to release hold"}`);
      }
    });
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newTitle.trim()) {
      showToast("Please select a client and enter a title.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("client_id", selectedClientId);
      fd.set("title", newTitle);
      fd.set("description", newDescription);
      fd.set("category", newCategory);
      fd.set("priority", newPriority);

      const res = await createClientRequestAction(fd);
      if (res.success) {
        showToast(
          newCategory === "emergency_hold"
            ? "Emergency hold activated. All publishing paused."
            : "Client request logged successfully."
        );
        setShowNewRequestModal(false);
        setNewTitle("");
        setNewDescription("");
        router.refresh();
      } else {
        showToast(`Error: ${(res as any).error || "Failed to create request"}`);
      }
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Operations & Triage"
        description="Manage client service requests, emergency holds, and credential access audit logs."
      >
        <button
          onClick={() => setShowNewRequestModal(true)}
          className="btn btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Request / Hold</span>
        </button>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab("requests")}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            activeTab === "requests" ? "ring-1 ring-[var(--color-ink)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Active Requests & Holds
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
              {initialClientRequests.filter((r) => r.status !== "resolved" && r.status !== "closed").length}
            </span>
            {activeHoldsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] px-2 py-0.5 rounded-full">
                <AlertOctagon className="h-3 w-3" />
                {activeHoldsCount} on Hold
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Triage pipeline</p>
        </div>

        <div
          onClick={() => setActiveTab("credentials")}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            activeTab === "credentials" ? "ring-1 ring-[var(--color-ink)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Credential Accesses
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {initialCredentialLogs.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Audited disclosures & copies</p>
        </div>

        <div
          onClick={() => setActiveTab("feedback")}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            activeTab === "feedback" ? "ring-1 ring-[var(--color-ink)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Review Portal Feedback
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ok-text)]">
            {initialFeedback.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">1-tap portal comments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] pb-2 text-xs">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-[var(--color-ink)] text-[var(--color-base)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Service Requests ({initialClientRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === "credentials"
              ? "bg-[var(--color-ink)] text-[var(--color-base)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Vault Audit Trail ({initialCredentialLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === "feedback"
              ? "bg-[var(--color-ink)] text-[var(--color-base)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Client Feedback Feed ({initialFeedback.length})
        </button>
      </div>

      {/* TAB 1: SERVICE REQUESTS & HOLDS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-base-raised)] p-3 rounded-lg border border-[var(--color-line)] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-ink-tertiary)] font-mono uppercase text-[10px]">Filter Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[var(--color-base)] border border-[var(--color-line)] rounded px-2 py-1 text-xs text-[var(--color-ink)]"
              >
                <option value="all">All Categories</option>
                <option value="emergency_hold">Emergency Holds</option>
                <option value="content_pivot">Content Pivots</option>
                <option value="design_tweak">Design Tweaks</option>
                <option value="tool_issue">Tool Issues</option>
                <option value="general_query">General Queries</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[var(--color-base)] p-0.5 rounded-md border border-[var(--color-line)]">
              <button
                onClick={() => setStatusFilter("open")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === "open"
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium"
                    : "text-[var(--color-ink-secondary)]"
                }`}
              >
                Open / In Progress
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === "resolved"
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium"
                    : "text-[var(--color-ink-secondary)]"
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === "all"
                    ? "bg-[var(--color-ink)] text-[var(--color-base)] font-medium"
                    : "text-[var(--color-ink-secondary)]"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* List */}
          {filteredRequests.length === 0 ? (
            <div className="card p-12 text-center text-xs text-[var(--color-ink-tertiary)]">
              No service requests matching the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isHold = req.category === "emergency_hold";
                const isUrgent = req.priority === "urgent";
                const isResolved = req.status === "resolved" || req.status === "closed";

                return (
                  <div
                    key={req.id}
                    className={`card p-4 space-y-3 border-l-4 transition-all ${
                      isHold
                        ? "border-l-[var(--color-danger)] bg-[var(--color-danger-bg)]/20"
                        : isUrgent
                        ? "border-l-[var(--color-warn)]"
                        : "border-l-[var(--color-line)]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-medium ${
                              isHold
                                ? "bg-[var(--color-danger)] text-white"
                                : "bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] border border-[var(--color-line)]"
                            }`}
                          >
                            {req.category.replace("_", " ")}
                          </span>

                          <span className="font-medium text-xs text-[var(--color-ink)]">
                            {req.clients?.name || "Client"}
                          </span>

                          {req.clients?.founder_name && (
                            <span className="text-[11px] text-[var(--color-ink-tertiary)]">
                              ({req.clients.founder_name})
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                              req.priority === "urgent"
                                ? "text-[var(--color-danger-text)] font-semibold"
                                : req.priority === "high"
                                ? "text-[var(--color-warn-text)]"
                                : "text-[var(--color-ink-muted)]"
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>

                        <h3 className="font-semibold text-sm text-[var(--color-ink)]">
                          {req.title}
                        </h3>

                        {req.description && (
                          <p className="text-xs text-[var(--color-ink-secondary)] whitespace-pre-wrap">
                            {req.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isHold && !isResolved && (
                          <button
                            onClick={() => handleReleaseHold(req.client_id)}
                            disabled={isPending}
                            className="btn btn-secondary text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)]"
                          >
                            <Play className="h-3 w-3" />
                            <span>Resume Publishing</span>
                          </button>
                        )}

                        {!isResolved ? (
                          <div className="flex items-center gap-1">
                            {req.status === "submitted" && (
                              <button
                                onClick={() => handleStatusChange(req.id, "in_progress")}
                                disabled={isPending}
                                className="btn btn-secondary text-xs"
                              >
                                Mark In Progress
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(req.id, "resolved")}
                              disabled={isPending}
                              className="btn btn-primary text-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Resolve</span>
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--color-ok-text)]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-tertiary)] font-mono border-t border-[var(--color-line-subtle)] pt-2">
                      <span>Status: {req.status.replace("_", " ")}</span>
                      <span>
                        {formatDisplayDateTimeIST(req.created_at, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREDENTIAL AUDIT LOGS */}
      {activeTab === "credentials" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
                Immutable Password Access Log
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--color-ink-tertiary)]">
              Real-time Audit Trail
            </span>
          </div>

          {initialCredentialLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
              No password disclosure events recorded yet. Every unmask or clipboard copy is logged with user identity and network context.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {initialCredentialLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)] uppercase tracking-wider px-1.5 py-0.5 bg-[var(--color-base-subtle)] rounded border border-[var(--color-line)]">
                        {log.action}
                      </span>
                      <span className="font-medium text-xs text-[var(--color-ink)]">
                        {log.credentials?.platform || "Platform"}
                      </span>
                      <span className="text-xs text-[var(--color-ink-tertiary)]">
                        ({log.credentials?.clients?.name || "Client"})
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-ink-secondary)] font-mono">
                      Operator: {log.users?.full_name || "Admin"} &middot; IP: {log.ip_address} &middot; UA: {log.user_agent}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] text-[var(--color-ink-tertiary)] shrink-0">
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
      )}

      {/* TAB 3: REVIEW PORTAL FEEDBACK */}
      {activeTab === "feedback" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
                Review Portal Feedback Stream
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--color-ink-tertiary)]">
              Client Revisions
            </span>
          </div>

          {initialFeedback.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)]">
              No client revision comments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {initialFeedback.map((fb) => (
                <div key={fb.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {fb.author_name}
                      </span>
                      <span className="text-[var(--color-ink-tertiary)]">
                        on "{fb.content_items?.title || "Post"}"
                      </span>
                      <span className="text-[var(--color-ink-muted)]">
                        ({fb.content_items?.engagements?.clients?.name || "Client"})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-ink-tertiary)]">
                      {formatDisplayDateTimeIST(fb.created_at, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ink-secondary)] bg-[var(--color-base-subtle)] p-2.5 rounded border border-[var(--color-line)]">
                    {fb.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW REQUEST / EMERGENCY HOLD MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="card max-w-md w-full p-6 space-y-4 bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-display text-base font-normal text-[var(--color-ink)]">
                  Log Client Request / Trigger Hold
                </h3>
              </div>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--color-ink-secondary)] font-medium">Select Client</label>
                <CustomSelect
                  options={clients.map((c) => ({
                    value: c.id,
                    label: c.name,
                    description: c.founder_name,
                  }))}
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  placeholder="Select Client"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[var(--color-ink-secondary)] font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input w-full"
                  >
                    <option value="emergency_hold">Emergency Hold (Freeze All)</option>
                    <option value="content_pivot">Content Pivot</option>
                    <option value="design_tweak">Design Tweak</option>
                    <option value="tool_issue">Tool Issue</option>
                    <option value="general_query">General Query</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--color-ink-secondary)] font-medium">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="input w-full"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {newCategory === "emergency_hold" && (
                <div className="p-3 bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] rounded border border-[var(--color-danger)]/30 text-[11.5px] space-y-1">
                  <span className="font-semibold block">⚠️ Emergency Hold Warning</span>
                  <p>
                    Triggering this category will immediately pause all scheduled LinkedIn posts for this client and broadcast an alert across the Command Center.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[var(--color-ink-secondary)] font-medium">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={newCategory === "emergency_hold" ? "e.g. Founder requested immediate freeze" : "e.g. Pivot hooks away from hiring"}
                  className="input w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-ink-secondary)] font-medium">Details / Instructions</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Paste WhatsApp message or context..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-line)]">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`btn text-xs ${
                    newCategory === "emergency_hold" ? "btn-danger" : "btn-primary"
                  }`}
                >
                  {isPending
                    ? "Saving..."
                    : newCategory === "emergency_hold"
                    ? "Trigger Emergency Hold"
                    : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
