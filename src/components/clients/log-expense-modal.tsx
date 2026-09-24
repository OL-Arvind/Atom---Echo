"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CreditCard } from "lucide-react";
import { logToolExpenseAction } from "@/lib/actions/client";
import { CustomSelect } from "@/components/ui/custom-select";

interface LogExpenseModalProps {
  clientId: string;
  engagements: { id: string; service_type: string; monthly_retainer: number }[];
  toolSubscriptions?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function LogExpenseModal({
  clientId,
  engagements,
  toolSubscriptions = [],
  isOpen,
  onClose,
}: LogExpenseModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [toolNameVal, setToolNameVal] = useState<string>("");
  const [amountVal, setAmountVal] = useState<string>("");
  const [descVal, setDescVal] = useState<string>("");
  const router = useRouter();

  if (!isOpen) return null;

  const defaultEngagementId = engagements[0]?.id || "";

  const handleToolCatalogSelect = (toolId: string) => {
    setSelectedToolId(toolId);
    if (!toolId) return;
    const tool = toolSubscriptions.find((t) => t.id === toolId);
    if (tool) {
      setToolNameVal(tool.tool_name);
      // If tool cost is in USD, convert approximately to INR (e.g. * 84) or use direct INR
      const inrAmount = tool.currency === "USD" ? Math.round(Number(tool.cost_amount) * 85) : Math.round(Number(tool.cost_amount));
      setAmountVal(String(inrAmount));
      setDescVal(`${tool.tool_name} pass-through license seat`);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("client_id", clientId);

    startTransition(async () => {
      const res = await logToolExpenseAction(formData);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to log tool expense.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xl space-y-4 text-[var(--color-ink)] animate-in">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Log Software Expense
              </h2>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Add software costs (HeyReach, Clay, Apollo, proxies) to include on the next invoice.
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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Service Retainer *
            </label>
            <CustomSelect
              name="engagement_id"
              defaultValue={defaultEngagementId}
              required
              options={engagements.map((eng) => ({
                value: eng.id,
                label:
                  eng.service_type === "linkedin_branding"
                    ? "LinkedIn Founder Branding"
                    : eng.service_type === "cold_outreach"
                    ? "Cold Outbound Outreach"
                    : "Hybrid Growth",
                description: `₹${Number(eng.monthly_retainer).toLocaleString("en-IN")}/mo`,
              }))}
            />
          </div>

          {/* Tool Catalog Quick Selector */}
          {toolSubscriptions.length > 0 && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-accent-text)] block mb-1">
                Pick From Agency Tool Catalog (Optional)
              </label>
              <select
                value={selectedToolId}
                onChange={(e) => handleToolCatalogSelect(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-raised)] px-2.5 py-1.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">-- Or type manually below --</option>
                {toolSubscriptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tool_name} ({t.currency} {t.cost_amount}/{t.billing_cycle})
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            type="hidden"
            name="tool_subscription_id"
            value={selectedToolId || ""}
          />

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Software or Tool *
            </label>
            <input
              name="tool_name"
              required
              value={toolNameVal}
              onChange={(e) => setToolNameVal(e.target.value)}
              placeholder="e.g. HeyReach, Clay, Apollo, Proxies"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Amount (₹ INR) *
            </label>
            <input
              name="amount"
              type="number"
              required
              value={amountVal}
              onChange={(e) => setAmountVal(e.target.value)}
              placeholder="e.g. 6600"
              step={100}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Description *
            </label>
            <input
              name="description"
              required
              value={descVal}
              onChange={(e) => setDescVal(e.target.value)}
              placeholder="e.g. HeyReach outreach seat, Clay export credits"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Date
            </label>
            <input
              name="incurred_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="input text-xs font-mono"
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
              <span>{isPending ? "Saving..." : "Save Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
