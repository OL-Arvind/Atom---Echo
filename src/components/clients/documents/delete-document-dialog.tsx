"use client";

import React from "react";
import { X } from "lucide-react";
import type { ClientDocument } from "@/types/domain";

interface DeleteDocumentDialogProps {
  doc: ClientDocument | null;
  clientName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDocumentDialog({
  doc,
  clientName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDocumentDialogProps) {
  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4 animate-in">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Remove Document?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
          Remove{" "}
          <strong className="font-medium text-[var(--color-ink)]">
            {doc.title}
          </strong>{" "}
          from {clientName}?
        </p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-ghost text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-primary text-xs"
          >
            {isDeleting ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
