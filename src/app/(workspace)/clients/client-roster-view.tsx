"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  LayoutGrid,
  List,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardClientModal } from "@/components/clients/onboard-client-modal";
import { ClientCard } from "@/components/clients/roster/client-card";
import { ClientTable } from "@/components/clients/roster/client-table";
import type { ClientWithEngagements } from "@/types/domain";

interface ClientRosterViewProps {
  initialClients: ClientWithEngagements[];
  tokenMap: Record<string, string>;
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

      {/* Executive Cadence Ribbon */}
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
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              activeToken={tokenMap[client.id]}
              copiedClientId={copiedClientId}
              onCopyReviewLink={copyReviewLink}
            />
          ))}
        </div>
      ) : (
        /* TABLE / MATRIX VIEW: Ultra-Dense Bloomberg/Linear Style Scanner */
        <ClientTable
          filteredClients={filteredClients}
          tokenMap={tokenMap}
        />
      )}
    </div>
  );
}
