"use client";

import React from "react";
import type { ClientMeeting } from "@/types/domain";

interface DeleteMeetingDialogProps {
  meeting: ClientMeeting | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteMeetingDialog({
  meeting,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteMeetingDialogProps) {
  if (!meeting) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4 animate-in">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">
            Delete Conversation?
          </h3>
          <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
            Remove{" "}
            <strong className="text-[var(--color-ink)]">
              {meeting.title}
            </strong>
            ? This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
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
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
