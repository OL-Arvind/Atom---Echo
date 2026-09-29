"use client";

import React from "react";
import { ShieldCheck, Copy, Eye, EyeOff, Check } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import type { ReviewSharedCredential } from "./types";
import { isMeaningful } from "./types";

interface ReviewVaultTabProps {
  sharedCredentials: ReviewSharedCredential[];
  revealedPasswords: Record<string, string>;
  countdownTimers: Record<string, number>;
  copiedField: string | null;
  onCopyUsername: (cred: ReviewSharedCredential) => void;
  onRevealPassword: (credId: string) => void;
  onCopyPassword: (credId: string) => void;
}

export function ReviewVaultTab({
  sharedCredentials,
  revealedPasswords,
  countdownTimers,
  copiedField,
  onCopyUsername,
  onRevealPassword,
  onCopyPassword,
}: ReviewVaultTabProps) {
  return (
    <main className="mx-auto max-w-md px-3.5 pt-3 space-y-3.5">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--color-line-subtle)]">
        <span className="font-sans tabular-nums text-[10.5px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
          Shared Credential Vault
        </span>
        <span className="text-xs font-sans tabular-nums text-[var(--color-ink-secondary)]">
          {sharedCredentials.length} {sharedCredentials.length === 1 ? "Account" : "Accounts"}
        </span>
      </div>

      {sharedCredentials.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-secondary)]">
            <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-semibold text-[var(--color-ink)]">
              No Shared Logins
            </h2>
            <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
              Logins provisioned for your team will appear here for 1-tap access.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sharedCredentials.map((cred) => {
            const isRevealed = !!revealedPasswords[cred.id];
            const countdown = countdownTimers[cred.id] ?? 0;
            const isCopiedUser = copiedField === `user-${cred.id}`;
            const isCopiedPass = copiedField === `pass-${cred.id}`;

            return (
              <div
                key={cred.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 space-y-3 shadow-sm"
              >
                {/* Header: Platform & Shared Dot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BrandLogo
                      nameOrDomain={cred.platform}
                      size={28}
                      className="rounded-md object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-[var(--color-ink)] block truncate">
                        {cred.platform}
                      </span>
                      <span className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                        Shared Access
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                    <span>Ready</span>
                  </div>
                </div>

                {/* Username Field */}
                <div className="space-y-1">
                  <span className="text-[9.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                    Login / Username
                  </span>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between gap-2">
                    <span className="font-sans tabular-nums text-xs text-[var(--color-ink)] font-medium truncate select-all">
                      {cred.username_or_email}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCopyUsername(cred)}
                      className="btn btn-secondary text-xs h-7 px-2.5 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                      title="Copy username"
                    >
                      {isCopiedUser ? (
                        <>
                          <Check className="h-3 w-3 text-[var(--color-ok)]" />
                          <span className="text-[10px] font-medium text-[var(--color-ok)]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase tracking-wider block">
                      {isRevealed ? (
                        <span className="text-[var(--color-accent)] font-medium">
                          Auto-wipes in {countdown}s
                        </span>
                      ) : (
                        "Encrypted Password"
                      )}
                    </span>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between gap-2">
                    <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)] tracking-wider truncate select-all">
                      {isRevealed ? revealedPasswords[cred.id] : "••••••••••••••••"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRevealPassword(cred.id)}
                        className="btn btn-secondary text-xs h-7 px-2 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                        title={isRevealed ? "Hide" : "Reveal (30s)"}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="h-3 w-3 text-[var(--color-accent)]" />
                            <span className="text-[10px]">Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                            <span className="text-[10px]">Reveal</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyPassword(cred.id)}
                        className="btn btn-secondary text-xs h-7 px-2 shrink-0 flex items-center gap-1 active:scale-[0.97] transition-transform cursor-pointer"
                        title="Copy password"
                      >
                        {isCopiedPass ? (
                          <>
                            <Check className="h-3 w-3 text-[var(--color-ok)]" />
                            <span className="text-[10px] font-medium text-[var(--color-ok)]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2FA Method if meaningful */}
                {isMeaningful(cred.two_factor_method) && (
                  <div className="border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5 text-[11px] text-[var(--color-ink-secondary)] font-sans tabular-nums">
                    <span className="font-medium text-[var(--color-ink)]">2FA:</span>{" "}
                    {cred.two_factor_method}
                  </div>
                )}

                {/* Notes if meaningful */}
                {isMeaningful(cred.notes) && (
                  <div className="border-l-2 border-[var(--color-line-strong)] pl-2.5 py-0.5 text-[11px] text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-wrap">
                    {cred.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
