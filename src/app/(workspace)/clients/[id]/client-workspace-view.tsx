"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertOctagon } from "lucide-react";
import { revealCredentialAction, copyCredentialAction } from "@/lib/actions/credentials";
import {
  toggleEmergencyHoldAction,
  generateDraftInvoiceAction,
  deleteClientAction,
} from "@/lib/actions/client";
import { ClientWorkspaceDialogs } from "@/components/clients/workspace/client-workspace-dialogs";
import { ClientCredentialsTab } from "@/components/clients/client-credentials-tab";
import { ClientMeetingsTab } from "@/components/clients/client-meetings-tab";
import { ClientDocumentsTab } from "@/components/clients/client-documents-tab";
import { ClientBillingTab } from "@/components/clients/client-billing-tab";
import {
  ClientWorkspaceMasthead,
  type ClientWorkspaceTab,
} from "@/components/clients/workspace/client-workspace-masthead";
import { ClientModals } from "@/components/clients/workspace/client-modals";
import { ClientOverviewTab } from "@/components/clients/workspace/client-overview-tab";
import { ClientVoiceTab } from "@/components/clients/workspace/client-voice-tab";
import { ClientReviewTab } from "@/components/clients/workspace/client-review-tab";
import { useHeader } from "@/components/layout/header-context";
import type {
  ClientWithRelations,
  Engagement,
  ContentItem,
  ToolExpense,
  ClientRequest,
  ClientCredential,
  ClientDocument,
} from "@/types/domain";

interface ClientWorkspaceViewProps {
  client: ClientWithRelations;
  initialTab?: string;
}

const VALID_CLIENT_TABS: ClientWorkspaceTab[] = [
  "overview",
  "context",
  "meetings",
  "documents",
  "tools",
  "vault",
  "review",
];

export function ClientWorkspaceView({ client, initialTab }: ClientWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<ClientWorkspaceTab>(() =>
    initialTab && VALID_CLIENT_TABS.includes(initialTab as ClientWorkspaceTab)
      ? (initialTab as ClientWorkspaceTab)
      : "overview"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { setCustomBreadcrumbs } = useHeader();

  // Sync TopNav breadcrumb with client name
  useEffect(() => {
    setCustomBreadcrumbs([
      { label: "Client Roster", href: "/clients" },
      { label: client.name },
    ]);
    return () => setCustomBreadcrumbs(null);
  }, [client.name, setCustomBreadcrumbs]);


  // Credential vault state: map credentialId -> revealed plaintext
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({});

  // Modals & Menu State
  const [showAddCredModal, setShowAddCredModal] = useState(false);
  const [editingCred, setEditingCred] = useState<ClientCredential | null>(null);
  const [deletingCred, setDeletingCred] = useState<ClientCredential | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditVoiceModal, setShowEditVoiceModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const clientPosts = client.content_items || [];
  const clientTools = client.tool_expenses || [];
  const credentials = client.credentials || [];
  const clientMeetings = client.meetings || [];
  const knowledgeItems = client.knowledge_items || [];
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>(
    client.documents || []
  );
  const clientInvoices = client.invoices || [];

  useEffect(() => {
    setClientDocuments(client.documents || []);
  }, [client.documents]);

  const context = client.context || null;
  const reviewToken = client.review_tokens?.[0]?.token_hash || null;
  const reviewUrl = reviewToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/review/${reviewToken}` : `/review/${reviewToken}`)
    : null;

  const totalRetainer = (client.engagements || []).reduce(
    (acc: number, e: Engagement) => acc + Number(e.monthly_retainer || 0),
    0
  );

  const primaryEngagement = client.engagements?.[0] || null;
  const billingAnchorDay = primaryEngagement?.billing_anchor_day || 5;

  const unbilledToolTotal = clientTools
    .filter((t: ToolExpense) => t.status !== "invoiced" && t.status !== "reimbursed")
    .reduce((acc: number, t: ToolExpense) => acc + Number(t.amount || 0), 0);

  // Check if an emergency hold is active
  const hasEmergencyHold =
    client.status?.toLowerCase() === "paused" ||
    (client.client_requests || []).some(
      (r: ClientRequest) => r.category === "emergency_hold" && (r.status === "submitted" || r.status === "in_progress")
    );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Countdown interval for revealed credentials
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTimers((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [id, count] of Object.entries(prev)) {
          if (count > 1) {
            next[id] = count - 1;
            changed = true;
          } else {
            // Timer expired; re-mask
            setRevealedPasswords((rPrev) => {
              const rNext = { ...rPrev };
              delete rNext[id];
              return rNext;
            });
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRevealPassword = async (credId: string) => {
    if (revealedPasswords[credId]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[credId];
        return next;
      });
      setCountdownTimers((prev) => {
        const next = { ...prev };
        delete next[credId];
        return next;
      });
      return;
    }

    startTransition(async () => {
      const res = await revealCredentialAction(credId);
      if (res.success && res.plaintext) {
        setRevealedPasswords((prev) => ({ ...prev, [credId]: res.plaintext }));
        setCountdownTimers((prev) => ({ ...prev, [credId]: 30 }));
        showToast("Password unmasked · Ephemeral 30s auto-wipe timer active");
      } else {
        showToast("Could not reveal credential.");
      }
    });
  };

  const handleCopyPassword = async (credId: string) => {
    startTransition(async () => {
      const res = await copyCredentialAction(credId);
      if (res.success && res.plaintext) {
        navigator.clipboard.writeText(res.plaintext);
        showToast("Copied password to clipboard · Audit log recorded");
      } else {
        showToast("Could not retrieve password.");
      }
    });
  };


  const handleCopyReviewLink = () => {
    if (!reviewUrl) {
      showToast("No active review link available for this client yet.");
      return;
    }
    navigator.clipboard.writeText(reviewUrl);
    showToast(`Copied private review link for ${client.founder_name || "Founder"}`);
  };

  const openFounderWhatsApp = () => {
    if (!reviewUrl) {
      showToast("No active review link available for this client yet.");
      return;
    }
    const phone = client.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    if (!phone) {
      showToast("No WhatsApp phone number configured for this founder.");
      return;
    }
    const message = encodeURIComponent(
      `Hi ${client.founder_name || "there"}, here is your private review link for this week's content: ${reviewUrl}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleToggleEmergencyHold = (shouldHold: boolean) => {
    startTransition(async () => {
      const res = await toggleEmergencyHoldAction(
        client.id,
        shouldHold,
        shouldHold ? "Emergency pause requested by executive command." : undefined
      );
      if (res.success) {
        showToast(
          shouldHold
            ? "Publishing paused: All scheduled posts placed on hold."
            : "Publishing resumed: Scheduled posts re-activated."
        );
        router.refresh();
      } else {
        showToast(`Hold error: ${res.error}`);
      }
    });
  };

  const handleDraftInvoice = () => {
    startTransition(async () => {
      const res = await generateDraftInvoiceAction(client.id);
      if (res.success) {
        setActiveTab("tools");
        showToast(
          `Created draft invoice ${res.invoiceNumber} (₹${res.subtotal?.toLocaleString("en-IN")}) with ${res.toolExpensesCount} software expenses`
        );
        router.refresh();
      } else {
        showToast(`Invoice error: ${res.error}`);
      }
    });
  };

  const handleDeleteClient = () => {
    startTransition(async () => {
      const res = await deleteClientAction(client.id);
      if (res.success) {
        router.push("/clients");
      } else {
        setShowDeleteConfirm(false);
        showToast(`Delete failed: ${res.error}`);
      }
    });
  };

  const reviewPendingCount = clientPosts.filter((p: ContentItem) => p.status === "client_review").length;
  const scheduledCount = clientPosts.filter(
    (p: ContentItem) => p.status === "scheduled" || p.status === "approved"
  ).length;
  const draftCount = clientPosts.filter(
    (p: ContentItem) => p.status === "draft" || p.status === "internal_review"
  ).length;

  // Next billing cycle calculation
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisMonthAnchor = new Date(today.getFullYear(), today.getMonth(), billingAnchorDay);
  const nextBillingDate =
    thisMonthAnchor >= todayMidnight
      ? thisMonthAnchor
      : new Date(today.getFullYear(), today.getMonth() + 1, billingAnchorDay);
  const daysUntilInvoice = Math.max(
    0,
    Math.ceil((nextBillingDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  );
  const nextBillingFormatted = nextBillingDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const primaryServiceLabel =
    primaryEngagement?.service_type === "linkedin_branding"
      ? "LinkedIn Founder Branding"
      : primaryEngagement?.service_type === "cold_outreach"
      ? "Cold Outbound Outreach"
      : primaryEngagement
      ? "Hybrid Growth Engine"
      : "Retainer Engagement";

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modals */}
      <ClientModals
        clientName={client.name}
        showDeleteConfirm={showDeleteConfirm}
        onCloseDeleteConfirm={() => setShowDeleteConfirm(false)}
        onConfirmDelete={handleDeleteClient}
        showPauseConfirm={showPauseConfirm}
        onClosePauseConfirm={() => setShowPauseConfirm(false)}
        onConfirmPause={() => {
          setShowPauseConfirm(false);
          handleToggleEmergencyHold(true);
        }}
        isPending={isPending}
      />

      {/* EMERGENCY HOLD BANNER */}
      {hasEmergencyHold && (
        <div className="border-b border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] px-5 lg:px-7 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="h-4 w-4 text-[var(--color-danger-text)] shrink-0" />
            <div>
              <span className="font-medium text-xs text-[var(--color-danger-text)]">
                Publishing is currently paused
              </span>
              <span className="text-[11.5px] text-[var(--color-danger-text)]/80 ml-2 hidden sm:inline">
                Scheduled posts for {client.name} are on hold.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleToggleEmergencyHold(false)}
            disabled={isPending}
            className="text-xs font-medium text-[var(--color-danger-text)] underline hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
          >
            Resume Publishing
          </button>
        </div>
      )}

      {/* ─── UNIFIED ARCHITECTURAL CLIENT MASTHEAD (FLUSH EDGE-TO-EDGE) ─── */}
      <ClientWorkspaceMasthead
        client={client}
        hasEmergencyHold={hasEmergencyHold}
        totalRetainer={totalRetainer}
        primaryServiceLabel={primaryServiceLabel}
        daysUntilInvoice={daysUntilInvoice}
        nextBillingFormatted={nextBillingFormatted}
        billingAnchorDay={billingAnchorDay}
        clientPostsCount={clientPosts.length}
        reviewPendingCount={reviewPendingCount}
        scheduledCount={scheduledCount}
        draftCount={draftCount}
        unbilledToolTotal={unbilledToolTotal}
        clientToolsCount={clientTools.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCopyReviewLink={handleCopyReviewLink}
        onOpenEditModal={() => setShowEditClientModal(true)}
        onOpenWhatsApp={openFounderWhatsApp}
        onDraftInvoice={handleDraftInvoice}
        onToggleHold={handleToggleEmergencyHold}
        onOpenPauseConfirm={() => setShowPauseConfirm(true)}
        onOpenDeleteConfirm={() => setShowDeleteConfirm(true)}
        isPending={isPending}
      />

      {/* ─── TAB PANELS ─── */}
      <div className="flex-1 px-5 py-6 lg:px-7 lg:py-6">
        {/* TAB 1: PERSPECTIVES & FOUNDER DOSSIER */}
        {activeTab === "overview" && (
          <ClientOverviewTab
            client={client}
            clientPosts={clientPosts}
            reviewPendingCount={reviewPendingCount}
            scheduledCount={scheduledCount}
            draftCount={draftCount}
            reviewToken={reviewToken}
            reviewUrl={reviewUrl}
            onCopyReviewLink={handleCopyReviewLink}
            onOpenVoiceModal={() => setShowEditVoiceModal(true)}
            onSelectTab={setActiveTab}
          />
        )}

        {/* TAB 2: VOICE & WORDS TO AVOID */}
        {activeTab === "context" && (
          <ClientVoiceTab
            clientId={client.id}
            founderName={client.founder_name}
            context={context}
            onOpenVoiceModal={() => setShowEditVoiceModal(true)}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {/* TAB 3: CLIENT MEMORY & MEETINGS */}
        {activeTab === "meetings" && (
          <ClientMeetingsTab
            clientId={client.id}
            clientName={client.name}
            founderName={client.founder_name}
            meetings={clientMeetings}
            knowledgeItems={knowledgeItems}
          />
        )}

        {/* TAB 4: DOCUMENTS & STRATEGIC ASSETS */}
        {activeTab === "documents" && (
          <ClientDocumentsTab
            clientId={client.id}
            clientName={client.name}
            documents={clientDocuments}
            invoices={clientInvoices}
            onToast={(msg) => showToast(msg)}
            onDocumentsChange={setClientDocuments}
          />
        )}

        {/* TAB 5: INVOICES & DEDICATED TOOLING */}
        {activeTab === "tools" && (
          <ClientBillingTab
            clientId={client.id}
            clientName={client.name}
            invoices={clientInvoices}
            tools={clientTools}
            monthlyRetainer={totalRetainer}
            billingAnchorDay={billingAnchorDay}
            onDraftInvoice={handleDraftInvoice}
            onOpenAddExpense={() => setShowAddExpenseModal(true)}
            isDrafting={isPending}
            onToast={(msg) => showToast(msg)}
          />
        )}

        {/* TAB 6: CREDENTIAL VAULT */}
        {activeTab === "vault" && (
          <ClientCredentialsTab
            credentials={credentials}
            revealedPasswords={revealedPasswords}
            countdownTimers={countdownTimers}
            onRevealPassword={handleRevealPassword}
            onCopyPassword={handleCopyPassword}
            onOpenAddCredModal={() => setShowAddCredModal(true)}
            onEditCredential={(cred) => setEditingCred(cred)}
            onDeleteCredential={(cred) => setDeletingCred(cred)}
          />
        )}

        {/* TAB 7: CLIENT REVIEW PORTAL */}
        {activeTab === "review" && (
          <ClientReviewTab
            clientName={client.name}
            founderName={client.founder_name}
            reviewUrl={reviewUrl}
            reviewToken={reviewToken}
            reviewPendingCount={reviewPendingCount}
            onCopyReviewLink={handleCopyReviewLink}
            onOpenWhatsApp={openFounderWhatsApp}
          />
        )}
      </div>

      {/* FUNCTIONAL MODALS */}
      <ClientWorkspaceDialogs
        client={client}
        context={context}
        showAddCredModal={showAddCredModal}
        onCloseAddCredModal={() => setShowAddCredModal(false)}
        editingCred={editingCred}
        onCloseEditCredModal={() => setEditingCred(null)}
        deletingCred={deletingCred}
        onCloseDeleteCredModal={() => setDeletingCred(null)}
        showAddExpenseModal={showAddExpenseModal}
        onCloseAddExpenseModal={() => setShowAddExpenseModal(false)}
        showEditVoiceModal={showEditVoiceModal}
        onCloseEditVoiceModal={() => setShowEditVoiceModal(false)}
        showEditClientModal={showEditClientModal}
        onCloseEditClientModal={() => setShowEditClientModal(false)}
        onToast={showToast}
      />
    </div>
  );
}
