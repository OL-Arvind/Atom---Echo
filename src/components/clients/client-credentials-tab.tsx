"use client";

import { Shield, Plus, Lock, Eye, EyeOff, Copy } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import type { ClientCredential } from "@/types/domain";

interface ClientCredentialsTabProps {
  credentials: ClientCredential[];
  revealedPasswords: Record<string, string>;
  countdownTimers: Record<string, number>;
  onRevealPassword: (credId: string) => void;
  onCopyPassword: (credId: string) => void;
  onOpenAddCredModal: () => void;
}

export function ClientCredentialsTab({
  credentials,
  revealedPasswords,
  countdownTimers,
  onRevealPassword,
  onCopyPassword,
  onOpenAddCredModal,
}: ClientCredentialsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Private Credential Vault
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
            Zero-knowledge encryption. Credentials auto-mask after 30 seconds with complete audit logging.
          </p>
        </div>
        <button
          onClick={onOpenAddCredModal}
          className="btn btn-primary text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Login</span>
        </button>
      </div>

      {credentials.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 p-8 text-center space-y-2">
          <p className="text-xs text-[var(--color-ink-tertiary)]">No founder access credentials stored yet.</p>
          <button
            onClick={onOpenAddCredModal}
            className="btn btn-secondary text-xs"
          >
            Add Login
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {credentials.map((cred) => {
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
                      <span className="text-[11.5px] text-[var(--color-ink-tertiary)] font-sans tabular-nums truncate block">
                        {cred.username_or_email}
                      </span>
                    </div>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                </div>

                {/* Password Field with Masking & 30s Auto-wipe */}
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-2 border border-[var(--color-line)] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] uppercase block">
                      {isRevealed ? `Wipes in ${countdown}s` : "Encrypted Password"}
                    </span>
                    <span className="font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)] tracking-wider">
                      {isRevealed ? revealedPasswords[cred.id] : "••••••••••••••••"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRevealPassword(cred.id)}
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
                      onClick={() => onCopyPassword(cred.id)}
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
  );
}
