"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  Ban,
  Send,
} from "lucide-react";
import { INITIAL_CLIENTS, INITIAL_CONTENT_ITEMS, INITIAL_TOOL_EXPENSES } from "@/lib/data/seed-data";

export default function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const client = INITIAL_CLIENTS.find((c) => c.id === resolvedParams.id);

  if (!client) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState<"overview" | "context" | "tools" | "vault">("overview");
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clientPosts = INITIAL_CONTENT_ITEMS.filter((p) => p.client_id === client.id);
  const clientTools = INITIAL_TOOL_EXPENSES.filter((t) => t.client_id === client.id);

  const handleRevealPassword = (credentialName: string) => {
    if (revealedPassword === credentialName) {
      setRevealedPassword(null);
    } else {
      setRevealedPassword(credentialName);
      setToastMessage(`Audit log: Password revealed by Sudeesh D S for ${credentialName}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCopyPassword = (credentialName: string) => {
    navigator.clipboard?.writeText("VentureDebt#2026!Secure");
    setToastMessage(`Audit log: Password copied to clipboard for ${credentialName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
              Founder: <span className="font-semibold text-foreground">{client.founder_name}</span> ({client.founder_title}) &middot;{" "}
              {client.founder_email} &middot; {client.founder_phone}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-canvas px-4 py-2 border border-border-subtle text-right">
              <span className="text-[10px] uppercase font-bold text-foreground-subtle block">
                Total Contract Retainer
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                ₹{client.engagements.reduce((acc, e) => acc + e.monthly_retainer, 0).toLocaleString("en-IN")}/mo
              </span>
            </div>

            <button
              onClick={() => {
                setToastMessage("WhatsApp magic review link generated and copied to clipboard!");
                setTimeout(() => setToastMessage(null), 4000);
              }}
              aria-label="Generate and copy WhatsApp review link"
              className="btn-pressable flex min-h-[40px] items-center gap-2 rounded-lg bg-status-emerald px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-emerald"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Share Review PWA</span>
            </button>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="mt-6 flex border-b border-border-subtle" role="tablist">
          {[
            { key: "overview", label: "Overview & Sprints", icon: FileText },
            { key: "context", label: "Context Intelligence Vault", icon: Sparkles },
            { key: "tools", label: "Tool Expenses & Billing", icon: Wrench },
            { key: "vault", label: "Security & Credentials", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.key as any)}
                className={`btn-pressable flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold ${
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-foreground-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors duration-150 ${isActive ? "text-brand" : "text-foreground-subtle"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content 1: Overview & Content Sprints */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Active Content Queue */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground">
                  Active Content Pipeline ({clientPosts.length})
                </h2>
                <span className="text-xs text-foreground-muted">Live State Machine</span>
              </div>

              <div className="space-y-3">
                {clientPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border-subtle bg-surface p-5 shadow-card hover:shadow-raised transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            post.status === "client_review"
                              ? "bg-status-rose-bg text-status-rose border border-status-rose-border"
                              : post.status === "approved"
                              ? "bg-status-emerald-bg text-status-emerald border border-status-emerald-border"
                              : "bg-status-blue-bg text-status-blue border border-status-blue-border"
                          }`}
                        >
                          {post.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-semibold text-brand">
                          {post.target_pillar}
                        </span>
                      </div>

                      {post.stalled_hours && (
                        <span className="text-[11px] font-semibold text-status-rose flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Stalled {post.stalled_hours}h
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground">{post.title}</h3>
                    <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                      {post.body_markdown}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-border-subtle text-[11px] text-foreground-muted">
                      <span>Writer: <span className="font-medium text-foreground">{post.assigned_writer}</span></span>
                      {post.scheduled_publish_date && (
                        <span className="font-semibold text-status-emerald">
                          Scheduled: {new Date(post.scheduled_publish_date).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Agreements */}
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold text-foreground">Contract Agreements</h2>
              <div className="space-y-3">
                {client.engagements.map((eng) => (
                  <div
                    key={eng.id}
                    className="rounded-xl border border-border-subtle bg-surface p-4 shadow-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {eng.service_type === "linkedin_branding" ? "Personal Branding" : "Cold Outreach"}
                      </span>
                      <span className="rounded bg-status-emerald-bg px-2 py-0.5 text-[10px] font-bold text-status-emerald">
                        Active
                      </span>
                    </div>
                    <div className="text-xs text-foreground-muted">
                      <p>Monthly Retainer: <span className="font-mono font-bold text-foreground">₹{eng.monthly_retainer.toLocaleString("en-IN")}</span></p>
                      <p>Billing Anchor: <span className="font-medium text-foreground">Day {eng.billing_anchor_day} of month</span></p>
                      {eng.renewal_date && (
                        <p>Renewal Date: <span className="font-medium text-foreground">{eng.renewal_date}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Context Intelligence Vault */}
      {activeTab === "context" && client.context && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                <span>FOUNDER INTELLIGENCE &middot; VOICE &amp; POSITIONING</span>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                Client Context Architecture
              </h2>
              <p className="text-xs text-foreground-muted">
                Extracted during onboarding. This context guides every post, ensures tone alignment, and powers the Taboo Word Linter.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1.5 rounded-xl bg-canvas p-4 border border-border-subtle">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                  Core Positioning Statement
                </span>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {client.context.positioning_statement}
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl bg-canvas p-4 border border-border-subtle">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                  Target Audience (ICP)
                </span>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {client.context.target_audience_icp}
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl bg-canvas p-4 border border-border-subtle">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                  Tone Archetype &amp; Voice Cadence
                </span>
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {client.context.tone_archetype} &mdash; {client.context.voice_guidelines}
                </p>
              </div>

              {/* Taboo Word Linter */}
              <div className="space-y-2 rounded-xl bg-status-rose-bg/30 p-4 border border-status-rose-border">
                <div className="flex items-center gap-1.5 text-xs font-bold text-status-rose">
                  <Ban className="h-3.5 w-3.5" />
                  <span>Taboo Words (Strictly Forbidden in Copy)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.context.taboo_words.map((word) => (
                    <span
                      key={word}
                      className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-status-rose border border-status-rose-border"
                    >
                      &times; {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Content Pillars */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                Approved Content Pillars
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {client.context.core_pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface p-3 text-xs font-semibold text-foreground shadow-subtle"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-subtle text-[10px] font-bold text-brand">
                      {idx + 1}
                    </span>
                    <span>{pillar}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Items & Anecdotes */}
            {client.context.knowledge_items && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
                  Verified Anecdotes &amp; Proof Points
                </span>
                <div className="space-y-3">
                  {client.context.knowledge_items.map((k) => (
                    <div
                      key={k.id}
                      className="rounded-xl border border-border-subtle bg-canvas p-4 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{k.title}</span>
                        <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold text-foreground-muted border border-border-subtle">
                          {k.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted leading-relaxed">{k.content}</p>
                      {k.verified_metrics && (
                        <div className="flex gap-4 pt-1 text-[11px] font-semibold text-status-emerald">
                          {Object.entries(k.verified_metrics).map(([key, val]) => (
                            <span key={key}>
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 3: Tool Expenses & Billing */}
      {activeTab === "tools" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  Tool Expenses &amp; Pass-Through Billing
                </h2>
                <p className="text-xs text-foreground-muted">
                  Third-party SaaS costs passed through at actual cost without markup. Automatically drafted into monthly invoices.
                </p>
              </div>

              <button
                onClick={() => {
                  setToastMessage("Drafting ₹24,900 into next retainer invoice");
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-brand-hover active:scale-95 transition-all"
              >
                <span>Draft into October Invoice</span>
              </button>
            </div>

            <div className="space-y-3">
              {clientTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border-subtle bg-canvas p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">{tool.tool_name}</span>
                    <p className="text-xs text-foreground-muted">{tool.description}</p>
                    <span className="text-[10px] text-foreground-subtle block">
                      Incurred on {tool.incurred_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm font-bold text-foreground">
                      ₹{tool.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="rounded-full bg-status-amber-bg px-2 py-0.5 text-[10px] font-bold text-status-amber border border-status-amber-border">
                      {tool.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Security & Credential Vault */}
      {activeTab === "vault" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-card space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                  <Shield className="h-3.5 w-3.5" />
                  <span>AES-256 ENCRYPTED SECURITY VAULT (ADR-002)</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                  Client Account Credentials
                </h2>
                <p className="text-xs text-foreground-muted">
                  Passwords encrypted at rest. Every reveal and copy action is recorded in the immutable audit log.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { platform: "LinkedIn Founder Account", user: "chetan@debtworks.in" },
                { platform: "HeyReach Dedicated Seat", user: "chetan.sender1@debtworks.in" },
                { platform: "Clay Enrichment Account", user: "growth@debtworks.in" },
              ].map((cred, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-canvas p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">{cred.platform}</span>
                    <p className="text-xs text-foreground-muted font-mono">{cred.user}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xs font-medium text-foreground-muted bg-surface px-3 py-1.5 rounded-lg border border-border-subtle">
                      {revealedPassword === cred.platform ? "VentureDebt#2026!Secure" : "••••••••••••••••"}
                    </div>

                    <button
                      onClick={() => handleRevealPassword(cred.platform)}
                      aria-label={`Toggle password visibility for ${cred.platform}`}
                      className="btn-pressable flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground hover:text-brand hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-brand"
                      title="Reveal Password"
                    >
                      {revealedPassword === cred.platform ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyPassword(cred.platform)}
                      aria-label={`Copy encrypted password for ${cred.platform}`}
                      className="btn-pressable flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground hover:text-brand hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-brand"
                      title="Copy to Clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
