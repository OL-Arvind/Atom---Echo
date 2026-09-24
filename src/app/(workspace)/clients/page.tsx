import Link from "next/link";
import {
  Users,
  ArrowUpRight,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { getClientsFromDb } from "@/lib/data/supabase-queries";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/ui/brand-logo";

export const dynamic = "force-dynamic";

export default async function ClientsDirectoryPage() {
  const clients = await getClientsFromDb();

  const totalClients = clients.length;
  const activeClients = clients.filter((c: any) => c.status === "active");
  const totalEngagements = clients.reduce(
    (acc: number, c: any) => acc + (c.engagements || []).length,
    0
  );
  const totalContractedMrr = clients.reduce((acc: number, c: any) => {
    const clientEngs = c.engagements || [];
    const clientTotal = clientEngs.reduce(
      (eAcc: number, e: any) => eAcc + Number(e.monthly_retainer || 0),
      0
    );
    return acc + clientTotal;
  }, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Standardized Header */}
      <PageHeader
        title="Clients"
        description="Client retainers, content strategy, software expenses, and private review portals."
      >
        <OnboardClientModal buttonText="Add Client" />
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Active Clients
          </span>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--color-ink)]">
            {activeClients.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Currently working with</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Active Services
          </span>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--color-ink)]">
            {totalEngagements}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Content &amp; outbound lines</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Monthly Retainers
          </span>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--color-ink)]">
            ₹{totalContractedMrr.toLocaleString("en-IN")}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Contracted monthly fee</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Expense Recovery
          </span>
          <div className="text-2xl sm:text-3xl font-semibold tabular-nums text-[var(--color-ok-text)]">
            100%
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Software billed to clients</p>
        </div>
      </div>

      {/* Client Cards Grid */}
      {clients.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-base-subtle)] text-zinc-500 border border-[var(--color-line)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-zinc-900">
              No clients added yet
            </h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Add your first client to start drafting posts, tracking retainers, and generating review links.
            </p>
          </div>
          <div className="pt-2">
            <OnboardClientModal buttonText="Add First Client" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: any) => {
            const isActive = client.status?.toLowerCase() === "active";
            const engagements = client.engagements || [];
            const clientMrr = engagements.reduce(
              (acc: number, e: any) => acc + Number(e.monthly_retainer || 0),
              0
            );
            const anchorDay = engagements[0]?.billing_anchor_day || 1;
            const initials = (client.founder_name || client.name)
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const allPosts = engagements.flatMap((e: any) => e.content_items || []);
            const scheduledPosts = allPosts.filter(
              (p: any) => p.status === "scheduled" || p.status === "approved"
            ).length;
            const reviewPosts = allPosts.filter(
              (p: any) => p.status === "client_review"
            ).length;
            const draftPosts = allPosts.filter(
              (p: any) => p.status === "draft" || p.status === "internal_review"
            ).length;

            return (
              <div
                key={client.id}
                className="group card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--color-line-strong)] transition-all"
              >
                <div className="space-y-3.5">
                  {/* Company & Founder */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <BrandLogo
                        nameOrDomain={client.website || client.founder_email || client.name}
                        size={40}
                        className="h-10 w-10 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-0.5 shadow-xs"
                        fallback={
                          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-xs font-semibold text-zinc-900 shrink-0">
                            {initials}
                          </div>
                        }
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight leading-snug">
                            {client.name}
                          </h2>
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isActive ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                            title={isActive ? "Active Client" : "Inactive"}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {client.founder_name} {client.founder_title ? `· ${client.founder_title}` : ""}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/clients/${client.id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-zinc-400 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
                      title="View Client Details"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Financial Retainer Breakdown */}
                  <div className="pt-2.5 border-t border-[var(--color-line-subtle)] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Monthly Retainer</span>
                      <span className="text-[14px] font-semibold text-zinc-900 tabular-nums">
                        ₹{clientMrr.toLocaleString("en-IN")}{" "}
                        <span className="font-normal text-xs text-zinc-400">/ mo</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span className="truncate max-w-[200px]">
                        {engagements[0]?.service_type === "linkedin_branding"
                          ? "LinkedIn Personal Branding"
                          : engagements[0]?.service_type === "cold_outreach"
                          ? "Cold Outbound Growth"
                          : "Growth Retainer"}
                      </span>
                      <span className="text-[11.5px] text-zinc-400">
                        {engagements.length > 1 ? `+${engagements.length - 1} more` : "Active"}
                      </span>
                    </div>
                  </div>

                  {/* Operational Content Status & Next Billing */}
                  <div className="pt-2.5 border-t border-[var(--color-line-subtle)] flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-1.5">
                      {scheduledPosts > 0 || reviewPosts > 0 ? (
                        <>
                          {scheduledPosts > 0 && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              {scheduledPosts} scheduled
                            </span>
                          )}
                          {scheduledPosts > 0 && reviewPosts > 0 && (
                            <span className="text-zinc-300">&middot;</span>
                          )}
                          {reviewPosts > 0 && (
                            <span className="flex items-center gap-1 text-amber-700 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {reviewPosts} in review
                            </span>
                          )}
                        </>
                      ) : draftPosts > 0 ? (
                        <span className="flex items-center gap-1 text-zinc-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          {draftPosts} draft{draftPosts > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-zinc-400">No active posts</span>
                      )}
                    </div>

                    <span className="text-zinc-500 text-[11px]">
                      Billing Day: {anchorDay} of month
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-[var(--color-line-subtle)] pt-3 flex items-center justify-end">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <span>View Client Details</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
