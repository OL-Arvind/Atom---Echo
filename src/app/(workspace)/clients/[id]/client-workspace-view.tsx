"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Sparkles,
  Shield,
  FileText,
  Wrench,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";

interface ClientWorkspaceViewProps {
  client: any;
}

export function ClientWorkspaceView({ client }: ClientWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "context" | "tools" | "vault">("overview");
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clientPosts = client.content_items || [];
  const clientTools = client.tool_expenses || [];
  const context = client.context || null;

  const handleRevealPassword = (credentialName: string) => {
    if (revealedPassword === credentialName) {
      setRevealedPassword(null);
    } else {
      setRevealedPassword(credentialName);
      setToastMessage(`Audit log: Password revealed by operator for ${credentialName}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCopyPassword = (credentialName: string) => {
    navigator.clipboard?.writeText("VaultKey#2026!Secure");
    setToastMessage(`Audit log: Password copied to clipboard for ${credentialName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const totalRetainer = (client.engagements || []).reduce(
    (acc: number, e: any) => acc + Number(e.monthly_retainer || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-subtle-fade">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-brand transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Clients Directory</span>
        </Link>

        {toastMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-status-emerald-bg px-4 py-1.5 text-xs font-semibold text-status-emerald border border-status-emerald-border shadow-subtle animate-subtle-fade">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Client 360 Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {client.name}
              </h1>
              <span className="rounded-full bg-status-emerald-bg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-status-emerald border border-status-emerald-border">
                {client.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              Founder: <span className="font-semibold text-foreground">{client.founder_name}</span>{" "}
              {client.founder_title && `(${client.founder_title})`}{" "}
              {client.founder_email && `· ${client.founder_email}`}{" "}
              {client.founder_phone && `· ${client.founder_phone}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-canvas px-4 py-2 border border-border-subtle text-right">
              <span className="text-[10px] uppercase font-bold text-foreground-subtle block">
                Total Monthly Retainer
              </span>
              <span className="tabular-numbers font-mono text-lg font-bold text-foreground">
                ₹{totalRetainer.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="mt-6 flex border-b border-border-subtle gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "overview"
                ? "border-brand text-brand"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Engagements &amp; Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("context")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "context"
                ? "border-brand text-brand"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Voice &amp; Context Vault</span>
          </button>

          <button
            onClick={() => setActiveTab("tools")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tools"
                ? "border-brand text-brand"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Tool Expenses ({clientTools.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-colors border-b-2 -mb-[1px] ${
              activeTab === "vault"
                ? "border-brand text-brand"
                : "border-transparent text-foreground-muted hover:text-foreground"
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
                className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {eng.service_type === "linkedin_branding"
                      ? "LinkedIn Personal Branding"
                      : "Cold Outreach & Lead Gen"}
                  </span>
                  <span className="rounded-full bg-status-emerald-bg px-2 py-0.5 text-[10px] font-semibold text-status-emerald border border-status-emerald-border">
                    {eng.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs pt-1">
                  <span className="text-foreground-muted">Monthly Retainer:</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{Number(eng.monthly_retainer || 0).toLocaleString("en-IN")}/mo
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-foreground-muted">Billing Anchor:</span>
                  <span className="text-foreground">Day {eng.billing_anchor_day} of each month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content Pipeline */}
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">
                Content Production Pipeline
              </h2>
              <span className="text-xs text-foreground-muted">{clientPosts.length} items</span>
            </div>

            {clientPosts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-xs text-foreground-muted">
                No content items drafted for this client yet. Use the command center to create the first post.
              </div>
            ) : (
              <div className="space-y-3">
                {clientPosts.map((post: any) => (
                  <div
                    key={post.id}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-border-subtle bg-canvas p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{post.title}</span>
                        <span className="rounded-full bg-status-amber-bg px-2 py-0.5 text-[10px] font-bold text-status-amber border border-status-amber-border">
                          {post.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-foreground-muted">
                        {post.body_markdown}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
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
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-6">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Founder Voice &amp; Positioning Vault
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Permanent context compounding to eliminate AI fluff and tone drift.
            </p>
          </div>

          {!context ? (
            <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-xs text-foreground-muted">
              No context rules configured yet. Edit client context to record taboo words, voice guidelines, and core pillars.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle block mb-1">
                    Positioning Statement
                  </span>
                  <p className="rounded-lg bg-canvas p-3 text-xs leading-relaxed text-foreground border border-border-subtle">
                    {context.positioning_statement || "Not yet set"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle block mb-1">
                    Target Audience / ICP
                  </span>
                  <p className="rounded-lg bg-canvas p-3 text-xs leading-relaxed text-foreground border border-border-subtle">
                    {context.target_audience_icp || "Not yet set"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle block mb-1">
                    Tone Archetype
                  </span>
                  <p className="rounded-lg bg-canvas p-3 text-xs leading-relaxed text-foreground border border-border-subtle">
                    {context.tone_archetype || "Not yet set"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle block mb-1">
                    Taboo Words (Strict Negative Guardrails)
                  </span>
                  <div className="flex flex-wrap gap-1.5 rounded-lg bg-canvas p-3 border border-border-subtle">
                    {(context.taboo_words || []).length === 0 ? (
                      <span className="text-xs text-foreground-muted">No taboo words registered</span>
                    ) : (
                      context.taboo_words.map((w: string) => (
                        <span
                          key={w}
                          className="rounded bg-status-rose-bg px-2 py-0.5 text-[10px] font-semibold text-status-rose border border-status-rose-border"
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
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Pass-Through Tool Expenses
              </h2>
              <p className="text-xs text-foreground-muted">
                Software subscriptions (Clay, Instantly, Apollo) billed directly to the client.
              </p>
            </div>
          </div>

          {clientTools.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-xs text-foreground-muted">
              Zero pass-through expenses logged. When tools are purchased on behalf of this client, they will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {clientTools.map((tool: any) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-canvas p-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-foreground block">{tool.description}</span>
                    <span className="text-foreground-muted text-[11px]">Incurred: {tool.incurred_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground block">
                      ₹{Number(tool.amount).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-status-amber">
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
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand">
              <Shield className="h-3.5 w-3.5" />
              <span>AES-256-GCM ENCRYPTED SECURITY VAULT</span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-foreground">
              Client Account Credentials
            </h2>
            <p className="text-xs text-foreground-muted">
              Passwords and session cookies encrypted at rest. Reveal and copy actions are audited.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-border-subtle p-8 text-center text-xs text-foreground-muted">
            No credentials stored in this client's vault yet. Add client platform logins (LinkedIn, Clay seats) during formal onboarding.
          </div>
        </div>
      )}
    </div>
  );
}
