"use client";

import { useState } from "react";
import { Shield, Plus, Lock, Eye, EyeOff, Copy, Pencil, Trash2, Check } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import type { ClientCredential } from "@/types/domain";

interface ClientCredentialsTabProps {
  credentials: ClientCredential[];
  revealedPasswords: Record<string, string>;
  countdownTimers: Record<string, number>;
  onRevealPassword: (credId: string) => void;
  onCopyPassword: (credId: string) => void;
  onOpenAddCredModal: () => void;
  onEditCredential?: (cred: ClientCredential) => void;
  onDeleteCredential?: (cred: ClientCredential) => void;
}

function isMeaningful(val?: string | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return !["na", "n/a", "none", "-", "null", "undefined"].includes(lower);
}

export function ClientCredentialsTab({
  credentials,
  revealedPasswords,
  countdownTimers,
  onRevealPassword,
  onCopyPassword,
  onOpenAddCredModal,
  onEditCredential,
  onDeleteCredential,
}: ClientCredentialsTabProps) {
  const [filter, setFilter] = useState<"all" | "client_shared" | "agency_only">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (credId: string) => {
    onCopyPassword(credId);
    setCopiedId(credId);
    setTimeout(() => {
      setCopiedId((prev) => (prev === credId ? null : prev));
    }, 2000);
  };

  const sharedCount = credentials.filter((c) => c.access_scope === "client_shared").length;
  const internalCount = credentials.filter((c) => c.access_scope === "agency_only" || !c.access_scope).length;

  const filteredCredentials = credentials.filter((cred) => {
    if (filter === "all") return true;
    if (filter === "client_shared") return cred.access_scope === "client_shared";
    return cred.access_scope === "agency_only" || !cred.access_scope;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Credential Vault
          </h2>
          <span className="text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            &middot; {credentials.length} {credentials.length === 1 ? "login" : "logins"}
          </span>
        </div>
        <button
          onClick={onOpenAddCredModal}
          className="btn btn-primary text-xs shrink-0 self-start sm:self-auto cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Login</span>
        </button>
      </div>

      {/* Scope Filter Tabs */}
      {credentials.length > 0 && (
        <SegmentedFilter
          options={[
            { id: "all", label: "All", count: credentials.length },
            {
              id: "client_shared",
              label: "Shared with Client",
              count: sharedCount,
              dotColor: "bg-[var(--color-accent)]",
            },
            {
              id: "agency_only",
              label: "Agency Internal",
              count: internalCount,
              dotColor: "bg-[var(--color-ink-muted)]",
            },
          ]}
          value={filter}
          onChange={setFilter}
        />
      )}

      {credentials.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-8 text-center space-y-2">
          <p className="text-xs text-[var(--color-ink-tertiary)]">No credentials stored yet.</p>
          <button
            onClick={onOpenAddCredModal}
            className="btn btn-secondary text-xs cursor-pointer active:scale-[0.98]"
          >
            Add First Login
          </button>
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]/30 p-6 text-center text-xs text-[var(--color-ink-tertiary)]">
          No credentials found under this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredCredentials.map((cred) => {
            const isRevealed = !!revealedPasswords[cred.id];
            const countdown = countdownTimers[cred.id] ?? 0;
            const isShared = cred.access_scope === "client_shared";

            return (
              <div
                key={cred.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 space-y-2.5 shadow-sm"
              >
                {/* Header: Platform, Scope Indicator & Edit/Delete Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BrandLogo
                      nameOrDomain={cred.platform}
                      size={26}
                      className="rounded-md object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-[var(--color-ink)] block truncate">
                        {cred.platform}
                      </span>
                      <span className="text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums truncate block">
                        {cred.username_or_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Quiet Scope Dot */}
                    <div className="flex items-center gap-1 text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)] mr-1">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isShared ? "bg-[var(--color-accent)]" : "bg-[var(--color-ink-muted)]"
                        }`}
                      />
                      <span>{isShared ? "Client" : "Internal"}</span>
                    </div>

                    {/* Edit Button */}
                    {onEditCredential && (
                      <button
                        onClick={() => onEditCredential(cred)}
                        className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer active:scale-[0.95]"
                        title="Edit login"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {onDeleteCredential && (
                      <button
                        onClick={() => onDeleteCredential(cred)}
                        className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] transition-colors cursor-pointer active:scale-[0.95]"
                        title="Delete login"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Box with Masking & Auto-wipe */}
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] px-2.5 py-1.5 border border-[var(--color-line)] flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                      {isRevealed ? `Wipes in ${countdown}s` : "Password"}
                    </span>
                    <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)] tracking-wider truncate block">
                      {isRevealed ? revealedPasswords[cred.id] : "••••••••••••••••"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRevealPassword(cred.id)}
                      className="h-7 w-7 rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] flex items-center justify-center transition-all cursor-pointer active:scale-[0.95] shrink-0"
                      title={isRevealed ? "Hide password" : "Reveal password (30s)"}
                    >
                      {isRevealed ? (
                        <EyeOff className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(cred.id)}
                      className="h-7 w-7 rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] flex items-center justify-center transition-all cursor-pointer active:scale-[0.95] shrink-0"
                      title="Copy password"
                    >
                      {copiedId === cred.id ? (
                        <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2FA Method if meaningful */}
                {isMeaningful(cred.two_factor_method) && (
                  <div className="text-[11px] text-[var(--color-ink-secondary)] font-sans tabular-nums">
                    <span className="font-medium text-[var(--color-ink)]">2FA:</span>{" "}
                    {cred.two_factor_method}
                  </div>
                )}

                {/* Notes if meaningful and not "NA" */}
                {isMeaningful(cred.notes) && (
                  <div className="border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5 text-[11px] text-[var(--color-ink-secondary)] leading-relaxed">
                    {cred.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
