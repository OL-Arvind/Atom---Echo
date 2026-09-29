"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Key } from "lucide-react";
import { addCredentialAction } from "@/lib/actions/credentials";

interface AddCredentialModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddCredentialModal({ clientId, isOpen, onClose }: AddCredentialModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accessScope, setAccessScope] = useState<"agency_only" | "client_shared">("agency_only");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-2xl space-y-4 text-[var(--color-ink)] animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Add Login
          </h2>
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
          {/* Access Scope Segmented Control */}
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1.5">
              Visibility
            </label>
            <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5">
              <button
                type="button"
                onClick={() => setAccessScope("agency_only")}
                className={`flex-1 py-1.5 px-3 rounded-[var(--radius-xs)] text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                  accessScope === "agency_only"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
                <span>Agency Internal</span>
              </button>
              <button
                type="button"
                onClick={() => setAccessScope("client_shared")}
                className={`flex-1 py-1.5 px-3 rounded-[var(--radius-xs)] text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                  accessScope === "client_shared"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                <span>Shared with Client</span>
              </button>
            </div>
            <p className="text-[10.5px] text-[var(--color-ink-tertiary)] mt-1">
              {accessScope === "client_shared"
                ? "Surfaced in founder's mobile desk for 1-tap copy."
                : "Visible strictly to Atom & Echo operators."}
            </p>
            <input type="hidden" name="access_scope" value={accessScope} />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Platform / Service
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
              Username or Email
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
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="Enter password"
              className="input text-xs font-sans tabular-nums"
            />
          </div>

          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              2FA / Access Instructions <span className="text-[var(--color-ink-muted)] font-normal">(Optional)</span>
            </label>
            <input
              name="two_factor_method"
              placeholder="e.g. Authenticator app, WhatsApp OTP, or proxy notes"
              className="input text-xs"
            />
          </div>

          <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
