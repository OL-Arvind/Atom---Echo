"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Sparkles,
  Shield,
  FileText,
  Wrench,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ClientWorkspaceViewProps {
  client: any;
}

export function ClientWorkspaceView({ client }: ClientWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "context" | "tools" | "vault">("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clientPosts = client.content_items || [];
  const clientTools = client.tool_expenses || [];
  const context = client.context || null;

  const totalRetainer = (client.engagements || []).reduce(
    (acc: number, e: any) => acc + Number(e.monthly_retainer || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-stagger-1 text-white">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="btn-pressable flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Clients Directory</span>
        </Link>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white border border-zinc-700 shadow-lg animate-stagger-1">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Client 360 Header */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                {client.name}
              </h1>
              <span className="rounded-full bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-200">
                {client.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Founder: <span className="font-semibold text-white">{client.founder_name}</span>{" "}
              {client.founder_title && `(${client.founder_title})`}{" "}
              {client.founder_email && `· ${client.founder_email}`}{" "}
              {client.founder_phone && `· ${client.founder_phone}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-zinc-900/80 px-4 py-2 border border-zinc-800 text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
                Total Monthly Retainer
              </span>
              <span className="tabular-numbers font-mono text-lg font-bold text-white">
                ₹{totalRetainer.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="mt-6 flex border-b border-zinc-800/80 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`btn-pressable flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "overview"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Engagements &amp; Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("context")}
            className={`btn-pressable flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "context"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Voice &amp; Context Vault</span>
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`btn-pressable flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tools"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Tool Expenses ({clientTools.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`btn-pressable flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "vault"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Credential Vault</span>
          </button>
        </div>
      </div>

      {/* Tab Content 1: Overview & Pipeline */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Services */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(client.engagements || []).map((eng: any) => (
              <div
                key={eng.id}
                className="rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {eng.service_type === "linkedin_branding"
                      ? "LinkedIn Personal Branding"
                      : "Cold Outreach & Lead Gen"}
                  </span>
                  <span className="rounded-full bg-zinc-900 border border-zinc-700 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
                    {eng.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs pt-1">
                  <span className="text-zinc-400">Monthly Retainer:</span>
                  <span className="tabular-numbers font-mono font-bold text-white">
                    ₹{Number(eng.monthly_retainer || 0).toLocaleString("en-IN")}/mo
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-zinc-400">Billing Anchor:</span>
                  <span className="font-mono text-zinc-300">Day {eng.billing_anchor_day} of each month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content Pipeline */}
          <div className="rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Content Production Pipeline
              </h2>
              <span className="font-mono text-xs text-zinc-400">{clientPosts.length} items</span>
            </div>

            {clientPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400">
                No content items drafted for this client yet. Use the command center to create the first post.
              </div>
            ) : (
              <div className="space-y-3">
                {clientPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="card-interactive flex flex-col justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{post.title}</span>
                        <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-300">
                          {post.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                        {post.body_markdown}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.target_pillar || "General"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Context Vault */}
      {activeTab === "context" && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-6">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Founder Voice &amp; Positioning Vault
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Permanent context compounding to eliminate AI fluff and tone drift.
            </p>
          </div>

          {!context ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400">
              No context rules configured yet. Edit client context to record taboo words, voice guidelines, and core pillars.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    Positioning Statement
                  </span>
                  <p className="rounded-lg bg-zinc-900/70 p-3 text-xs leading-relaxed text-zinc-200 border border-zinc-800">
                    {context.positioning_statement || "Not yet set"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    Target Audience / ICP
                  </span>
                  <p className="rounded-lg bg-zinc-900/70 p-3 text-xs leading-relaxed text-zinc-200 border border-zinc-800">
                    {context.target_audience_icp || "Not yet set"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    Tone Archetype
                  </span>
                  <p className="rounded-lg bg-zinc-900/70 p-3 text-xs leading-relaxed text-zinc-200 border border-zinc-800">
                    {context.tone_archetype || "Not yet set"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    Taboo Words (Strict Negative Guardrails)
                  </span>
                  <div className="flex flex-wrap gap-1.5 rounded-lg bg-zinc-900/70 p-3 border border-zinc-800">
                    {(context.taboo_words || []).length === 0 ? (
                      <span className="text-xs text-zinc-500">No taboo words registered</span>
                    ) : (
                      context.taboo_words.map((w: string) => (
                        <span
                          key={w}
                          className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-300"
                        >
                          ✕ {w}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Tool Expenses */}
      {activeTab === "tools" && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-4">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Pass-Through Tool Expenses
            </h2>
            <p className="text-xs text-zinc-400">
              Software subscriptions (Clay, Instantly, Apollo) billed directly to the client.
            </p>
          </div>

          {clientTools.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400">
              Zero pass-through expenses logged. When tools are purchased on behalf of this client, they will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {clientTools.map((tool: any) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{tool.description}</span>
                    <span className="text-zinc-500 text-[11px] font-mono">Incurred: {tool.incurred_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="tabular-numbers font-mono font-bold text-white block">
                      ₹{Number(tool.amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400">
                      {tool.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Credential Vault */}
      {activeTab === "vault" && (
        <div className="rounded-xl border border-zinc-800/80 bg-[#0C0C0E] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.5)] space-y-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-white" />
              <span>AES-256-GCM ENCRYPTED SECURITY VAULT</span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-white">
              Client Account Credentials
            </h2>
            <p className="text-xs text-zinc-400">
              Passwords and session cookies encrypted at rest. Reveal and copy actions are audited.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-400">
            No credentials stored in this client&apos;s vault yet. Add client platform logins (LinkedIn, Clay seats) during formal onboarding.
          </div>
        </div>
      )}
    </div>
  );
}
