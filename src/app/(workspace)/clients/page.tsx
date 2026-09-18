import Link from "next/link";
import { Users, ArrowUpRight, Shield, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { INITIAL_CLIENTS, INITIAL_CONTENT_ITEMS, INITIAL_TOOL_EXPENSES } from "@/lib/data/seed-data";

export default function ClientsDirectoryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-subtle-fade">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand">
            <Users className="h-3.5 w-3.5" />
            <span>CLIENT DIRECTORY &middot; COMMERCIAL ENGAGEMENTS</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
            Clients &amp; Workspaces
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Clients are structured as organizations contracting one or more service engagements (Personal Branding / Outbound).
          </p>
        </div>

        <button
          aria-label="Onboard new founder client"
          className="btn-pressable flex min-h-[40px] items-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span>+ Onboard New Founder</span>
        </button>
      </div>

      {/* Grid of Client Workspace Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
        {INITIAL_CLIENTS.map((client) => {
          const clientPosts = INITIAL_CONTENT_ITEMS.filter((p) => p.client_id === client.id);
          const pendingReviewCount = clientPosts.filter((p) => p.status === "client_review").length;
          const clientTools = INITIAL_TOOL_EXPENSES.filter((t) => t.client_id === client.id);
          const totalUnbilledTools = clientTools.reduce((acc, t) => acc + t.amount, 0);

          return (
            <div
              key={client.id}
              className="card-interactive flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-6 shadow-card"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-foreground">
                        {client.name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          client.status === "active"
                            ? "bg-status-emerald-bg text-status-emerald border border-status-emerald-border"
                            : "bg-status-blue-bg text-status-blue border border-status-blue-border"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {client.founder_name} &middot; {client.founder_title || "Founder"}
                    </p>
                  </div>

                  <Link
                    href={`/clients/${client.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-canvas text-foreground-muted hover:border-brand hover:text-brand transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Engagements Breakdown */}
                <div className="space-y-2 rounded-lg bg-canvas p-3 border border-border-subtle">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                    Active Service Engagements
                  </span>
                  <div className="space-y-1.5">
                    {client.engagements.map((eng) => (
                      <div key={eng.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">
                          {eng.service_type === "linkedin_branding"
                            ? "LinkedIn Personal Branding"
                            : eng.service_type === "cold_outreach"
                            ? "Cold Outreach & Campaigns"
                            : "Hybrid Growth Retainer"}
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          ₹{(eng.monthly_retainer / 1000).toFixed(0)}k/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operational Health Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {pendingReviewCount > 0 ? (
                    <span className="flex items-center gap-1 rounded-full bg-status-rose-bg px-2.5 py-1 text-[11px] font-semibold text-status-rose border border-status-rose-border">
                      <Clock className="h-3 w-3" />
                      {pendingReviewCount} Post{pendingReviewCount > 1 ? "s" : ""} in Review
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-status-emerald-bg px-2.5 py-1 text-[11px] font-semibold text-status-emerald border border-status-emerald-border">
                      <CheckCircle2 className="h-3 w-3" />
                      Reviews Up to Date
                    </span>
                  )}

                  {totalUnbilledTools > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-status-amber-bg px-2.5 py-1 text-[11px] font-semibold text-status-amber border border-status-amber-border">
                      ₹{totalUnbilledTools.toLocaleString("en-IN")} Unbilled Tools
                    </span>
                  )}

                  {client.context && (
                    <span className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-foreground-muted border border-border-subtle">
                      <Sparkles className="h-3 w-3 text-brand" />
                      Context Vault Loaded
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 border-t border-border-subtle pt-4 flex items-center justify-between">
                <span className="text-[11px] text-foreground-muted">
                  Anchor: Day {client.engagements[0]?.billing_anchor_day || 1} of month
                </span>
                <Link
                  href={`/clients/${client.id}`}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Open 360 Workspace &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
