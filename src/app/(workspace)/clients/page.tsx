import Link from "next/link";
import { Users, ArrowUpRight, CheckCircle2, Building2, Sparkles } from "lucide-react";
import { getClientsFromDb } from "@/lib/data/supabase-queries";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";

export const dynamic = "force-dynamic";

export default async function ClientsDirectoryPage() {
  const clients = await getClientsFromDb();

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-stagger-1 text-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            <Users className="h-3.5 w-3.5 text-white" />
            <span>CLIENT DIRECTORY &middot; COMMERCIAL ENGAGEMENTS</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
            Clients &amp; Workspaces
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Organizations contracting active personal branding retainers and cold outbound pipelines. Single source of operational truth.
          </p>
        </div>

        <OnboardClientModal />
      </div>

      {/* Empty State for Day 0 / First Time User */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#0C0C0E]/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-inner mb-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">
            No Clients Onboarded Yet
          </h2>
          <p className="mt-1 max-w-md text-xs text-zinc-400 leading-relaxed">
            Welcome to Atom &amp; Echo OS. Start by onboarding your first founder client. Their retainers, content pipeline, and pass-through software seats will be tracked automatically.
          </p>
          <div className="mt-6">
            <OnboardClientModal buttonText="+ Onboard Your First Client" />
          </div>
        </div>
      ) : (
        /* Grid of Client Workspace Cards */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {clients.map((client: any) => {
            return (
              <div
                key={client.id}
                className="card-interactive flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-display text-lg font-bold text-white">
                          {client.name}
                        </span>
                        <span className="rounded-full bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-zinc-200">
                          {client.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {client.founder_name} &middot; {client.founder_title || "Founder"}
                      </p>
                    </div>

                    <Link
                      href={`/clients/${client.id}`}
                      className="btn-pressable flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-white hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Engagements Breakdown */}
                  <div className="space-y-2 rounded-lg bg-zinc-900/50 p-3.5 border border-zinc-800">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
                      Active Service Engagements
                    </span>
                    <div className="space-y-2">
                      {(client.engagements || []).length === 0 ? (
                        <span className="text-xs text-zinc-500">No active retainers attached</span>
                      ) : (
                        (client.engagements || []).map((eng: any) => (
                          <div key={eng.id} className="flex items-center justify-between text-xs">
                            <span className="font-medium text-zinc-200">
                              {eng.service_type === "linkedin_branding"
                                ? "LinkedIn Personal Branding"
                                : eng.service_type === "cold_outreach"
                                ? "Cold Outreach & Campaigns"
                                : "Hybrid Growth Retainer"}
                            </span>
                            <span className="tabular-numbers font-mono font-semibold text-white">
                              ₹{(Number(eng.monthly_retainer || 0) / 1000).toFixed(0)}k/mo
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Operational Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-800">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                      Client Ready
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 border border-zinc-800 font-mono">
                      <Sparkles className="h-3 w-3 text-white" />
                      Supabase Record
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-5 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-zinc-500">
                    Anchor: Day {client.engagements?.[0]?.billing_anchor_day || 1} of month
                  </span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="btn-pressable text-xs font-bold text-white hover:text-zinc-300 transition-colors"
                  >
                    Open 360 Workspace &rarr;
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
