"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  FileText,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Lock,
  Share2,
  ShieldAlert,
  AlertOctagon,
  FileCheck,
  MoreHorizontal,
  Mail,
  Phone,
  ArrowUpRight,
  Clock,
  Send,
  X,
  Globe,
  Pencil,
  Calendar,
  FolderOpen,
  Receipt,
} from "lucide-react";
import { revealCredentialAction, copyCredentialAction } from "@/lib/actions/credentials";
import {
  addTabooWordAction,
  removeTabooWordAction,
  toggleEmergencyHoldAction,
  generateDraftInvoiceAction,
  deleteClientAction,
} from "@/lib/actions/client";
import { AddCredentialModal } from "@/components/clients/add-credential-modal";
import { EditCredentialModal } from "@/components/clients/edit-credential-modal";
import { DeleteCredentialModal } from "@/components/clients/delete-credential-modal";
import { LogExpenseModal } from "@/components/clients/log-expense-modal";
import { EditVoiceModal } from "@/components/clients/edit-voice-modal";
import { EditClientModal } from "@/components/clients/edit-client-modal";
import { NewContentModal } from "@/components/content/new-content-modal";
import { ClientCredentialsTab } from "@/components/clients/client-credentials-tab";
import { ClientMeetingsTab } from "@/components/clients/client-meetings-tab";
import { ClientDocumentsTab } from "@/components/clients/client-documents-tab";
import { ClientBillingTab } from "@/components/clients/client-billing-tab";
import { useHeader } from "@/components/layout/header-context";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDisplayDateIST } from "@/lib/date-utils";
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
}

function getPostExcerpt(title?: string | null, body?: string | null): string {
  if (!body) return "";
  let clean = body.trim();
  if (title && clean.toLowerCase().startsWith(title.trim().toLowerCase())) {
    clean = clean.slice(title.trim().length).replace(/^[\s.—–\-:]+/, "").trim();
  }
  return clean || body.trim();
}

export function ClientWorkspaceView({ client }: ClientWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "context" | "meetings" | "documents" | "tools" | "vault" | "review"
  >("overview");
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

  // Taboo words state
  const [newTabooWord, setNewTabooWord] = useState("");

  // Credential vault state: map credentialId -> revealed plaintext
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({});
  
  // Modals & Menu State
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  const [showAddCredModal, setShowAddCredModal] = useState(false);
  const [editingCred, setEditingCred] = useState<ClientCredential | null>(null);
  const [deletingCred, setDeletingCred] = useState<ClientCredential | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditVoiceModal, setShowEditVoiceModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

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

  const founderInitials = (client.founder_name || client.name)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMoreActions) return;
    const handleWindowClick = () => setShowMoreActions(false);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [showMoreActions]);

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
      // Re-mask manually
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

  const handleAddTabooWord = () => {
    if (!newTabooWord.trim()) return;
    const word = newTabooWord.trim();
    setNewTabooWord("");
    startTransition(async () => {
      const res = await addTabooWordAction(client.id, word);
      if (res.success) {
        showToast(`Added '${word}' to words to avoid`);
        router.refresh();
      } else {
        showToast("Failed to add word");
      }
    });
  };

  const handleRemoveTabooWord = (word: string) => {
    startTransition(async () => {
      const res = await removeTabooWordAction(client.id, word);
      if (res.success) {
        showToast(`Removed '${word}' from words to avoid`);
        router.refresh();
      } else {
        showToast("Failed to remove word");
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

  const modalEngagements = (client.engagements || []).map((eng: Engagement) => ({
    id: eng.id,
    clientName: client.name,
    founderName: client.founder_name,
    serviceType: eng.service_type,
    tabooWords: context?.taboo_words || [],
    corePillars: context?.core_pillars || [],
  }));

  return (
    <div className="w-full space-y-5 pb-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm text-[var(--color-ink)]">
                Delete {client.name}?
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                This action cannot be undone.
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1">
              Permanently removes client profile, engagements, content, invoices, credentials, and access tokens.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={isPending}
                className="btn btn-primary text-xs"
              >
                {isPending ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY PAUSE CONFIRMATION MODAL */}
      {showPauseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm text-[var(--color-ink)]">
                Pause Publishing for {client.name}?
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                Immediate operational freeze
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1">
              This will temporarily hold all scheduled content releases for this client until explicitly resumed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowPauseConfirm(false)}
                disabled={isPending}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPauseConfirm(false);
                  handleToggleEmergencyHold(true);
                }}
                disabled={isPending}
                className="btn btn-primary text-xs"
              >
                {isPending ? "Pausing…" : "Pause Publishing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY HOLD BANNER */}
      {hasEmergencyHold && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] px-4 py-3 flex items-center justify-between gap-4">
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

      {/* ─── UNIFIED ARCHITECTURAL CLIENT MASTHEAD ─── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-card">
        {/* Band 1: Brand Identity + Primary Action Cluster */}
        <div className="p-5 sm:px-7 sm:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Logo + Client Name + Founder Contact Strip */}
          <div className="flex items-start gap-4 min-w-0">
            <BrandLogo
              nameOrDomain={client.website_url || client.founder_email || client.name}
              size={52}
              className="h-[52px] w-[52px] object-contain rounded-[var(--radius-md)] border border-[var(--color-line-subtle)] shrink-0"
              fallback={
                <UserAvatar
                  seed={client.founder_name || client.name}
                  size={52}
                  className="rounded-[var(--radius-md)]"
                  alt={client.founder_name || client.name}
                />
              }
            />

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-[var(--color-ink)] leading-none">
                  {client.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-widest text-[var(--color-ink-secondary)]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      hasEmergencyHold
                        ? "bg-[var(--color-danger)]"
                        : client.status?.toLowerCase() === "onboarding"
                        ? "bg-amber-400"
                        : "bg-[var(--color-ok)]"
                    }`}
                  />
                  <span>{hasEmergencyHold ? "Paused" : client.status || "Active"}</span>
                </span>
              </div>

              {/* Founder Contact Strip */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--color-ink-tertiary)]">
                <span className="text-[var(--color-ink-secondary)]">
                  <strong className="font-medium text-[var(--color-ink)]">{client.founder_name}</strong>
                  {client.founder_title && (
                    <span className="text-[var(--color-ink-tertiary)]"> · {client.founder_title}</span>
                  )}
                </span>

                {client.founder_email && (
                  <>
                    <span className="text-[var(--color-line-strong)] select-none">·</span>
                    <a
                      href={`mailto:${client.founder_email}`}
                      className="inline-flex items-center gap-1.5 hover:text-[var(--color-ink)] transition-colors font-sans tabular-nums text-xs"
                    >
                      <Mail className="h-3 w-3 shrink-0" />
                      <span>{client.founder_email}</span>
                    </a>
                  </>
                )}

                {client.founder_phone && (
                  <>
                    <span className="text-[var(--color-line-strong)] select-none">·</span>
                    <button
                      type="button"
                      onClick={openFounderWhatsApp}
                      className="inline-flex items-center gap-1.5 hover:text-[#25D366] transition-colors font-sans tabular-nums text-xs cursor-pointer"
                      title="Open WhatsApp chat with review link"
                    >
                      <WhatsAppIcon size={12} className="text-[#25D366] shrink-0" />
                      <span>{client.founder_phone}</span>
                    </button>
                  </>
                )}

                {client.linkedin_url && (
                  <>
                    <span className="text-[var(--color-line-strong)] select-none">·</span>
                    <a
                      href={client.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[#0A66C2] transition-colors text-xs"
                      title="Open founder's LinkedIn Profile"
                    >
                      <LinkedInIcon size={13} color="brand" />
                      <span>LinkedIn</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </a>
                  </>
                )}

                {client.website_url && (
                  <>
                    <span className="text-[var(--color-line-strong)] select-none">·</span>
                    <a
                      href={client.website_url.startsWith("http") ? client.website_url : `https://${client.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-[var(--color-ink)] transition-colors text-xs"
                      title="Visit Company Website"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span>{client.website_url.replace(/^https?:\/\//, "")}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Balanced Operational Action Cluster */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyReviewLink}
              className="btn btn-secondary text-xs"
              title="Copy 1-tap Founder Desk link"
            >
              <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
              <span>Copy Review Link</span>
            </button>

            <button
              onClick={() => setShowEditClientModal(true)}
              className="btn btn-secondary text-xs"
              title="Edit client profile and retainer terms"
            >
              <Pencil className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={openFounderWhatsApp}
              className="btn btn-primary text-xs"
              title="Ping founder on WhatsApp with private review link"
            >
              <WhatsAppIcon size={14} className="text-[#25D366]" />
              <span>Ping on WhatsApp</span>
            </button>

            {/* Overflow Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreActions(!showMoreActions);
                }}
                className="btn btn-secondary text-xs p-2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                title="More operational actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showMoreActions && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-1.5 w-52 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] py-1 shadow-lifted z-30 animate-in"
                >
                  <button
                    onClick={() => { setShowMoreActions(false); handleDraftInvoice(); }}
                    disabled={isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                  >
                    <FileCheck className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    <span>Draft Retainer Invoice</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreActions(false);
                      if (hasEmergencyHold) {
                        handleToggleEmergencyHold(false);
                      } else {
                        setShowPauseConfirm(true);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    <span>{hasEmergencyHold ? "Resume Publishing" : "Emergency Pause"}</span>
                  </button>

                  <div className="h-[1px] bg-[var(--color-line-subtle)] my-1" />

                  <button
                    onClick={() => { setShowMoreActions(false); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger-text)]" />
                    <span>Delete Client</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Band 2: 4-Column Architectural Vitals Ledger */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[var(--color-line-subtle)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/35">
          <div className="px-5 py-4 sm:px-7">
            <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1.5">
              Monthly Retainer
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
                ₹{totalRetainer.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-sans text-[var(--color-ink-muted)]">/mo</span>
            </div>
            <span className="block text-[11.5px] text-[var(--color-ink-secondary)] mt-1.5 truncate">
              {primaryServiceLabel}
            </span>
          </div>

          <div className="px-5 py-4 sm:px-7">
            <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1.5">
              Next Invoice Cycle
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
                {daysUntilInvoice === 0
                  ? "Due today"
                  : `In ${daysUntilInvoice} ${daysUntilInvoice === 1 ? "day" : "days"}`}
              </span>
            </div>
            <span className="block text-[11.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] mt-1.5">
              Due {nextBillingFormatted} · Day {billingAnchorDay} anchor
            </span>
          </div>

          <div className="px-5 py-4 sm:px-7">
            <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1.5">
              Editorial Cadence
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
                {clientPosts.length}
              </span>
              <span className="text-xs font-sans text-[var(--color-ink-muted)]">
                {clientPosts.length === 1 ? "perspective" : "perspectives"}
              </span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-[var(--color-ink-secondary)] flex items-center gap-1.5">
              {reviewPendingCount > 0 ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                  <span className="text-[var(--color-warn-text)]">{reviewPendingCount} awaiting sign-off</span>
                </>
              ) : scheduledCount > 0 ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)] shrink-0" />
                  <span>{scheduledCount} scheduled for release</span>
                </>
              ) : (
                <span>{draftCount} in working draft</span>
              )}
            </div>
          </div>

          <div className="px-5 py-4 sm:px-7">
            <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1.5">
              Dedicated Tooling
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
                ₹{unbilledToolTotal.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-sans text-[var(--color-ink-muted)]">unbilled</span>
            </div>
            <span className="block text-[11.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] mt-1.5">
              {clientTools.length} {clientTools.length === 1 ? "active tool seat" : "active tool seats"} · Zero markup
            </span>
          </div>
        </div>

        {/* Band 3: Integrated Workspace Tab Navigation */}
        <div className="px-5 sm:px-7 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface)] rounded-b-[var(--radius-lg)] flex items-center gap-7 overflow-x-auto overflow-y-hidden no-scrollbar">
          {([
            { id: "overview",   label: "Perspectives",   count: clientPosts.length },
            { id: "context",    label: "Voice & Edges",  count: 0 },
            { id: "meetings",   label: "Meetings",       count: clientMeetings.length },
            { id: "documents",  label: "Documents",      count: clientDocuments.length },
            { id: "tools",      label: "Billing",        count: clientInvoices.length + clientTools.length },
            { id: "vault",      label: "Vault",          count: credentials.length },
            { id: "review",     label: "Review Portal",  count: reviewPendingCount },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3.5 text-[13px] transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-[var(--color-ink)] text-[var(--color-ink)] font-semibold"
                    : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] font-medium"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`font-sans tabular-nums text-[11px] ${
                      isActive ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink-muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB PANELS ─── */}

      {/* TAB 1: PERSPECTIVES & FOUNDER DOSSIER (8 / 4 Asymmetric Split) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Editorial Publishing Stream */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
                  Editorial Publishing Stream
                </h2>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                  Click any perspective to open the full Story &amp; Post Editor.
                </p>
              </div>
              <Link
                href={`/content/new?clientId=${client.id}`}
                className="btn btn-primary text-xs shrink-0 inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Perspective</span>
              </Link>
            </div>

            {clientPosts.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center space-y-3">
                <FileText className="h-7 w-7 text-[var(--color-ink-muted)] mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="text-sm font-medium text-[var(--color-ink)]">No perspectives drafted yet</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)] leading-relaxed">
                    Capture {client.founder_name}&apos;s unfiltered conviction and shape it into a LinkedIn perspective ready for 1-tap review.
                  </p>
                </div>
                <Link
                  href={`/content/new?clientId=${client.id}`}
                  className="btn btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Draft First Perspective</span>
                </Link>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] shadow-2xs overflow-hidden">
                {clientPosts.map((post: any) => {
                  const isReview = post.status === "client_review";
                  const isApproved = post.status === "approved" || post.status === "scheduled";
                  const isPaused = post.status === "paused";
                  const excerpt = getPostExcerpt(post.title, post.body_markdown);

                  return (
                    <div
                      key={post.id}
                      onClick={() => router.push(`/content/${post.id}`)}
                      className="group p-5 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer flex flex-col gap-2.5"
                    >
                      {/* Top Meta Row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                          <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-wider text-[var(--color-ink-secondary)]">
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isPaused
                                  ? "bg-[var(--color-danger)]"
                                  : isReview
                                  ? "bg-[var(--color-warn)]"
                                  : isApproved
                                  ? "bg-[var(--color-ok)]"
                                  : "bg-[var(--color-ink-muted)]"
                              }`}
                            />
                            <span>{post.status?.replace("_", " ")}</span>
                          </span>

                          {post.target_pillar && (
                            <>
                              <span className="text-[var(--color-line-strong)]">·</span>
                              <span>{post.target_pillar}</span>
                            </>
                          )}

                          {post.scheduled_publish_date && (
                            <>
                              <span className="text-[var(--color-line-strong)]">·</span>
                              <span>Slot: {formatDisplayDateIST(post.scheduled_publish_date)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isReview && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyReviewLink();
                              }}
                              className="btn btn-secondary text-[11px] py-1 px-2.5"
                              title="Copy private review link"
                            >
                              <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                              <span>Copy Link</span>
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-ink)] transition-colors">
                            <span>Open Editor</span>
                            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* Headline */}
                      <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent-text)] transition-colors leading-snug">
                        {post.title}
                      </h3>

                      {/* De-duplicated Excerpt */}
                      {excerpt && excerpt !== post.title && (
                        <p className="text-[13px] text-[var(--color-ink-secondary)] line-clamp-2 leading-relaxed">
                          {excerpt}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Founder Voice Snapshot & Portal Dossier */}
          <div className="lg:col-span-4 space-y-4">
            {/* Dossier Card 1: Voice & Positioning Guardrails */}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-sans uppercase tracking-widest font-semibold text-[var(--color-ink-tertiary)]">
                  Voice &amp; Guardrails
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("context")}
                  className="text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Configure</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {context?.tone_archetype || context?.positioning_statement ? (
                <div className="space-y-3">
                  {context?.tone_archetype && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block mb-0.5">
                        Tone Archetype
                      </span>
                      <p className="text-xs font-semibold text-[var(--color-ink)]">
                        {context.tone_archetype}
                      </p>
                    </div>
                  )}
                  {context?.positioning_statement && (
                    <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed border-l-2 border-[var(--color-line-strong)] pl-3 py-0.5 line-clamp-3">
                      {context.positioning_statement}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowEditVoiceModal(true)}
                  className="w-full text-left rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] p-3 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)] transition-colors cursor-pointer"
                >
                  Define {client.founder_name}&apos;s tone archetype, positioning, and content pillars &rarr;
                </button>
              )}

              {/* Core Pillars */}
              {context?.core_pillars && context.core_pillars.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--color-line-subtle)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] block">
                    Content Pillars
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {context.core_pillars.map((pillar: string) => (
                      <span
                        key={pillar}
                        className="text-[11px] font-sans text-[var(--color-ink-secondary)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] px-2 py-0.5 rounded-[var(--radius-xs)]"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Taboo Words Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-line-subtle)] text-xs">
                <span className="text-[var(--color-ink-tertiary)]">Avoided buzzwords</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("context")}
                  className="font-sans tabular-nums font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  {context?.taboo_words?.length || 0} terms &rarr;
                </button>
              </div>
            </div>

            {/* Dossier Card 2: Founder Desk & Recent Sync */}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-sans uppercase tracking-widest font-semibold text-[var(--color-ink-tertiary)]">
                  Founder Desk Portal
                </span>
                {reviewUrl && (
                  <Link
                    href={`/review/${reviewToken}`}
                    target="_blank"
                    className="text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Open Live</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                Zero-login mobile portal for {client.founder_name} to approve drafts in one tap or leave voice notes.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReviewLink}
                  className="btn btn-secondary text-xs flex-1 justify-center"
                >
                  <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Copy Desk Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className="btn btn-secondary text-xs px-3"
                  title="Preview mobile Founder Desk"
                >
                  <span>Preview</span>
                </button>
              </div>

              {/* Latest Conversation Sync */}
              <div className="pt-3 border-t border-[var(--color-line-subtle)] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Latest Sync
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("meetings")}
                    className="text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    All ({clientMeetings.length}) &rarr;
                  </button>
                </div>
                {clientMeetings.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("meetings")}
                    className="w-full text-left group/meet cursor-pointer"
                  >
                    <p className="text-xs font-medium text-[var(--color-ink)] group-hover/meet:text-[var(--color-accent-text)] truncate transition-colors">
                      {clientMeetings[0].title}
                    </p>
                    <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-muted)]">
                      {formatDisplayDateIST(clientMeetings[0].meeting_date)}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab("meetings")}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] cursor-pointer"
                  >
                    No conversations logged yet &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 2: VOICE & WORDS TO AVOID */}
      {activeTab === "context" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
                  Brand Voice &amp; Positioning
                </h2>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                  Foundational tone, audience, and content pillars for {client.founder_name}.
                </p>
              </div>
              <button
                onClick={() => setShowEditVoiceModal(true)}
                className="btn btn-primary text-xs shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Voice &amp; Pillars</span>
              </button>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] shadow-2xs">
              {/* Positioning Statement */}
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
                  Positioning Statement
                </span>
                {context?.positioning_statement ? (
                  <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                    {context.positioning_statement}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
                  >
                    No positioning statement configured yet. Click to define &rarr;
                  </button>
                )}
              </div>

              {/* Target Audience / ICP */}
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
                  Target Audience / ICP
                </span>
                {context?.target_audience_icp ? (
                  <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                    {context.target_audience_icp}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
                  >
                    No target audience or ICP defined yet. Click to define &rarr;
                  </button>
                )}
              </div>

              {/* Tone Archetype */}
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
                  Tone Archetype
                </span>
                {context?.tone_archetype ? (
                  <p className="text-[13px] font-medium text-[var(--color-ink)]">
                    {context.tone_archetype}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
                  >
                    No tone archetype defined yet. Click to define &rarr;
                  </button>
                )}
              </div>

              {/* Voice Guidelines & Nuances */}
              <div className="p-5 space-y-1.5">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
                  Voice Guidelines &amp; Nuances
                </span>
                {context?.voice_guidelines ? (
                  <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                    {context.voice_guidelines}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
                  >
                    No specific voice guidelines defined yet. Click to define &rarr;
                  </button>
                )}
              </div>

              {/* Core Content Pillars */}
              <div className="p-5 space-y-2">
                <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
                  Core Content Pillars
                </span>
                {context?.core_pillars && context.core_pillars.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {context.core_pillars.map((pillar: string) => (
                      <span
                        key={pillar}
                        className="inline-flex items-center rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] px-2.5 py-1 text-xs font-sans font-medium"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
                  >
                    No core pillars configured yet. Click to add themes &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Words to Avoid (Negative Guardrails) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
                Words to Avoid
              </h2>
              <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                Buzzwords this founder refuses to use. Flagged automatically in the editor.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap gap-2 min-h-[48px]">
                {(!context?.taboo_words || context.taboo_words.length === 0) ? (
                  <span className="text-xs text-[var(--color-ink-muted)] py-1">
                    No avoided words configured yet.
                  </span>
                ) : (
                  context.taboo_words.map((w: string) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] px-2.5 py-1 text-xs font-sans"
                    >
                      <span className="line-through text-[var(--color-ink-secondary)]">{w}</span>
                      <button
                        onClick={() => handleRemoveTabooWord(w)}
                        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                        title="Remove taboo word"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Taboo Word Form */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-line-subtle)]">
                <input
                  type="text"
                  value={newTabooWord}
                  onChange={(e) => setNewTabooWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTabooWord()}
                  placeholder="Add phrase to avoid (e.g. synergy)..."
                  className="input text-xs flex-1"
                />
                <button
                  onClick={handleAddTabooWord}
                  disabled={isPending || !newTabooWord.trim()}
                  className="btn btn-primary text-xs shrink-0 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2.5: CLIENT MEMORY & MEETINGS */}
      {activeTab === "meetings" && (
        <ClientMeetingsTab
          clientId={client.id}
          clientName={client.name}
          founderName={client.founder_name}
          meetings={clientMeetings}
          knowledgeItems={knowledgeItems}
        />
      )}

      {/* TAB 2.8: DOCUMENTS & STRATEGIC ASSETS */}
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

      {/* TAB 3: INVOICES & DEDICATED TOOLING */}
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

      {/* TAB 4: CREDENTIAL VAULT */}
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

      {/* TAB 5: CLIENT REVIEW PORTAL */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
                  Private Founder Desk Gateway
                </h2>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                Private, zero-login mobile workspace for {client.founder_name}. Keep the edges. They approve every word before it carries their name.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                  Private Founder Desk URL
                </span>
                <div className="font-sans tabular-nums text-xs text-[var(--color-ink)] break-all select-all bg-[var(--color-base-subtle)] p-2.5 rounded-[var(--radius-xs)] border border-[var(--color-line)]">
                  {reviewUrl || "No review link generated yet"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReviewLink}
                  className="btn btn-secondary text-xs flex-1 justify-center"
                >
                  <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Copy Desk Link</span>
                </button>
                {reviewUrl && (
                  <Link
                    href={`/review/${reviewToken}`}
                    target="_blank"
                    className="btn btn-secondary text-xs flex-1 justify-center inline-flex items-center gap-1.5"
                  >
                    <span>Open Founder Desk</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <button
                onClick={openFounderWhatsApp}
                className="btn btn-primary text-xs w-full justify-center"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Ping Founder on WhatsApp</span>
              </button>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                Founder Approval Queue
              </span>
              <div className="font-display text-2xl font-semibold text-[var(--color-ink)] tabular-nums">
                {reviewPendingCount}{" "}
                <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">
                  perspectives awaiting review
                </span>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                When a perspective is sent for review, it appears instantly on the founder&apos;s mobile phone for 1-tap sign-off or voice notes.
              </p>
            </div>
          </div>

          {/* Mobile Simulator Frame */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[360px] rounded-[36px] border-[6px] border-[#18181b] bg-[#09090b] p-2.5 shadow-2xl">
              {/* Speaker Notch */}
              <div className="mx-auto mb-2 h-3.5 w-24 rounded-full bg-[#27272a] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#3f3f46] mr-1.5" />
                <div className="h-1 w-8 rounded-full bg-[#18181b]" />
              </div>

              <iframe
                src={`/review/${reviewToken}`}
                className="w-full h-[520px] rounded-[22px] border-0 bg-[var(--color-base)]"
                title={`Mobile Review Preview for ${client.name}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* FUNCTIONAL MODAL: NEW CONTENT PERSPECTIVE */}
      <NewContentModal
        engagements={modalEngagements}
        isOpen={showNewContentModal}
        onClose={() => setShowNewContentModal(false)}
      />

      {/* FUNCTIONAL MODAL: ADD CREDENTIAL */}
      <AddCredentialModal
        clientId={client.id}
        isOpen={showAddCredModal}
        onClose={() => setShowAddCredModal(false)}
      />

      {/* FUNCTIONAL MODAL: EDIT CREDENTIAL */}
      <EditCredentialModal
        credential={editingCred}
        isOpen={!!editingCred}
        onClose={() => setEditingCred(null)}
        onSuccess={() => showToast("Login credentials updated successfully.")}
      />

      {/* FUNCTIONAL MODAL: DELETE CREDENTIAL */}
      <DeleteCredentialModal
        credential={deletingCred}
        isOpen={!!deletingCred}
        onClose={() => setDeletingCred(null)}
        onSuccess={() => showToast("Login removed from vault.")}
      />

      {/* FUNCTIONAL MODAL: LOG SOFTWARE EXPENSE */}
      <LogExpenseModal
        clientId={client.id}
        engagements={client.engagements || []}
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
      />

      {/* FUNCTIONAL MODAL: EDIT VOICE & POSITIONING */}
      <EditVoiceModal
        clientId={client.id}
        isOpen={showEditVoiceModal}
        onClose={() => setShowEditVoiceModal(false)}
        initialContext={context}
        onSuccess={() => showToast("Voice & positioning parameters updated successfully.")}
      />

      {/* FUNCTIONAL MODAL: EDIT CLIENT PROFILE & COMMERCIAL TERMS */}
      <EditClientModal
        client={client}
        isOpen={showEditClientModal}
        onClose={() => setShowEditClientModal(false)}
        onSuccess={() => showToast("Client profile & commercial terms updated successfully.")}
      />
    </div>
  );
}
