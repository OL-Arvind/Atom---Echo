"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowUpRight,
  Globe,
  Copy,
  Pencil,
  MoreHorizontal,
  FileCheck,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { ClientWithRelations } from "@/types/domain";

export type ClientWorkspaceTab =
  | "overview"
  | "context"
  | "meetings"
  | "documents"
  | "tools"
  | "vault"
  | "review";

export interface ClientWorkspaceMastheadProps {
  client: ClientWithRelations;
  hasEmergencyHold: boolean;
  totalRetainer: number;
  primaryServiceLabel: string;
  daysUntilInvoice: number;
  nextBillingFormatted: string;
  billingAnchorDay: number;
  clientPostsCount: number;
  reviewPendingCount: number;
  scheduledCount: number;
  draftCount: number;
  unbilledToolTotal: number;
  clientToolsCount: number;
  activeTab: ClientWorkspaceTab;
  onTabChange: (tab: ClientWorkspaceTab) => void;
  onCopyReviewLink: () => void;
  onOpenEditModal: () => void;
  onOpenWhatsApp: () => void;
  onDraftInvoice: () => void;
  onToggleHold: (shouldHold: boolean) => void;
  onOpenPauseConfirm: () => void;
  onOpenDeleteConfirm: () => void;
  isPending: boolean;
}

export function ClientWorkspaceMasthead({
  client,
  hasEmergencyHold,
  totalRetainer,
  primaryServiceLabel,
  daysUntilInvoice,
  nextBillingFormatted,
  billingAnchorDay,
  clientPostsCount,
  reviewPendingCount,
  scheduledCount,
  draftCount,
  unbilledToolTotal,
  clientToolsCount,
  activeTab,
  onTabChange,
  onCopyReviewLink,
  onOpenEditModal,
  onOpenWhatsApp,
  onDraftInvoice,
  onToggleHold,
  onOpenPauseConfirm,
  onOpenDeleteConfirm,
  isPending,
}: ClientWorkspaceMastheadProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMoreActions) return;
    const handleWindowClick = () => setShowMoreActions(false);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [showMoreActions]);

  const tabs = [
    { id: "overview", label: "Perspectives", count: clientPostsCount },
    { id: "context", label: "Voice & Edges", count: 0 },
    { id: "meetings", label: "Meetings", count: (client.meetings || []).length },
    { id: "documents", label: "Documents", count: (client.documents || []).length },
    { id: "tools", label: "Billing", count: (client.invoices || []).length + clientToolsCount },
    { id: "vault", label: "Vault", count: (client.credentials || []).length },
    { id: "review", label: "Review Portal", count: reviewPendingCount },
  ] as const;

  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* Band 1: Brand Identity + Primary Action Cluster */}
      <div className="px-5 py-5 lg:px-7 lg:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
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
                    onClick={onOpenWhatsApp}
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
            onClick={onCopyReviewLink}
            className="btn btn-secondary text-xs"
            title="Copy 1-tap Founder Desk link"
          >
            <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>Copy Review Link</span>
          </button>

          <button
            onClick={onOpenEditModal}
            className="btn btn-secondary text-xs"
            title="Edit client profile and retainer terms"
          >
            <Pencil className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>Edit Details</span>
          </button>

          <button
            onClick={onOpenWhatsApp}
            className="btn btn-secondary text-xs"
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
              aria-label="More operational actions"
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
                  onClick={() => { setShowMoreActions(false); onDraftInvoice(); }}
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
                      onToggleHold(false);
                    } else {
                      onOpenPauseConfirm();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors text-left cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>{hasEmergencyHold ? "Resume Publishing" : "Emergency Pause"}</span>
                </button>

                <div className="h-[1px] bg-[var(--color-line-subtle)] my-1" />

                <button
                  onClick={() => { setShowMoreActions(false); onOpenDeleteConfirm(); }}
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
        <div className="px-5 py-4 lg:px-7">
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

        <div className="px-5 py-4 lg:px-7">
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

        <div className="px-5 py-4 lg:px-7">
          <span className="block text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium mb-1.5">
            Editorial Cadence
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-ink)] leading-none">
              {clientPostsCount}
            </span>
            <span className="text-xs font-sans text-[var(--color-ink-muted)]">
              {clientPostsCount === 1 ? "perspective" : "perspectives"}
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

        <div className="px-5 py-4 lg:px-7">
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
            {clientToolsCount} {clientToolsCount === 1 ? "active tool seat" : "active tool seats"} · Zero markup
          </span>
        </div>
      </div>

      {/* Band 3: Integrated Workspace Tab Navigation */}
      <div className="px-5 lg:px-7 border-t border-[var(--color-line-subtle)] bg-[var(--color-surface)] flex items-center gap-7 overflow-x-auto overflow-y-hidden no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as ClientWorkspaceTab)}
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
  );
}
