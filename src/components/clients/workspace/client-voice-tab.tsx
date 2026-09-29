"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import { addTabooWordAction, removeTabooWordAction } from "@/lib/actions/client";
import type { ClientContext } from "@/types/domain";

export interface ClientVoiceTabProps {
  clientId: string;
  founderName: string;
  context: ClientContext | null;
  onOpenVoiceModal: () => void;
  onToast: (msg: string) => void;
}

export function ClientVoiceTab({
  clientId,
  founderName,
  context,
  onOpenVoiceModal,
  onToast,
}: ClientVoiceTabProps) {
  const [newTabooWord, setNewTabooWord] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddTabooWord = () => {
    if (!newTabooWord.trim()) return;
    const word = newTabooWord.trim();
    setNewTabooWord("");
    startTransition(async () => {
      const res = await addTabooWordAction(clientId, word);
      if (res.success) {
        onToast(`Added '${word}' to words to avoid`);
        router.refresh();
      } else {
        onToast("Failed to add word");
      }
    });
  };

  const handleRemoveTabooWord = (word: string) => {
    startTransition(async () => {
      const res = await removeTabooWordAction(clientId, word);
      if (res.success) {
        onToast(`Removed '${word}' from words to avoid`);
        router.refresh();
      } else {
        onToast("Failed to remove word");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Brand Voice &amp; Positioning
            </h2>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
              Foundational tone, audience, and content pillars for {founderName}.
            </p>
          </div>
          <button
            onClick={onOpenVoiceModal}
            className="btn btn-primary text-xs shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Voice &amp; Pillars</span>
          </button>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] shadow-2xs">
          {/* Positioning Statement */}
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
              Positioning Statement
            </span>
            {context?.positioning_statement ? (
              <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                {context.positioning_statement}
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
              >
                No positioning statement configured yet. Click to define &rarr;
              </button>
            )}
          </div>

          {/* Target Audience / ICP */}
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
              Target Audience / ICP
            </span>
            {context?.target_audience_icp ? (
              <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                {context.target_audience_icp}
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
              >
                No target audience or ICP defined yet. Click to define &rarr;
              </button>
            )}
          </div>

          {/* Tone Archetype */}
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
              Tone Archetype
            </span>
            {context?.tone_archetype ? (
              <p className="text-[13px] font-medium text-[var(--color-ink)]">
                {context.tone_archetype}
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
              >
                No tone archetype defined yet. Click to define &rarr;
              </button>
            )}
          </div>

          {/* Voice Guidelines & Nuances */}
          <div className="p-5 space-y-1.5">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
              Voice Guidelines &amp; Nuances
            </span>
            {context?.voice_guidelines ? (
              <p className="text-[13px] leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
                {context.voice_guidelines}
              </p>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
              >
                No specific voice guidelines defined yet. Click to define &rarr;
              </button>
            )}
          </div>

          {/* Core Content Pillars */}
          <div className="p-5 space-y-2">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] block font-medium">
              Core Content Pillars
            </span>
            {context?.core_pillars && context.core_pillars.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {context.core_pillars.map((pillar: string) => (
                  <span
                    key={pillar}
                    className="inline-flex items-center rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] px-2.5 py-1 text-xs font-sans font-medium"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)] transition-colors cursor-pointer"
              >
                No core pillars configured yet. Click to add themes &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Words to Avoid (Negative Guardrails) */}
      <div className="lg:col-span-5 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-ink)]">
            Words to Avoid
          </h2>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
            Buzzwords this founder refuses to use. Flagged automatically in the editor.
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {(!context?.taboo_words || context.taboo_words.length === 0) ? (
              <span className="text-xs text-[var(--color-ink-muted)] py-1">
                No avoided words configured yet.
              </span>
            ) : (
              context.taboo_words.map((w: string) => (
                <span
                  key={w}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] px-2.5 py-1 text-xs font-sans"
                >
                  <span className="line-through text-[var(--color-ink-secondary)]">{w}</span>
                  <button
                    onClick={() => handleRemoveTabooWord(w)}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                    title="Remove taboo word"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Taboo Word Form */}
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-line-subtle)]">
            <input
              type="text"
              value={newTabooWord}
              onChange={(e) => setNewTabooWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTabooWord()}
              placeholder="Add phrase to avoid (e.g. synergy)..."
              className="input text-xs flex-1"
            />
            <button
              onClick={handleAddTabooWord}
              disabled={isPending || !newTabooWord.trim()}
              className="btn btn-primary text-xs shrink-0 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
