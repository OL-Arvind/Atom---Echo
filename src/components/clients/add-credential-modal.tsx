"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Lock, Shield, Key } from "lucide-react";
import { addCredentialAction } from "@/lib/actions/credentials";

interface AddCredentialModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddCredentialModal({ clientId, isOpen, onClose }: AddCredentialModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("client_id", clientId);

    startTransition(async () => {
      const res = await addCredentialAction(formData);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to store credential.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xl space-y-4 text-[var(--color-ink)] animate-in">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Add Client Login
              </h2>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Securely store account login details. Passwords auto-mask after 30 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-2.5 text-xs text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Platform / Service *
            </label>
            <input
              name="platform"
              required
              placeholder="e.g. LinkedIn, HeyReach, Apollo"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Username or Email *
            </label>
            <input
              name="username_or_email"
              required
              placeholder="e.g. founder@company.com"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Password *
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="Enter account password"
              className="input text-xs font-sans tabular-nums"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              2FA Method / Notes
            </label>
            <input
              name="two_factor_method"
              placeholder="e.g. WhatsApp OTP, Authenticator app"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Notes &amp; Setup Instructions
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Dedicated proxy IP, active hours, do not reset sessions"
              className="input text-xs resize-none"
            />
          </div>

          <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs disabled:opacity-50"
            >
              <span>{isPending ? "Saving..." : "Save Login"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
