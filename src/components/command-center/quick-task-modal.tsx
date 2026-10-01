"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Clock, Check } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import type { TaskEstimatedMinutes } from "@/types/domain";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: {
    title: string;
    estimated_minutes: TaskEstimatedMinutes;
    assigned_to?: string | null;
    client_id?: string | null;
  }) => Promise<void>;
  teamMembers?: Array<{ id: string; full_name: string; email: string }>;
  clients?: Array<{ id: string; name: string }>;
  isPending?: boolean;
}

const PRESET_DURATIONS: TaskEstimatedMinutes[] = [1, 5, 15, 30];

export function QuickTaskModal({
  isOpen,
  onClose,
  onAddTask,
  teamMembers = [],
  clients = [],
  isPending = false,
}: QuickTaskModalProps) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<TaskEstimatedMinutes>(5);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDuration(5);
      setAssignedTo("");
      setClientId("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    await onAddTask({
      title: title.trim(),
      estimated_minutes: duration,
      assigned_to: assignedTo || null,
      client_id: clientId || null,
    });

    onClose();
  };

  if (!isOpen || !mounted) return null;

  const teamOptions = [
    { value: "", label: "Assigned to Self" },
    ...teamMembers.map((m) => ({
      value: m.id,
      label: m.full_name,
    })),
  ];

  const clientOptions = [
    { value: "", label: "Internal (No Client)" },
    ...clients.map((c) => ({
      value: c.id,
      label: c.name,
      brandName: c.name,
    })),
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] shadow-dialog text-[var(--color-ink)] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-subtle)]/40">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]" />
            <h2 id="modal-title" className="text-xs font-semibold text-[var(--color-ink)] font-display tracking-tight">
              New Desk Task
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1 rounded transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Main Title Input: Plain one-line field, zero boxiness, zero green outline */}
          <div className="pt-1 pb-1">
            <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">
              What needs to get done?
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up with Chetan on WhatsApp about draft..."
              className="w-full bg-transparent border-0 border-b border-[var(--color-line-strong)] pb-2.5 pt-1 text-base font-normal text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-ink)] transition-colors font-sans"
              style={{ outline: "none", boxShadow: "none" }}
              autoComplete="off"
            />
          </div>

          {/* Time Commitment Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
              <span>Time Commitment</span>
              <span className="text-[var(--color-ink-secondary)] font-mono tabular-nums">
                {duration} minutes
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_DURATIONS.map((mins) => {
                const isSelected = duration === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-2 px-3 rounded-[var(--radius-sm)] text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-ink)] text-[var(--color-surface)] shadow-xs scale-[1.02]"
                        : "bg-[var(--color-surface)] text-[var(--color-ink-secondary)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)]"
                    }`}
                  >
                    <span>{mins}m</span>
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Controls: Assignee & Client Account via CustomSelect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
                Assignee
              </label>
              <CustomSelect
                options={teamOptions}
                value={assignedTo}
                onChange={setAssignedTo}
                size="sm"
                className="w-full text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-ink-muted)]">
                Client Account
              </label>
              <CustomSelect
                options={clientOptions}
                value={clientId}
                onChange={setClientId}
                size="sm"
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-line)]">
            <span className="text-[11px] text-[var(--color-ink-muted)]">
              Press <kbd className="font-mono bg-[var(--color-base-subtle)] border border-[var(--color-line-subtle)] px-1 py-0.5 rounded">Enter</kbd> to add
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isPending}
                className="btn btn-primary text-xs px-4 py-1.5 cursor-pointer font-medium"
              >
                {isPending ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
