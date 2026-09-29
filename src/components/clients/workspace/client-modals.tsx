"use client";

import React from "react";

export interface ClientModalsProps {
  clientName: string;
  showDeleteConfirm: boolean;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  showPauseConfirm: boolean;
  onClosePauseConfirm: () => void;
  onConfirmPause: () => void;
  isPending: boolean;
}

export function ClientModals({
  clientName,
  showDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
  showPauseConfirm,
  onClosePauseConfirm,
  onConfirmPause,
  isPending,
}: ClientModalsProps) {
  return (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-sm text-[var(--color-ink)]">
                Delete {clientName}?
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
                onClick={onCloseDeleteConfirm}
                disabled={isPending}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
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
                Pause Publishing for {clientName}?
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
                onClick={onClosePauseConfirm}
                disabled={isPending}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmPause}
                disabled={isPending}
                className="btn btn-primary text-xs"
              >
                {isPending ? "Pausing…" : "Pause Publishing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
