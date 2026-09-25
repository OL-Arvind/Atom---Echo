"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Plus } from "lucide-react";
import { updateClientContextAction } from "@/lib/actions/client";

interface EditVoiceModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  initialContext?: {
    positioning_statement?: string;
    target_audience_icp?: string;
    tone_archetype?: string;
    voice_guidelines?: string;
    core_pillars?: string[];
  } | null;
  onSuccess?: () => void;
}

const SUGGESTED_ARCHETYPES = [
  "Contrarian Authority",
  "Pragmatic Operator",
  "Data-Driven Strategist",
  "Empathetic Founder",
  "Deep-Tech Specialist",
];

export function EditVoiceModal({
  clientId,
  isOpen,
  onClose,
  initialContext,
  onSuccess,
}: EditVoiceModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [positioningStatement, setPositioningStatement] = useState(
    initialContext?.positioning_statement || ""
  );
  const [targetAudienceIcp, setTargetAudienceIcp] = useState(
    initialContext?.target_audience_icp || ""
  );
  const [toneArchetype, setToneArchetype] = useState(
    initialContext?.tone_archetype || ""
  );
  const [voiceGuidelines, setVoiceGuidelines] = useState(
    initialContext?.voice_guidelines || ""
  );
  const [corePillars, setCorePillars] = useState<string[]>(
    initialContext?.core_pillars || []
  );
  const [newPillar, setNewPillar] = useState("");

  if (!isOpen) return null;

  const handleAddPillar = () => {
    const trimmed = newPillar.trim();
    if (!trimmed) return;
    if (!corePillars.includes(trimmed)) {
      setCorePillars([...corePillars, trimmed]);
    }
    setNewPillar("");
  };

  const handleRemovePillar = (pillarToRemove: string) => {
    setCorePillars(corePillars.filter((p) => p !== pillarToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await updateClientContextAction(clientId, {
        positioning_statement: positioningStatement,
        target_audience_icp: targetAudienceIcp,
        tone_archetype: toneArchetype,
        voice_guidelines: voiceGuidelines,
        core_pillars: corePillars,
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setError(res.error || "Failed to update voice & positioning.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-5 text-[var(--color-ink)] animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Edit Voice & Positioning
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                Define the founder&apos;s brand positioning, ICP, tone, and core pillars.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:bg-[var(--color-base-subtle)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Positioning Statement */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block">
              Positioning Statement
            </label>
            <textarea
              rows={3}
              value={positioningStatement}
              onChange={(e) => setPositioningStatement(e.target.value)}
              placeholder="e.g. Helping B2B SaaS founders build trusted organic authority on LinkedIn to drive enterprise pipeline without fluff or vanity metrics."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Target Audience / ICP */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block">
              Target Audience / ICP
            </label>
            <textarea
              rows={2}
              value={targetAudienceIcp}
              onChange={(e) => setTargetAudienceIcp(e.target.value)}
              placeholder="e.g. Series A/B B2B SaaS Founders, Chief Revenue Officers, and Heads of Growth (50-250 employees)."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Tone Archetype */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block">
              Tone Archetype
            </label>
            <input
              type="text"
              value={toneArchetype}
              onChange={(e) => setToneArchetype(e.target.value)}
              placeholder="e.g. Contrarian Authority, Pragmatic Operator"
              className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
            />
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-[var(--color-ink-muted)] self-center mr-1">
                Presets:
              </span>
              {SUGGESTED_ARCHETYPES.map((arch) => (
                <button
                  type="button"
                  key={arch}
                  onClick={() => setToneArchetype(arch)}
                  className={`text-[10.5px] px-2 py-0.5 rounded-[var(--radius-xs)] border transition-all cursor-pointer ${
                    toneArchetype === arch
                      ? "border-[var(--color-accent-dim)] bg-[var(--color-accent-bg)] text-[var(--color-accent-text)]"
                      : "border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {arch}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Guidelines */}
          <div className="space-y-1">
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block">
              Voice Guidelines & Nuances
            </label>
            <textarea
              rows={3}
              value={voiceGuidelines}
              onChange={(e) => setVoiceGuidelines(e.target.value)}
              placeholder="e.g. Direct, punchy 1-line hooks. Avoid corporate clichés and buzzwords. Always anchor contrarian claims with real metrics and execution examples."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Core Content Pillars */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block">
              Core Content Pillars
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]">
              {corePillars.length === 0 ? (
                <span className="text-[11px] text-[var(--color-ink-muted)] italic">
                  No pillars added yet. Add key themes below.
                </span>
              ) : (
                corePillars.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--color-base)] border border-[var(--color-line)] text-[var(--color-ink)] px-2 py-0.5 text-xs font-sans"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePillar(p)}
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPillar();
                  }
                }}
                placeholder="e.g. Founder Lessons, Outbound Playbooks..."
                className="w-full h-8 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-2.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddPillar}
                disabled={!newPillar.trim()}
                className="btn btn-secondary text-xs h-8 shrink-0 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                <span>Add Pillar</span>
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-[var(--color-line-subtle)] pt-4 flex items-center justify-end gap-2.5">
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
              <span>{isPending ? "Saving Changes..." : "Save Guidelines"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
