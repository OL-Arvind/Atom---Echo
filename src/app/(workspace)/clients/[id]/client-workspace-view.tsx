"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  Shield,
  FileText,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  MessageCircle,
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
import { LogExpenseModal } from "@/components/clients/log-expense-modal";
import { EditVoiceModal } from "@/components/clients/edit-voice-modal";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface ClientWorkspaceViewProps {
  client: any;
}

export function ClientWorkspaceView({ client }: ClientWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "context" | "tools" | "vault" | "review">("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Taboo words state
  const [newTabooWord, setNewTabooWord] = useState("");

  // Credential vault state: map credentialId -> revealed plaintext
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({});
  
  // Modals & Menu State
  const [showAddCredModal, setShowAddCredModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditVoiceModal, setShowEditVoiceModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const clientPosts = client.content_items || [];
  const clientTools = client.tool_expenses || [];
  const credentials = client.credentials || [];
  const context = client.context || null;
  const reviewToken = client.review_tokens?.[0]?.token_hash || null;
  const reviewUrl = reviewToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/review/${reviewToken}` : `/review/${reviewToken}`)
    : null;

  const totalRetainer = (client.engagements || []).reduce(
    (acc: number, e: any) => acc + Number(e.monthly_retainer || 0),
    0
  );

  const primaryEngagement = client.engagements?.[0] || null;
  const billingAnchorDay = primaryEngagement?.billing_anchor_day || 5;

  const unbilledToolTotal = clientTools
    .filter((t: any) => t.status !== "invoiced" && t.status !== "paid")
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  // Check if an emergency hold is active
  const hasEmergencyHold =
    client.status?.toLowerCase() === "paused" ||
    (client.client_requests || []).some(
      (r: any) => r.category === "emergency_hold" && (r.status === "submitted" || r.status === "in_progress")
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

  const reviewPendingCount = clientPosts.filter((p: any) => p.status === "client_review").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
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
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--color-danger-line)] shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[var(--color-ink)]">
                  Delete {client.name}?
                </h2>
                <p className="text-xs text-[var(--color-ink-tertiary)]">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)]">
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
                className="btn text-xs bg-[var(--color-danger)] text-white hover:opacity-90 border-0"
              >
                {isPending ? "Deleting…" : "Delete Permanently"}
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

      {/* ─── 1. TOP UTILITY & ACTION BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors w-fit"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Clients</span>
          <span className="text-[var(--color-ink-muted)]">/</span>
          <span className="text-[var(--color-ink)] font-medium">{client.name}</span>
        </Link>

        {/* Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Dominant Primary Action */}
          <button
            onClick={openFounderWhatsApp}
            className="btn btn-primary text-xs"
            title="Open WhatsApp with client review link"
          >
            <WhatsAppIcon size={14} className="text-[#25D366]" />
            <span>Message on WhatsApp</span>
          </button>

          {/* Quick Copy Link */}
          <button
            onClick={handleCopyReviewLink}
            className="btn btn-secondary text-xs"
            title="Copy zero-login review portal link"
          >
            <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span className="hidden sm:inline">Copy Link</span>
          </button>

          {/* Draft Invoice */}
          <button
            onClick={handleDraftInvoice}
            disabled={isPending}
            className="btn btn-secondary text-xs"
            title="Generate a draft invoice combining retainer and tool expenses"
          >
            <FileCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span className="hidden sm:inline">Draft Invoice</span>
          </button>

          {/* Overflow Menu for Quiet & Destructive Actions */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreActions(!showMoreActions);
              }}
              className="btn btn-secondary text-xs p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMoreActions && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-48 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] py-1 shadow-lifted z-20"
              >
                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    handleToggleEmergencyHold(!hasEmergencyHold);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>{hasEmergencyHold ? "Resume Publishing" : "Pause All Posts"}</span>
                </button>
                <div className="h-[1px] bg-[var(--color-line-subtle)] my-1" />
                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger-text)]" />
                  <span>Delete Client</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. ENTITY HEADER & TELEMETRY SHELF ─── */}
      <div className="border-b border-[var(--color-line)] pb-6 space-y-5">
        {/* Main Entity Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo
              nameOrDomain={client.website || client.founder_email || client.name}
              size={48}
              className="h-12 w-12 rounded-[var(--radius-md)] border border-[var(--color-line)] p-1 bg-white shadow-xs"
              fallback={
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-ink)] text-white text-base font-medium shrink-0 tracking-wide">
                  {founderInitials}
                </div>
              }
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
                  {client.name}
                </h1>
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-secondary)]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      hasEmergencyHold ? "bg-[var(--color-warn)]" : "bg-[var(--color-ok)]"
                    }`}
                  />
                  <span className="font-mono text-[11px] text-[var(--color-ink-muted)] uppercase">
                    {hasEmergencyHold ? "Paused" : client.status || "Active"}
                  </span>
                </span>
              </div>

              {/* Founder Context Chips */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-[var(--color-ink-secondary)]">
                <span>
                  Founder: <strong className="font-medium text-[var(--color-ink)]">{client.founder_name}</strong>
                  {client.founder_title && (
                    <span className="text-[var(--color-ink-tertiary)]"> ({client.founder_title})</span>
                  )}
                </span>
                {client.founder_email && (
                  <>
                    <span className="text-[var(--color-ink-muted)]">·</span>
                    <a
                      href={`mailto:${client.founder_email}`}
                      className="inline-flex items-center gap-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors font-mono text-[11.5px]"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{client.founder_email}</span>
                    </a>
                  </>
                )}
                {client.founder_phone && (
                  <>
                    <span className="text-[var(--color-ink-muted)]">·</span>
                    <button
                      type="button"
                      onClick={openFounderWhatsApp}
                      className="inline-flex items-center gap-1.5 text-[var(--color-ink-tertiary)] hover:text-[#25D366] transition-colors font-mono text-[11.5px] cursor-pointer"
                      title="Open WhatsApp chat with review link"
                    >
                      <WhatsAppIcon size={13} className="text-[#25D366]" />
                      <span>{client.founder_phone}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Commercial & Operational Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Monthly Retainer
            </span>
            <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
              ₹{totalRetainer.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">/ mo</span>
            </div>
          </div>

          <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Billing Anchor
            </span>
            <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
              Day {billingAnchorDay}{" "}
              <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">of month</span>
            </div>
          </div>

          <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Content Pipeline
            </span>
            <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5 flex items-baseline gap-2">
              <span>{clientPosts.length} posts</span>
              {reviewPendingCount > 0 && (
                <span className="text-[10px] font-mono text-[var(--color-warn-text)] bg-[var(--color-warn-bg)] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-warn-line)]">
                  {reviewPendingCount} in review
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block">
              Unbilled Software
            </span>
            <div className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums mt-0.5">
              ₹{unbilledToolTotal.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">
                ({clientTools.length} tools)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. PAGE-LEVEL TAB NAVIGATION (FLUID CONTROLLER) ─── */}
      <div className="flex border-b border-[var(--color-line)] gap-7 overflow-x-auto overflow-y-hidden no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Overview &amp; Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("context")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "context"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Voice &amp; Positioning</span>
        </button>

        <button
          onClick={() => setActiveTab("tools")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "tools"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Software Expenses ({clientTools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "vault"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Credential Vault ({credentials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("review")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "review"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Client Review Link</span>
        </button>
      </div>

      {/* ─── 4. TAB PANELS ─── */}

      {/* TAB 1: OVERVIEW & PIPELINE (ASYMMETRIC 65/35 COCKPIT) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Content Operations Pipeline (65%) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Content Operations Stream
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  Active drafts, posts awaiting client approval, and scheduled publications.
                </p>
              </div>

              <Link
                href="/content"
                className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Post</span>
              </Link>
            </div>

            {clientPosts.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 p-8 text-center space-y-3">
                <FileText className="h-7 w-7 text-[var(--color-ink-muted)] mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <p className="text-xs font-medium text-[var(--color-ink)]">No content drafted yet</p>
                  <p className="text-[11.5px] text-[var(--color-ink-tertiary)]">
                    Create founder thought leadership posts in the Content Studio to send for WhatsApp review.
                  </p>
                </div>
                <Link
                  href="/content"
                  className="btn btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Draft First Post</span>
                </Link>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)]">
                {clientPosts.map((post: any) => {
                  const isReview = post.status === "client_review";
                  const isApproved = post.status === "approved" || post.status === "scheduled";
                  const isPaused = post.status === "paused";

                  return (
                    <div
                      key={post.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[var(--color-ink)] truncate">
                            {post.title}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs shrink-0">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isPaused
                                  ? "bg-[var(--color-danger)]"
                                  : isReview
                                  ? "bg-[var(--color-warn)]"
                                  : isApproved
                                  ? "bg-[var(--color-ok)]"
                                  : "bg-[var(--color-ink-muted)]"
                              }`}
                            />
                            <span className="font-mono text-[10.5px] uppercase text-[var(--color-ink-muted)]">
                              {post.status?.replace("_", " ")}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-1">
                          {post.body_markdown}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isReview && (
                          <button
                            onClick={handleCopyReviewLink}
                            className="btn btn-secondary text-[11px] py-1 px-2.5"
                            title="Copy private review link"
                          >
                            <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                            <span>Copy Review Link</span>
                          </button>
                        )}
                        <span className="font-mono text-[11px] text-[var(--color-ink-tertiary)] bg-[var(--color-base-subtle)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-line)]">
                          {post.target_pillar || "Thought Leadership"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Commercial Line & Actions (35%) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Contracted Services
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                Active commercial engagements and billing terms.
              </p>
            </div>

            <div className="space-y-3">
              {(client.engagements || []).map((eng: any) => (
                <div
                  key={eng.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs text-[var(--color-ink)]">
                      {eng.service_type === "linkedin_branding"
                        ? "LinkedIn Founder Branding"
                        : eng.service_type === "cold_outreach"
                        ? "Cold Outbound Outreach"
                        : "Hybrid Growth Engine"}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-[var(--color-ok-text)] bg-[var(--color-ok-bg)] px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-[var(--color-ok-line)]">
                      {eng.status}
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--color-line-subtle)] text-xs">
                    <div className="flex items-center justify-between py-1.5 text-[var(--color-ink-secondary)]">
                      <span>Monthly Retainer</span>
                      <span className="font-mono font-medium text-[var(--color-ink)]">
                        ₹{Number(eng.monthly_retainer || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-[var(--color-ink-secondary)]">
                      <span>Billing Anchor</span>
                      <span className="font-mono text-[var(--color-ink)]">
                        Day {eng.billing_anchor_day} of month
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick WhatsApp Review Dispatch Widget */}
              <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-semibold text-[var(--color-ink)]">
                    Review Portal Gateway
                  </span>
                </div>
                <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
                  Send private zero-login links directly to {client.founder_name} on WhatsApp for 1-click approvals.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={openFounderWhatsApp}
                    className="btn btn-primary text-xs w-full justify-center"
                  >
                    <WhatsAppIcon size={14} className="text-[#25D366]" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VOICE & WORDS TO AVOID */}
      {activeTab === "context" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Brand Voice &amp; Target Audience
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  Foundational tone and positioning parameters used when generating content for this founder.
                </p>
              </div>
              <button
                onClick={() => setShowEditVoiceModal(true)}
                className="btn btn-secondary text-xs shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Edit Voice &amp; Pillars</span>
              </button>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4">
              {/* Positioning Statement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                    Positioning Statement
                  </span>
                  <button
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-[10.5px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {context?.positioning_statement ? (
                  <p className="text-xs leading-relaxed text-[var(--color-ink)] bg-[var(--color-base-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] whitespace-pre-wrap">
                    {context.positioning_statement}
                  </p>
                ) : (
                  <div
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs leading-relaxed text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)]/60 p-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] cursor-pointer hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-secondary)] transition-all flex items-center justify-between"
                  >
                    <span>No positioning statement configured yet. Click to add.</span>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-60" />
                  </div>
                )}
              </div>

              {/* Target Audience / ICP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                    Target Audience / ICP
                  </span>
                  <button
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-[10.5px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {context?.target_audience_icp ? (
                  <p className="text-xs leading-relaxed text-[var(--color-ink)] bg-[var(--color-base-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] whitespace-pre-wrap">
                    {context.target_audience_icp}
                  </p>
                ) : (
                  <div
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs leading-relaxed text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)]/60 p-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] cursor-pointer hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-secondary)] transition-all flex items-center justify-between"
                  >
                    <span>No target audience or ICP defined yet. Click to add.</span>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-60" />
                  </div>
                )}
              </div>

              {/* Tone Archetype */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                    Tone Archetype
                  </span>
                  <button
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-[10.5px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {context?.tone_archetype ? (
                  <p className="text-xs leading-relaxed text-[var(--color-ink)] bg-[var(--color-base-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] font-medium">
                    {context.tone_archetype}
                  </p>
                ) : (
                  <div
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs leading-relaxed text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)]/60 p-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] cursor-pointer hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-secondary)] transition-all flex items-center justify-between"
                  >
                    <span>No tone archetype defined yet. Click to add.</span>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-60" />
                  </div>
                )}
              </div>

              {/* Voice Guidelines & Nuances */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                    Voice Guidelines &amp; Nuances
                  </span>
                  <button
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-[10.5px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {context?.voice_guidelines ? (
                  <p className="text-xs leading-relaxed text-[var(--color-ink)] bg-[var(--color-base-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] whitespace-pre-wrap">
                    {context.voice_guidelines}
                  </p>
                ) : (
                  <div
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs leading-relaxed text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)]/60 p-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] cursor-pointer hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-secondary)] transition-all flex items-center justify-between"
                  >
                    <span>No specific voice guidelines defined yet. Click to add.</span>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-60" />
                  </div>
                )}
              </div>

              {/* Core Content Pillars */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                    Core Content Pillars
                  </span>
                  <button
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-[10.5px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                {context?.core_pillars && context.core_pillars.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 bg-[var(--color-base-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-line)]">
                    {context.core_pillars.map((pillar: string) => (
                      <span
                        key={pillar}
                        className="inline-flex items-center rounded-[var(--radius-xs)] bg-[var(--color-surface)] border border-[var(--color-line-strong)] text-[var(--color-ink)] px-2.5 py-1 text-xs font-mono font-medium"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => setShowEditVoiceModal(true)}
                    className="text-xs leading-relaxed text-[var(--color-ink-muted)] bg-[var(--color-base-subtle)]/60 p-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-line)] cursor-pointer hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-secondary)] transition-all flex items-center justify-between"
                  >
                    <span>No core pillars configured yet. Click to add themes.</span>
                    <Sparkles className="h-3 w-3 shrink-0 opacity-60" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Words to Avoid (Negative Guardrails) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Words to Avoid
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                Negative guardrails. These words will never be drafted into posts.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3.5">
              <div className="flex flex-wrap gap-2 min-h-[48px]">
                {(!context?.taboo_words || context.taboo_words.length === 0) ? (
                  <span className="text-xs text-[var(--color-ink-muted)] font-mono py-1">
                    No taboo words configured.
                  </span>
                ) : (
                  context.taboo_words.map((w: string) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line-strong)] text-[var(--color-ink)] px-2 py-1 text-xs font-mono"
                    >
                      <span className="line-through text-[var(--color-ink-tertiary)]">{w}</span>
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
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-line-subtle)]">
                <input
                  type="text"
                  value={newTabooWord}
                  onChange={(e) => setNewTabooWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTabooWord()}
                  placeholder="Add a phrase to avoid (e.g. synergy)..."
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

      {/* TAB 3: SOFTWARE EXPENSES */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Pass-Through Tool Expenses
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                Software licenses and tools (Clay, Instantly, HeyReach, proxies) incurred on behalf of this client.
              </p>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="btn btn-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Expense</span>
            </button>
          </div>

          {clientTools.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 p-8 text-center space-y-2">
              <p className="text-xs text-[var(--color-ink-tertiary)]">Zero software expenses logged.</p>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="btn btn-secondary text-xs"
              >
                Log First Expense
              </button>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
              <div className="divide-y divide-[var(--color-line-subtle)]">
                {clientTools.map((tool: any) => (
                  <div
                    key={tool.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BrandLogo
                        nameOrDomain={tool.tool_name || tool.description}
                        size={28}
                        className="rounded-md border border-[var(--color-line)] p-0.5"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-medium text-[var(--color-ink)] block truncate">
                          {tool.description}
                        </span>
                        <span className="text-[var(--color-ink-tertiary)] text-[11px] font-mono">
                          Date: {tool.incurred_date} · Tool: {tool.tool_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-medium text-[var(--color-ink)] block tabular-nums">
                        ₹{Number(tool.amount).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10.5px] font-mono uppercase text-[var(--color-ink-muted)]">
                        {tool.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CREDENTIAL VAULT */}
      {activeTab === "vault" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  AES-256-GCM Credential Vault
                </h2>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                Encrypted at rest. Passwords auto-mask after 30 seconds. Every reveal is audited.
              </p>
            </div>
            <button
              onClick={() => setShowAddCredModal(true)}
              className="btn btn-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Login</span>
            </button>
          </div>

          {credentials.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 p-8 text-center space-y-2">
              <p className="text-xs text-[var(--color-ink-tertiary)]">No credentials stored in this client's vault yet.</p>
              <button
                onClick={() => setShowAddCredModal(true)}
                className="btn btn-secondary text-xs"
              >
                Add Login
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {credentials.map((cred: any) => {
                const isRevealed = !!revealedPasswords[cred.id];
                const countdown = countdownTimers[cred.id] ?? 0;

                return (
                  <div
                    key={cred.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BrandLogo
                          nameOrDomain={cred.platform}
                          size={28}
                          className="rounded-md border border-[var(--color-line)] p-0.5 shadow-xs"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[var(--color-ink)] block truncate">
                            {cred.platform}
                          </span>
                          <span className="text-[11.5px] text-[var(--color-ink-tertiary)] font-mono truncate block">
                            {cred.username_or_email}
                          </span>
                        </div>
                      </div>
                      <Lock className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    </div>

                    {/* Password Field with Masking & 30s Auto-wipe */}
                    <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] font-mono text-[var(--color-ink-tertiary)] uppercase block">
                          {isRevealed ? `Wipes in ${countdown}s` : "Encrypted Password"}
                        </span>
                        <span className="font-mono text-xs font-semibold text-[var(--color-ink)] tracking-wider">
                          {isRevealed ? revealedPasswords[cred.id] : "••••••••••••••••"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRevealPassword(cred.id)}
                          className="btn btn-secondary text-xs p-1.5"
                          title={isRevealed ? "Hide" : "Reveal (30s)"}
                        >
                          {isRevealed ? (
                            <EyeOff className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyPassword(cred.id)}
                          className="btn btn-secondary text-xs p-1.5"
                          title="Copy password"
                        >
                          <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                        </button>
                      </div>
                    </div>

                    {cred.two_factor_method && (
                      <div className="text-[11px] text-[var(--color-ink-secondary)]">
                        <span className="font-medium text-[var(--color-ink)]">2FA:</span>{" "}
                        {cred.two_factor_method}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CLIENT REVIEW PORTAL */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Zero-Login Review Gateway
                </h2>
              </div>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                Private, tokenized mobile review portal for {client.founder_name}.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                  Private Review URL
                </span>
                <div className="font-mono text-xs text-[var(--color-ink)] break-all select-all bg-[var(--color-base-subtle)] p-2.5 rounded-[var(--radius-xs)] border border-[var(--color-line)]">
                  {reviewUrl || "No review link generated yet"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReviewLink}
                  className="btn btn-secondary text-xs flex-1 justify-center"
                >
                  <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Copy Link</span>
                </button>
                {reviewUrl && (
                  <Link
                    href={`/review/${reviewToken}`}
                    target="_blank"
                    className="btn btn-secondary text-xs flex-1 justify-center inline-flex items-center gap-1.5"
                  >
                    <span>Open Tab</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              <button
                onClick={openFounderWhatsApp}
                className="btn btn-primary text-xs w-full justify-center"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Share via WhatsApp</span>
              </button>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-4 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block font-medium">
                Review Queue
              </span>
              <div className="font-display text-xl font-normal text-[var(--color-ink)] tabular-nums">
                {reviewPendingCount}{" "}
                <span className="text-xs font-normal text-[var(--color-ink-tertiary)] font-sans">
                  posts awaiting review
                </span>
              </div>
              <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
                When content is moved to &apos;Client Review&apos;, it immediately appears on the founder&apos;s phone.
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

      {/* FUNCTIONAL MODAL: ADD CREDENTIAL */}
      <AddCredentialModal
        clientId={client.id}
        isOpen={showAddCredModal}
        onClose={() => setShowAddCredModal(false)}
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
    </div>
  );
}
