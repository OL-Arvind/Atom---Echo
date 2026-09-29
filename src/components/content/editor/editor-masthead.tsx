"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Copy,
  ExternalLink,
  Check,
  Globe,
  RotateCcw,
  History,
} from "lucide-react";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { PIPELINE_STEPS } from "./types";

export interface EditorMastheadProps {
  originMeta: {
    backHref: string;
    backLabel: string;
  };
  saveState: "saved" | "saving" | "unsaved";
  isNew: boolean;
  currentPostId: string | null;
  client: {
    id?: string;
    name?: string;
    website_url?: string;
    founder_email?: string;
    founder_name?: string;
    founder_title?: string;
    linkedin_url?: string;
  } | null | undefined;
  bodyMarkdown: string;
  copiedBody: boolean;
  onCopyBody: () => void;
  isPending: boolean;
  isSnapshotting: boolean;
  latestVersionNumber: number;
  onSnapshotVersion: () => void;
  onSaveDraft: () => void;
  status: string;
  hasClientRevision: boolean;
  onStatusTransition: (newStatus: string) => void;
  onToggleQaReturnInput: () => void;
  copiedLink: boolean;
  onCopyReviewLink: () => void;
  onOpenWhatsApp: () => void;
  onOpenPublishModal: () => void;
  linkedinPostUrl?: string;
  flaggedWordsCount: number;
  tabooWordsCount: number;
}

export function EditorMasthead({
  originMeta,
  saveState,
  isNew,
  currentPostId,
  client,
  bodyMarkdown,
  copiedBody,
  onCopyBody,
  isPending,
  isSnapshotting,
  latestVersionNumber,
  onSnapshotVersion,
  onSaveDraft,
  status,
  hasClientRevision,
  onStatusTransition,
  onToggleQaReturnInput,
  copiedLink,
  onCopyReviewLink,
  onOpenWhatsApp,
  onOpenPublishModal,
  linkedinPostUrl,
  flaggedWordsCount,
  tabooWordsCount,
}: EditorMastheadProps) {
  const hasMinChars = bodyMarkdown.trim().length >= 10;

  return (
    <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* Band 1: Breadcrumb, Perspective Identity & Stage Actions */}
      <div className="px-5 py-4 lg:px-7 lg:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href={originMeta.backHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors group cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>{originMeta.backLabel}</span>
            </Link>
            <span className="text-[var(--color-line-strong)]">·</span>
            <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
              {saveState === "saving"
                ? "Saving changes..."
                : saveState === "unsaved"
                ? "Unsaved edits (Cmd+S)"
                : "All changes saved"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-[22px] font-semibold tracking-tight text-[var(--color-ink)] leading-none">
              {isNew && !currentPostId ? "New Perspective" : "Perspective Studio"}
            </h1>
            <span className="text-[var(--color-line-strong)]">·</span>
            {client?.id ? (
              <Link
                href={`/clients/${client.id}`}
                className="inline-flex items-center gap-2 hover:opacity-85 transition-opacity group cursor-pointer"
                title={`Open ${client.name} client dossier`}
              >
                <BrandLogo
                  nameOrDomain={client?.website_url || client?.founder_email || client?.name || "Client"}
                  size={18}
                  className="rounded-[4px]"
                />
                <span className="text-sm font-medium text-[var(--color-ink)] group-hover:underline decoration-[var(--color-line-strong)] underline-offset-4">
                  {client.name}
                </span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2">
                <BrandLogo
                  nameOrDomain={client?.website_url || client?.founder_email || client?.name || "Client"}
                  size={18}
                  className="rounded-[4px]"
                />
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {client?.name || "Select Account"}
                </span>
              </div>
            )}
            {client?.founder_name && (
              <span className="text-xs text-[var(--color-ink-tertiary)] inline-flex items-center gap-1">
                ({client.founder_name})
                {client?.linkedin_url && (
                  <a
                    href={client.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-ink-tertiary)] hover:text-[#0A66C2] transition-colors ml-0.5 inline-flex items-center"
                    title={`Open ${client.founder_name}'s LinkedIn profile`}
                  >
                    <LinkedInIcon size={14} color="brand" />
                  </a>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Controls: Context-Aware Stage Progression */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Post Copy Utility */}
          {bodyMarkdown.trim().length > 0 && (
            <button
              type="button"
              onClick={onCopyBody}
              className="btn btn-ghost text-xs border border-[var(--color-line)] cursor-pointer"
              title="Copy clean post text"
            >
              {copiedBody ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                  <span>Copied Text</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Snapshot Version Checkpoint Button */}
          {currentPostId && (
            <button
              type="button"
              onClick={onSnapshotVersion}
              disabled={isPending || isSnapshotting || !hasMinChars}
              className="btn btn-ghost text-xs border border-[var(--color-line)] cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              title="Save a numbered version checkpoint in history"
            >
              <History className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
              <span>
                {isSnapshotting ? "Snapshotting..." : `Snapshot · v${latestVersionNumber}`}
              </span>
            </button>
          )}

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isPending || !hasMinChars}
            className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
            <span>{isPending && saveState === "saving" ? "Saving..." : "Save Draft"}</span>
          </button>

          {/* STAGE 1: DRAFT ACTIONS */}
          {status === "draft" && (
            <>
              {hasClientRevision ? (
                <>
                  <button
                    type="button"
                    onClick={() => onStatusTransition("internal_review")}
                    disabled={isPending || !hasMinChars}
                    className="btn btn-secondary text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Send to QA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusTransition("client_review")}
                    disabled={isPending || !hasMinChars}
                    className="btn btn-accent text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Re-send to Founder Desk ↗</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onStatusTransition("internal_review")}
                    disabled={isPending || !hasMinChars}
                    className="btn btn-primary text-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>Send to Editorial QA →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusTransition("client_review")}
                    disabled={isPending || !hasMinChars}
                    className="btn btn-secondary text-xs cursor-pointer disabled:opacity-50"
                    title="Skip internal QA and dispatch directly to Founder Desk"
                  >
                    <span>Send to Founder Desk ↗</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* STAGE 2: INTERNAL QA ACTIONS */}
          {status === "internal_review" && (
            <>
              {currentPostId && (
                <button
                  type="button"
                  onClick={onToggleQaReturnInput}
                  disabled={isPending}
                  className="btn btn-secondary text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                  <span>Return to Draft</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onStatusTransition("client_review")}
                disabled={isPending || !hasMinChars}
                className="btn btn-accent text-xs cursor-pointer disabled:opacity-50"
              >
                <span>Approve QA · Send to Founder Desk ↗</span>
              </button>
            </>
          )}

          {/* STAGE 3: FOUNDER DESK (CLIENT REVIEW) ACTIONS */}
          {status === "client_review" && (
            <>
              <button
                type="button"
                onClick={onCopyReviewLink}
                className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    <span>Copy Review Link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="btn btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <WhatsAppIcon size={13} className="text-[#25D366]" />
                <span>Ping Founder</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusTransition("approved")}
                disabled={isPending}
                className="btn btn-primary text-xs cursor-pointer"
              >
                <span>Mark Approved →</span>
              </button>
            </>
          )}

          {/* STAGE 4: APPROVED ACTIONS */}
          {status === "approved" && (
            <button
              type="button"
              onClick={() => onStatusTransition("scheduled")}
              disabled={isPending}
              className="btn btn-primary text-xs cursor-pointer"
            >
              <span>Lock Publishing Slot →</span>
            </button>
          )}

          {/* STAGE 5: SCHEDULED ACTIONS */}
          {status === "scheduled" && (
            <button
              type="button"
              onClick={onOpenPublishModal}
              disabled={isPending}
              className="btn btn-accent text-xs cursor-pointer"
            >
              <span>Mark as Published ↗</span>
            </button>
          )}

          {/* STAGE 6: PUBLISHED */}
          {status === "published" &&
            (linkedinPostUrl ? (
              <a
                href={linkedinPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                <span>Live on LinkedIn</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpenPublishModal}
                className="btn btn-secondary text-xs cursor-pointer"
              >
                <span>Add Live LinkedIn URL</span>
              </button>
            ))}
        </div>
      </div>

      {/* Band 2: Integrated 5-Stage Pipeline Stepper & Taboo Guardrail Bar */}
      <div className="px-5 py-2.5 lg:px-7 border-t border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/35 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          {PIPELINE_STEPS.map((step, idx) => {
            const normalizedStatus = status === "approved" ? "scheduled" : status;
            const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === normalizedStatus);
            const isActive = step.id === normalizedStatus;
            const isCompleted = currentIdx > idx;

            return (
              <div key={step.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!currentPostId && step.id !== "draft"}
                  onClick={() => {
                    if (step.id !== status && currentPostId) {
                      onStatusTransition(step.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-xs)] text-[10.5px] font-sans tabular-nums uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-semibold border border-[var(--color-line-strong)] shadow-2xs"
                      : isCompleted
                      ? "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
                  }`}
                  title={`Transition stage to ${step.label}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive
                        ? "bg-[var(--color-accent)]"
                        : isCompleted
                        ? "bg-[var(--color-ok)]"
                        : "bg-[var(--color-ink-ghost)]"
                    }`}
                  />
                  <span>{step.label}</span>
                </button>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <span className="text-[var(--color-line-strong)] text-xs select-none">/</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Taboo Guardrail Status Summary */}
        <div className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)] shrink-0">
          {flaggedWordsCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
              <span>0 taboo terms ({tabooWordsCount} guarded)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-danger-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
              <span>{flaggedWordsCount} taboo term(s) flagged</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
