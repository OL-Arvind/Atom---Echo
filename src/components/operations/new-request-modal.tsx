"use client";

import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

export interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  isPending: boolean;
  onSubmit: (data: {
    clientId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
  }) => void;
}

export function NewRequestModal({
  isOpen,
  onClose,
  clients,
  isPending,
  onSubmit,
}: NewRequestModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [newCategory, setNewCategory] = useState<string>("general_query");
  const [newPriority, setNewPriority] = useState<string>("normal");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newTitle.trim()) return;

    onSubmit({
      clientId: selectedClientId,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="card max-w-md w-full p-6 space-y-4 bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="font-display text-base font-normal text-[var(--color-ink)]">
              Log Founder Escalation or Freeze
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[var(--color-ink-secondary)] font-medium">Founder Account</label>
            <CustomSelect
              options={clients.map((c) => ({
                value: c.id,
                label: c.name,
                description: c.founder_name,
              }))}
              value={selectedClientId}
              onChange={setSelectedClientId}
              placeholder="Select Founder Account"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[var(--color-ink-secondary)] font-medium">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input w-full"
              >
                <option value="emergency_hold">Emergency Publishing Freeze</option>
                <option value="content_pivot">Narrative / Pillar Pivot</option>
                <option value="design_tweak">Visual / Asset Direction</option>
                <option value="tool_issue">Outbound / Tooling Issue</option>
                <option value="general_query">General Founder Request</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[var(--color-ink-secondary)] font-medium">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="input w-full"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {newCategory === "emergency_hold" && (
            <div className="border-l-2 border-[var(--color-danger-line)] pl-3.5 py-1.5 text-[var(--color-danger-text)] text-[11.5px] space-y-1">
              <span className="font-semibold block">Immediate Publishing Freeze</span>
              <p className="text-[var(--color-ink-secondary)]">
                Activating a freeze immediately pauses all scheduled LinkedIn releases for this founder and flags the Command Center.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[var(--color-ink-secondary)] font-medium">Summary</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={newCategory === "emergency_hold" ? "e.g. Pause releases during stealth M&A window" : "e.g. Shift narrative toward enterprise GTM"}
              className="input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[var(--color-ink-secondary)] font-medium">Context &amp; WhatsApp Notes</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Paste the founder's WhatsApp message or voice-note summary..."
              rows={3}
              className="input w-full resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-line)]">
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
              className="btn btn-primary text-xs"
            >
              {isPending
                ? "Saving..."
                : newCategory === "emergency_hold"
                ? "Activate Publishing Freeze"
                : "Log Escalation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
