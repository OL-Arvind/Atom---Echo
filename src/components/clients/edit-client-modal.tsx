"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Building2, User, Mail, Phone, Calendar, Globe, Pencil } from "lucide-react";
import { updateClientAction } from "@/lib/actions/client";
import { CustomSelect } from "@/components/ui/custom-select";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";

interface EditClientModalProps {
  client: {
    id: string;
    name: string;
    founder_name: string;
    founder_title?: string | null;
    founder_email?: string | null;
    founder_phone?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    website?: string | null;
    status?: string | null;
    engagements?: Array<{
      id: string;
      service_type?: string;
      monthly_retainer?: number | string;
      billing_anchor_day?: number;
    }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const primaryEng = client.engagements?.[0];
  const retainerValue = primaryEng?.monthly_retainer ? Number(primaryEng.monthly_retainer) : undefined;
  const anchorDayValue = primaryEng?.billing_anchor_day ?? 1;
  const currentServiceType = primaryEng?.service_type || "linkedin_branding";
  const currentStatus = client.status || "active";
  const currentWebsite = client.website_url || client.website || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateClientAction(formData);
      if (res.success) {
        onSuccess?.();
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed to update client. Please check all fields.");
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-5 text-[var(--color-ink)] animate-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink)] shrink-0">
              <Pencil className="h-3.5 w-3.5 text-[var(--color-ink-secondary)]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-normal text-[var(--color-ink)]">
                Edit Client Profile
              </h2>
              <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
                Update founder details, contact channels, and commercial retainer terms.
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

        {/* Error Feedback */}
        {error && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-3 text-xs text-[var(--color-danger-text)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <input type="hidden" name="clientId" value={client.id} />

          {/* Row 1: Company Name & Founder Name */}
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
                  defaultValue={client.name}
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
                  defaultValue={client.founder_name}
                  placeholder="e.g. Alex Rivera"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Founder Title & Email */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                Founder Title
              </label>
              <input
                name="founder_title"
                defaultValue={client.founder_title || "Founder & CEO"}
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
                  defaultValue={client.founder_email || ""}
                  placeholder="alex@acme.com"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Phone & Monthly Retainer */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                WhatsApp Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                <input
                  name="founder_phone"
                  defaultValue={client.founder_phone || ""}
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
                defaultValue={retainerValue ?? ""}
                placeholder="e.g. 75000"
                step={5000}
                className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] px-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans tabular-nums"
              />
            </div>
          </div>

          {/* Row 4: LinkedIn URL & Website URL */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 flex items-center justify-center text-[var(--color-ink-muted)]">
                  <LinkedInIcon size={16} />
                </div>
                <input
                  name="linkedin_url"
                  type="text"
                  inputMode="url"
                  defaultValue={client.linkedin_url || ""}
                  placeholder="e.g. linkedin.com/in/founder"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
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
                  defaultValue={currentWebsite}
                  placeholder="e.g. baseworks.in"
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Service Line & Billing Anchor Day */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
                Service Line
              </label>
              <CustomSelect
                name="service_type"
                defaultValue={currentServiceType}
                options={[
                  {
                    value: "linkedin_branding",
                    label: "LinkedIn Founder Branding",
                    description: "Thought leadership & organic growth",
                  },
                  {
                    value: "cold_outreach",
                    label: "Cold Outbound Outreach",
                    description: "Automated B2B pipeline generation",
                  },
                  {
                    value: "hybrid_growth",
                    label: "Hybrid (Branding + Outreach)",
                    description: "Complete brand & lead acquisition engine",
                  },
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
                  defaultValue={anchorDayValue}
                  className="w-full h-9 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent-dim)] focus:outline-none transition-all font-sans tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Client Operational Status */}
          <div>
            <label className="text-[10px] font-medium text-[var(--color-ink-tertiary)] block mb-1 font-sans tabular-nums uppercase tracking-wider">
              Account Status
            </label>
            <CustomSelect
              name="status"
              defaultValue={currentStatus}
              options={[
                {
                  value: "active",
                  label: "Active",
                  description: "Full active publishing and content review cycles",
                },
                {
                  value: "paused",
                  label: "Paused",
                  description: "Publishing temporarily paused (emergency hold or hiatus)",
                },
                {
                  value: "onboarding",
                  label: "Onboarding",
                  description: "Initial discovery, intake, and positioning phase",
                },
                {
                  value: "churned",
                  label: "Churned / Inactive",
                  description: "Past client / completed engagement",
                },
              ]}
            />
          </div>

          {/* Action Footer */}
          <div className="border-t border-[var(--color-line-subtle)] pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs disabled:opacity-50"
            >
              <span>{isPending ? "Saving Changes…" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function EditClientTrigger({
  client,
  className = "",
}: {
  client: EditClientModalProps["client"];
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={
          className ||
          "flex items-center justify-center p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] active:scale-[0.92] transition-colors cursor-pointer"
        }
        title={`Edit ${client.name} details & commercial terms`}
      >
        <Pencil className="h-4 w-4" />
      </button>

      <EditClientModal
        client={client}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

