"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2 } from "lucide-react";
import { deleteCredentialAction } from "@/lib/actions/credentials";
import type { ClientCredential } from "@/types/domain";

interface DeleteCredentialModalProps {
  credential: ClientCredential | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteCredentialModal({
  credential,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCredentialModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen || !credential) return null;

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteCredentialAction(credential.id);
      if (res.success) {
        onClose();
        router.refresh();
        onSuccess?.();
      } else {
        setError(res.error || "Failed to delete credential.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-2xl space-y-4 text-[var(--color-ink)] animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[var(--color-ink-tertiary)]" />
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Delete Login
            </h2>
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

        <div className="space-y-2">
          <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            Are you sure you want to permanently delete the login for{" "}
            <span className="font-semibold text-[var(--color-ink)]">{credential.platform}</span> (
            <span className="font-sans tabular-nums text-[var(--color-ink)]">{credential.username_or_email}</span>)?
          </p>
          <p className="text-[11px] text-[var(--color-ink-tertiary)]">
            This action cannot be undone. It will be removed from both the agency workspace and the client desk.
          </p>
        </div>

        <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="btn btn-secondary text-xs active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="btn btn-primary text-xs active:scale-[0.98] disabled:opacity-50 text-[var(--color-danger-text)] hover:border-[var(--color-danger-line)]"
          >
            {isPending ? "Deleting..." : "Delete Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
