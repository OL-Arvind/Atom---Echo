"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  ArrowUpRight,
  LayoutGrid,
  List,
  Check,
  Copy,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/ui/brand-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { EditClientTrigger } from "@/components/clients/edit-client-modal";
import { formatDisplayDateIST } from "@/lib/date-utils";
import type { ClientWithEngagements, Engagement } from "@/types/domain";

interface ClientRosterViewProps {
  initialClients: ClientWithEngagements[];
  tokenMap: Record<string, string>;
}

function getDaysUntilAnchor(anchorDay: number): string {
  const today = new Date();
  const currentDay = today.getDate();
  if (currentDay === anchorDay) return "Due today";
  if (currentDay < anchorDay) {
    const diff = anchorDay - currentDay;
    return `In ${diff} day${diff === 1 ? "" : "s"}`;
  }
  const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const diff = lastDayThisMonth - currentDay + anchorDay;
  return `In ${diff} days`;
}

export function ClientRosterView({
  initialClients,
  tokenMap,
}: ClientRosterViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "attention" | "scheduled">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyReviewLink = (clientId: string, token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedClientId(clientId);
    showToast("Copied founder 1-tap review link to clipboard");
    setTimeout(() => setCopiedClientId(null), 2000);
  };

  // High-level statistics
  const totalClients = initialClients.length;
  const activeClients = initialClients.filter((c) => c.status?.toLowerCase() === "active");
  const totalEngagements = initialClients.reduce(
    (acc, c) => acc + (c.engagements || []).length,
    0
  );
  const totalContractedMrr = initialClients.reduce((acc, c) => {
    const clientEngs = c.engagements || [];
    const clientTotal = clientEngs.reduce(
      (eAcc, e) => eAcc + Number(e.monthly_retainer || 0),
      0
    );
    return acc + clientTotal;
  }, 0);

  // Cadence counts
  let onCadenceCount = 0;
  let needsContentCount = 0;

  initialClients.forEach((client) => {
    const allPosts = (client.engagements || []).flatMap((e) => e.content_items || []);
    const scheduled = allPosts.some((p) => p.status === "scheduled" || p.status === "approved");
    if (scheduled) {
      onCadenceCount++;
    } else {
      needsContentCount++;
    }
  });

  // Filter clients
  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = client.name?.toLowerCase().includes(q);
        const matchesFounder = client.founder_name?.toLowerCase().includes(q);
        const matchesTitle = client.founder_title?.toLowerCase().includes(q);
        if (!matchesName && !matchesFounder && !matchesTitle) return false;
      }

      // Status tab filter
      const isActive = client.status?.toLowerCase() === "active";
      const allPosts = (client.engagements || []).flatMap((e) => e.content_items || []);
      const scheduled = allPosts.some((p) => p.status === "scheduled" || p.status === "approved");

      if (statusFilter === "active") return isActive;
      if (statusFilter === "attention") return !scheduled && isActive;
      if (statusFilter === "scheduled") return scheduled;
      return true;
    });
  }, [initialClients, searchQuery, statusFilter]);

  return (
    <div className="w-full space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Client Roster"
        description="Ambitious founders and VCs building authority and compounding reputation."
      >
        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <SegmentedFilter
            options={[
              {
                id: "grid",
                label: "Cards",
                icon: <LayoutGrid className="h-3.5 w-3.5" />,
              },
              {
                id: "table",
                label: "Matrix",
                icon: <List className="h-3.5 w-3.5" />,
              },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as "grid" | "table")}
          />

          <OnboardClientModal buttonText="Onboard Founder" />
        </div>
      </PageHeader>

      {/* Executive Cadence Ribbon (Standardized MetricRibbon with exact var(--radius-md) 8px radius) */}
      <MetricRibbon
        items={[
          {
            label: "Contracted Retainers",
            value: `₹${totalContractedMrr.toLocaleString("en-IN")}`,
            subtext: `(${totalEngagements} ${totalEngagements === 1 ? "stream" : "streams"})`,
          },
          {
            label: "Active Accounts",
            value: activeClients.length,
            subtext: `/ ${totalClients} retained`,
          },
          {
            label: "Publishing Cadence",
            value: (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span>{onCadenceCount} on track</span>
                <span className="text-[var(--color-ink-ghost)]">&middot;</span>
                <span className="font-medium text-[var(--color-ink-muted)]">
                  {needsContentCount} need content
                </span>
              </span>
            ),
          },
          {
            label: "Tool Pass-Throughs",
            value: <span className="font-medium text-[var(--color-ink-secondary)]">100% (zero markup)</span>,
          },
        ]}
      />

      {/* Filter and Instant Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-line-subtle)] pb-3">
        {/* Status Filter Segmented Controls */}
        <SegmentedFilter
          options={[
            { id: "all", label: "All Accounts", count: initialClients.length },
            { id: "active", label: "Active", count: activeClients.length },
            { id: "attention", label: "Needs Content", count: needsContentCount },
            { id: "scheduled", label: "On Cadence", count: onCadenceCount },
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as "all" | "active" | "attention" | "scheduled")}
        />

        {/* Search input */}
        {/* Standardized Search Input */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search founders or brands..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Main View: Grid vs Table */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            searchQuery || statusFilter !== "all"
              ? "No matching founders found"
              : "No founder accounts yet"
          }
          description={
            searchQuery || statusFilter !== "all"
              ? "Try clearing your search query or switching your active filters to locate the client account."
              : "Onboard your first founder to capture their conviction, shape stories, and set up their private Founder Desk."
          }
          action={
            searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="btn btn-secondary text-xs"
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW: High-Craft Operational Cards */
        <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const isActive = client.status?.toLowerCase() === "active";
            const engagements = client.engagements || [];
            const clientMrr = engagements.reduce(
              (acc: number, e: Engagement) => acc + Number(e.monthly_retainer || 0),
              0
            );
            const anchorDay = engagements[0]?.billing_anchor_day || 1;
            const allPosts = engagements.flatMap((e) => e.content_items || []);

            const scheduledPosts = allPosts.filter(
              (p) => p.status === "scheduled" || p.status === "approved"
            );
            const reviewPosts = allPosts.filter((p) => p.status === "client_review");
            const draftPosts = allPosts.filter(
              (p) => p.status === "draft" || p.status === "internal_review"
            );

            const activeToken = tokenMap[client.id];

            // Primary cadence signal
            const nextScheduled = scheduledPosts[0];
            const nextReview = reviewPosts[0];
            const nextDraft = draftPosts[0];

            return (
              <div
                key={client.id}
                className="group card p-5 flex flex-col justify-between space-y-4 hover:border-[var(--color-line-strong)] transition-all bg-[var(--color-surface)] shadow-card"
              >
                <div className="space-y-4">
                  {/* Top Row: Brand & Founder Info + Quick Controls */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BrandLogo
                        nameOrDomain={
                          client.website_url || client.website || client.founder_email || client.name
                        }
                        size={38}
                        className="h-9 w-9 object-contain rounded-md shrink-0 border border-[var(--color-line-subtle)]"
                        fallback={
                          <UserAvatar
                            seed={client.founder_name || client.name}
                            size={38}
                            className="rounded-md"
                            alt={client.founder_name || client.name}
                          />
                        }
                      />
                      <div className="min-w-0 leading-snug">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-[14.5px] font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors truncate font-display tracking-tight"
                          >
                            {client.name}
                          </Link>
                          {/* Calm Status Dot */}
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isActive ? "bg-emerald-500" : "bg-[var(--color-ink-muted)]"
                            }`}
                            title={isActive ? "Active Retainer Account" : "Paused / Inactive"}
                          />
                        </div>
                        <p className="text-xs text-[var(--color-ink-secondary)] truncate mt-0.5">
                          {client.founder_name}{" "}
                          {client.founder_title ? `· ${client.founder_title}` : "· Founder"}
                        </p>
                      </div>
                    </div>

                    {/* Toolbar Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {client.linkedin_url && (
                        <a
                          href={client.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-1.5 rounded-md text-[var(--color-ink-tertiary)] hover:text-[#0A66C2] hover:bg-[var(--color-base-subtle)] active:scale-[0.92] transition-all cursor-pointer"
                          title={`Open ${client.founder_name}'s LinkedIn Profile`}
                        >
                          <LinkedInIcon size={15} color="brand" />
                        </a>
                      )}
                      {activeToken && (
                        <button
                          type="button"
                          onClick={() => copyReviewLink(client.id, activeToken)}
                          className="flex items-center justify-center p-1.5 rounded-md text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] active:scale-[0.92] transition-all cursor-pointer"
                          title="Copy 1-tap Founder Review Link"
                        >
                          {copiedClientId === client.id ? (
                            <Check className="h-3.5 w-3.5 text-[var(--color-ok)]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <EditClientTrigger client={client} />
                    </div>
                  </div>

                  {/* Operational Cadence Anchor */}
                  <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1 space-y-1">
                    {nextScheduled ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-secondary)] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)] shrink-0" />
                          <span>Cadence Locked</span>
                          <span className="text-[var(--color-ink-muted)] font-normal lowercase">
                            &middot; {scheduledPosts.length} ready
                          </span>
                        </div>
                        <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                          &ldquo;{nextScheduled.title || "Perspective Locked"}&rdquo;
                        </p>
                        <span className="text-[11px] font-sans text-[var(--color-ink-muted)] tabular-nums block">
                          Slot: {formatDisplayDateIST(nextScheduled.scheduled_publish_date)}
                        </span>
                      </div>
                    ) : nextReview ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                          <span>Founder Review Pending</span>
                        </div>
                        <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                          &ldquo;{nextReview.title || "Draft Ready"}&rdquo;
                        </p>
                        <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                          Awaiting 1-tap sign-off on Founder Desk
                        </span>
                      </div>
                    ) : nextDraft ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-secondary)] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)] shrink-0" />
                          <span>Internal Voice QA</span>
                        </div>
                        <p className="text-[13px] text-[var(--color-ink)] font-medium truncate">
                          &ldquo;{nextDraft.title || "Working Draft"}&rdquo;
                        </p>
                        <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                          {draftPosts.length} draft{draftPosts.length > 1 ? "s" : ""} in refinement
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-warn-text)] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                          <span>Cadence Stalled</span>
                        </div>
                        <p className="text-[13px] text-[var(--color-ink-secondary)]">
                          0 active perspectives queued
                        </p>
                        <span className="text-[11px] font-sans text-[var(--color-ink-muted)] block">
                          Capture founder convictions in workspace
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Single Unified Footer: Retainer Vitals (Left) + Workspace Entry (Right) */}
                <div className="border-t border-[var(--color-line-subtle)] pt-3.5 flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-base font-semibold text-[var(--color-ink)] tabular-nums leading-none">
                        ₹{clientMrr.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] font-sans text-[var(--color-ink-muted)]">
                        /mo
                      </span>
                    </div>
                    <span className="text-[11px] font-sans text-[var(--color-ink-tertiary)] tabular-nums block mt-1">
                      Anchor {anchorDay}th &middot; {getDaysUntilAnchor(anchorDay)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeToken && (
                      <a
                        href={`/review/${activeToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11.5px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 transition-colors px-1.5 py-1"
                        title="Open Live Founder Review PWA"
                      >
                        <span>Portal</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                    <Link
                      href={`/clients/${client.id}`}
                      prefetch={true}
                      className="btn btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 group/link"
                    >
                      <span>Workspace</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / MATRIX VIEW: Ultra-Dense Bloomberg/Linear Style Scanner */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-base-raised)] text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                  <th className="py-3 px-4 font-medium">Founder &amp; Company</th>
                  <th className="py-3 px-4 font-medium">Retainer &amp; Scope</th>
                  <th className="py-3 px-4 font-medium">Cadence Health</th>
                  <th className="py-3 px-4 font-medium">Billing Cycle</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line-subtle)]">
                {filteredClients.map((client) => {
                  const isActive = client.status?.toLowerCase() === "active";
                  const engagements = client.engagements || [];
                  const clientMrr = engagements.reduce(
                    (acc: number, e: Engagement) => acc + Number(e.monthly_retainer || 0),
                    0
                  );
                  const anchorDay = engagements[0]?.billing_anchor_day || 1;
                  const allPosts = engagements.flatMap((e) => e.content_items || []);

                  const scheduledPosts = allPosts.filter(
                    (p) => p.status === "scheduled" || p.status === "approved"
                  );
                  const reviewPosts = allPosts.filter((p) => p.status === "client_review");
                  const draftPosts = allPosts.filter(
                    (p) => p.status === "draft" || p.status === "internal_review"
                  );

                  const activeToken = tokenMap[client.id];
                  const nextScheduled = scheduledPosts[0];

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[var(--color-surface-hover)] transition-colors group"
                    >
                      {/* Column 1: Founder & Brand */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <BrandLogo
                            nameOrDomain={
                              client.website_url || client.website || client.founder_email || client.name
                            }
                            size={32}
                            className="h-8 w-8 object-contain rounded-md shrink-0 border border-[var(--color-line-subtle)]"
                            fallback={
                              <UserAvatar
                                seed={client.founder_name || client.name}
                                size={32}
                                className="rounded-md"
                                alt={client.founder_name || client.name}
                              />
                            }
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/clients/${client.id}`}
                                className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors font-display tracking-tight text-[13.5px]"
                              >
                                {client.name}
                              </Link>
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isActive ? "bg-emerald-500" : "bg-[var(--color-ink-muted)]"
                                }`}
                              />
                              {client.linkedin_url && (
                                <a
                                  href={client.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--color-ink-muted)] hover:text-[#0A66C2] transition-colors ml-0.5"
                                >
                                  <LinkedInIcon size={13} color="brand" />
                                </a>
                              )}
                            </div>
                            <span className="text-[11.5px] text-[var(--color-ink-secondary)]">
                              {client.founder_name} {client.founder_title ? `· ${client.founder_title}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Retainer & Service */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-[var(--color-ink)] tabular-nums">
                            ₹{clientMrr.toLocaleString("en-IN")}{" "}
                            <span className="font-normal text-[11px] text-[var(--color-ink-tertiary)]">
                              / mo
                            </span>
                          </span>
                          <p className="text-[11px] text-[var(--color-ink-muted)] truncate max-w-xs">
                            {engagements[0]?.service_type === "linkedin_branding"
                              ? "LinkedIn Thought Leadership"
                              : engagements[0]?.service_type === "cold_outreach"
                              ? "Cold Outbound Growth"
                              : "Growth Retainer"}
                          </p>
                        </div>
                      </td>

                      {/* Column 3: Cadence Health */}
                      <td className="py-3 px-4">
                        {nextScheduled ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Locked for {formatDisplayDateIST(nextScheduled.scheduled_publish_date)}
                            </span>
                            <p className="text-[11px] text-[var(--color-ink-muted)] truncate max-w-xs">
                              &ldquo;{nextScheduled.title}&rdquo;
                            </p>
                          </div>
                        ) : reviewPosts.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            {reviewPosts.length} awaiting founder sign-off
                          </span>
                        ) : draftPosts.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)] font-medium text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink-muted)]" />
                            {draftPosts.length} draft in voice QA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--color-warn-text)] text-[11px] font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Cadence stalled (0 queued)
                          </span>
                        )}
                      </td>

                      {/* Column 4: Billing Cycle */}
                      <td className="py-3 px-4">
                        <span className="text-[11.5px] font-sans text-[var(--color-ink-secondary)] tabular-nums block">
                          Anchor: {anchorDay}th
                        </span>
                        <span className="text-[10.5px] font-sans text-[var(--color-ink-muted)]">
                          {getDaysUntilAnchor(anchorDay)}
                        </span>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeToken && (
                            <a
                              href={`/review/${activeToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary text-[11px] px-2.5 py-1"
                              title="Open Live Founder Review PWA"
                            >
                              Review PWA ↗
                            </a>
                          )}
                          <Link
                            href={`/clients/${client.id}`}
                            className="btn btn-primary text-[11px] px-2.5 py-1"
                          >
                            Workspace →
                          </Link>
                          <EditClientTrigger client={client} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
