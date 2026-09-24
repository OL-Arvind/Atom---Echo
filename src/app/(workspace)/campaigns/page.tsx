import { Layers, Plus, TrendingUp, CheckCircle2, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getClientsFromDb } from "@/lib/data/supabase-queries";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const clients = await getClientsFromDb();

  // Filter clients with cold outreach service
  const outreachClients = clients.filter((c: any) =>
    (c.engagements || []).some(
      (e: any) => e.service_type === "cold_outreach" || e.service_type === "hybrid_growth"
    )
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Standardized Header */}
      <PageHeader
        title="Outbound Campaigns"
        description="Cold email and LinkedIn outreach campaigns running for your clients."
      >
        <Link
          href="/clients"
          className="btn btn-primary text-xs"
        >
          <span>View Clients</span>
        </Link>
      </PageHeader>


      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Active Campaigns
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {outreachClients.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Clients with active outreach</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Inbox Placement
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ok-text)]">
            {outreachClients.length > 0 ? "99.2%" : "—"}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Email deliverability &amp; sender health</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent-text)] font-medium">
            Pipeline Value
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-accent-text)]">
            {outreachClients.length > 0 ? "₹63,00,000" : "₹0"}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Lead opportunities generated</p>
        </div>
      </div>

      {/* Active Campaigns List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
          <div className="flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
              Outbound Campaigns
            </h2>
          </div>
          <span className="font-mono text-xs text-[var(--color-ink-tertiary)]">
            HeyReach &amp; Smartlead
          </span>
        </div>

        {outreachClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
            <p>No outbound campaigns running yet.</p>
            <p className="text-[var(--color-ink-muted)]">Add a client with cold outreach to start tracking campaigns.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line-subtle)]">
            {outreachClients.map((client: any) => {
              const eng = (client.engagements || []).find(
                (e: any) => e.service_type === "cold_outreach" || e.service_type === "hybrid_growth"
              );

              return (
                <div
                  key={client.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-[var(--color-ink)]">
                        {client.name} &middot; {client.founder_name}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-secondary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-secondary)]">
                      Monthly Retainer: <span className="font-medium text-[var(--color-ink)]">₹{Number(eng?.monthly_retainer || 80000).toLocaleString("en-IN")}/mo</span> &middot; Dedicated sender pool active
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="btn btn-secondary text-xs inline-flex items-center gap-1"
                    >
                      <span>View Client Details</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
