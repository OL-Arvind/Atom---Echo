"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, X, Building2, User, Mail, Phone, Calendar, Sparkles, Globe } from "lucide-react";
import { createClientAction } from "@/lib/actions/client";
import { CustomSelect } from "@/components/ui/custom-select";

export function OnboardClientModal({ buttonText = "New Account" }: { buttonText?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cleanButtonText = buttonText.replace(/^\+*\s*/, "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to create client. Please check all required fields.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-primary text-xs shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{cleanButtonText}</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-5 text-[var(--color-ink)] animate-in">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3.5">
              <div>
                <h2 className="font-display text-xl font-normal text-[var(--color-ink)]">
                  Add New Client
                </h2>
                <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                  Set up client details, monthly retainer, and billing cycle.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Company / Brand Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    <input
                      name="name"
                      required
                      placeholder="e.g. Acme Corp"
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Founder Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    <input
                      name="founder_name"
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Founder Title
                  </label>
                  <input
                    name="founder_title"
                    defaultValue="Founder & CEO"
                    placeholder="e.g. Founder & CEO"
                    className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Founder Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    <input
                      name="founder_email"
                      type="email"
                      placeholder="alex@acme.com"
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    WhatsApp Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    <input
                      name="founder_phone"
                      placeholder="+91 98765 00000"
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Retainer (₹ / Month)
                  </label>
                  <input
                    name="monthly_retainer"
                    type="number"
                    placeholder="e.g. 75000"
                    step={5000}
                    className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                  <input
                    name="website_url"
                    type="text"
                    inputMode="url"
                    placeholder="e.g. baseworks.in or https://baseworks.in"
                    className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Service Line
                  </label>
                  <CustomSelect
                    name="service_type"
                    defaultValue="linkedin_branding"
                    options={[
                      { value: "linkedin_branding", label: "LinkedIn Founder Branding", description: "Thought leadership & organic growth" },
                      { value: "cold_outreach", label: "Cold Outbound Outreach", description: "Automated B2B pipeline generation" },
                      { value: "hybrid_growth", label: "Hybrid (Branding + Outreach)", description: "Complete brand & lead acquisition engine" },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                    Billing Day of Month
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                    <input
                      name="billing_anchor_day"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={1}
                      className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-line-subtle)] pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary text-xs disabled:opacity-50"
                >
                  <span>{isPending ? "Adding Client..." : "Add Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
