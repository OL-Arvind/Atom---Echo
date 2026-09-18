"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Building2, User, Mail, Phone, DollarSign, Calendar, Sparkles } from "lucide-react";
import { createClientAction } from "@/lib/actions/client";

export function OnboardClientModal({ buttonText = "+ Onboard New Founder" }: { buttonText?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        setError(res.error || "Failed to onboard client");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-pressable flex min-h-[38px] items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black shadow-[0_1px_4px_rgba(255,255,255,0.15)] hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-white transition-all"
      >
        <Plus className="h-4 w-4" />
        <span>{buttonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-stagger-1">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#0C0C0E] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white" />
                <h2 className="font-display text-lg font-bold text-white">
                  Onboard Founder Client
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-pressable rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-white">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Company / Brand Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="name"
                      required
                      placeholder="e.g. Debtworks"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Founder Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="founder_name"
                      required
                      placeholder="e.g. Chetan Ahuja"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Founder Title
                  </label>
                  <input
                    name="founder_title"
                    defaultValue="Founder & CEO"
                    placeholder="e.g. Founder & CEO"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Founder Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="founder_email"
                      type="email"
                      placeholder="chetan@company.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Founder Phone (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="founder_phone"
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Service Retainer (₹ / Month)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="monthly_retainer"
                      type="number"
                      defaultValue={150000}
                      step={5000}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Service Engagement Type
                  </label>
                  <select
                    name="service_type"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-white focus:outline-none transition-colors"
                  >
                    <option value="linkedin_branding">LinkedIn Personal Branding</option>
                    <option value="cold_outreach">Cold Outreach &amp; Lead Gen</option>
                    <option value="hybrid_growth">Hybrid Growth Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
                    Monthly Billing Anchor Day
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      name="billing_anchor_day"
                      type="number"
                      min={1}
                      max={31}
                      defaultValue={1}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-pressable rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-pressable flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-bold text-black shadow-[0_1px_4px_rgba(255,255,255,0.15)] hover:bg-zinc-200 disabled:opacity-50 transition-all"
                >
                  <span>{isPending ? "Creating Record..." : "Confirm & Save Client"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
