"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Wrench, Calendar, DollarSign } from "lucide-react";
import { createToolSubscriptionAction } from "@/lib/actions/billing";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

interface AddToolSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToolSubscriptionModal({
  isOpen,
  onClose,
}: AddToolSubscriptionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const defaultRenewalDate = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createToolSubscriptionAction(formData);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to create tool subscription.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-xl space-y-4 text-[var(--color-ink)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-accent-bg)] border border-[var(--color-accent-line)] text-[var(--color-accent-text)]">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
                Add Tool License
              </h2>
              <p className="text-[11px] text-[var(--color-ink-secondary)]">
                Register software (Clay, HeyReach, Proxies) in the agency catalog.
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

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {/* Tool Name */}
          <div>
            <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
              Tool / Software Name *
            </label>
            <input
              name="tool_name"
              type="text"
              placeholder="e.g. Clay Explorer, HeyReach Seat #1, Proxies"
              required
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none placeholder:text-[var(--color-ink-muted)]"
            />
          </div>

          {/* Cost Amount and Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Cost Amount *
              </label>
              <div className="relative">
                <input
                  name="cost_amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 79"
                  required
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none placeholder:text-[var(--color-ink-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Currency *
              </label>
              <select
                name="currency"
                defaultValue="USD"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Billing Cycle and Next Renewal Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Billing Cycle *
              </label>
              <select
                name="billing_cycle"
                defaultValue="monthly"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="credits">One-time / Credits</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-sans tabular-nums uppercase tracking-wider font-medium text-[var(--color-ink-tertiary)] block mb-1">
                Renewal Date *
              </label>
              <CustomDatePicker
                name="next_renewal_date"
                defaultValue={defaultRenewalDate}
                required
                placeholder="Select renewal date"
              />
            </div>
          </div>

          {/* Default Pass-Through Toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="default_pass_through"
              name="default_pass_through"
              value="true"
              defaultChecked
              className="h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-accent)] focus:ring-0 cursor-pointer"
            />
            <label
              htmlFor="default_pass_through"
              className="text-xs text-[var(--color-ink)] cursor-pointer"
            >
              Default pass-through expense to client retainers
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-line-subtle)]">
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
              {isPending ? "Saving..." : "Save Tool Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
