"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  MessageSquare,
  Plus,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  createClientRequestAction,
  updateClientRequestStatusAction,
  toggleEmergencyHoldAction,
} from "@/lib/actions/client";
import { OperationsRequestsTab } from "@/components/operations/operations-requests-tab";
import { OperationsCredentialsTab } from "@/components/operations/operations-credentials-tab";
import { OperationsFeedbackTab } from "@/components/operations/operations-feedback-tab";
import { NewRequestModal } from "@/components/operations/new-request-modal";

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

  // Active tab state
  const [activeTab, setActiveTab] = useState<"requests" | "credentials" | "feedback">("requests");

  // Modal state
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const handleCreateRequest = (data: {
    clientId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("client_id", data.clientId);
      fd.set("title", data.title);
      fd.set("description", data.description);
      fd.set("category", data.category);
      fd.set("priority", data.priority);

      const res = await createClientRequestAction(fd);
      if (res.success) {
        showToast(
          data.category === "emergency_hold"
            ? "Emergency hold activated. All publishing paused."
            : "Client request logged successfully."
        );
        setShowNewRequestModal(false);
        router.refresh();
      } else {
        showToast(`Error: ${(res as any).error || "Failed to create request"}`);
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Operations &amp; Escalations"
        description="Founder requests, emergency publishing freezes, and vault access audit trails."
      >
        <button
          onClick={() => setShowNewRequestModal(true)}
          className="btn btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Escalation / Freeze</span>
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
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Open Escalations &amp; Freezes
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
              {initialClientRequests.filter((r) => r.status !== "resolved" && r.status !== "closed").length}
            </span>
            {activeHoldsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans tabular-nums font-medium text-[var(--color-danger-text)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger-text)]" />
                {activeHoldsCount} Frozen
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Active founder requests &amp; pivots</p>
        </div>

        <div
          onClick={() => setActiveTab("credentials")}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            activeTab === "credentials" ? "ring-1 ring-[var(--color-ink)]" : ""
          }`}
        >
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Vault Access Events
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {initialCredentialLogs.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Audited credential disclosures</p>
        </div>

        <div
          onClick={() => setActiveTab("feedback")}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            activeTab === "feedback" ? "ring-1 ring-[var(--color-ink)]" : ""
          }`}
        >
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Founder Desk Notes
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ok-text)]">
            {initialFeedback.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Direct tone &amp; angle notes from founders</p>
        </div>
      </div>

      {/* Standardized Page-Level Tabs */}
      <div className="flex border-b border-[var(--color-line)] gap-7 overflow-x-auto overflow-y-hidden no-scrollbar">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "requests"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Founder Escalations ({initialClientRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "credentials"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Vault Audit Trail ({initialCredentialLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "feedback"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Founder Desk Notes ({initialFeedback.length})</span>
        </button>
      </div>

      {/* TAB 1: SERVICE REQUESTS & HOLDS */}
      {activeTab === "requests" && (
        <OperationsRequestsTab
          requests={initialClientRequests}
          isPending={isPending}
          onStatusChange={handleStatusChange}
          onReleaseHold={handleReleaseHold}
        />
      )}

      {/* TAB 2: CREDENTIAL AUDIT LOGS */}
      {activeTab === "credentials" && (
        <OperationsCredentialsTab logs={initialCredentialLogs} />
      )}

      {/* TAB 3: REVIEW PORTAL FEEDBACK */}
      {activeTab === "feedback" && (
        <OperationsFeedbackTab feedback={initialFeedback} />
      )}

      {/* NEW REQUEST / EMERGENCY HOLD MODAL */}
      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        clients={clients}
        isPending={isPending}
        onSubmit={handleCreateRequest}
      />
    </div>
  );
}
