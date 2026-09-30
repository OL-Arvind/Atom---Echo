"use client";

import React, { useState, useMemo } from "react";
import { StudioMatrixRow } from "./studio-matrix-row";

export interface StudioMatrixViewProps {
  engagements: any[];
  posts: any[];
  selectedClientId?: string;
  isPending: boolean;
  copiedId: string | null;
  onStatusTransition: (post: any, newStatus: string) => void;
  onCopyReviewLink: (post: any) => void;
  onOpenWhatsApp: (post: any) => void;
  onSetPublishingPost: (post: any) => void;
}

export function StudioMatrixView({
  engagements,
  posts,
  selectedClientId = "all",
  isPending,
  copiedId,
  onStatusTransition,
  onCopyReviewLink,
  onOpenWhatsApp,
  onSetPublishingPost,
}: StudioMatrixViewProps) {
  // Map of clientId -> expanded boolean (default all expanded)
  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>({});

  const toggleClient = (clientId: string) => {
    setCollapsedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Group engagements uniquely by client
  const clientGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        founderName: string;
        serviceType: string;
        websiteUrl?: string;
        founderEmail?: string;
        founderPhone?: string;
        posts: any[];
      }
    >();

    // Initialize from active engagements
    for (const eng of engagements) {
      const cId = eng.clientId;
      if (!cId) continue;
      if (!map.has(cId)) {
        map.set(cId, {
          clientId: cId,
          clientName: eng.clientName || "Client",
          founderName: eng.founderName || "Founder",
          serviceType: eng.serviceType || "linkedin_branding",
          websiteUrl: eng.websiteUrl || eng.website_url || eng.clients?.website_url,
          founderEmail: eng.founderEmail || eng.founder_email || eng.clients?.founder_email,
          founderPhone: eng.founderPhone || eng.founder_phone || eng.clients?.founder_phone,
          posts: [],
        });
      }
    }

    // Populate posts into their respective client group
    for (const post of posts) {
      const c = post.engagements?.clients;
      const cId = c?.id || post.engagements?.client_id;
      if (!cId) continue;

      if (!map.has(cId)) {
        map.set(cId, {
          clientId: cId,
          clientName: c?.name || "Client",
          founderName: c?.founder_name || "Founder",
          serviceType: post.engagements?.service_type || "linkedin_branding",
          websiteUrl: c?.website_url,
          founderEmail: c?.founder_email,
          founderPhone: c?.founder_phone,
          posts: [],
        });
      }
      map.get(cId)!.posts.push(post);
    }

    return Array.from(map.values());
  }, [engagements, posts]);

  const filteredGroups = useMemo(() => {
    if (!selectedClientId || selectedClientId === "all") return clientGroups;
    return clientGroups.filter((g) => g.clientId === selectedClientId);
  }, [clientGroups, selectedClientId]);

  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  if (filteredGroups.length === 0) {
    return (
      <div className="px-5 py-12 lg:px-7 text-center text-xs text-[var(--color-ink-tertiary)] border-b border-[var(--color-line-subtle)]">
        No active perspectives or clients matching the current filter.
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--color-surface)]">
      {/* ─── ARCHITECTURAL TABLE LEDGER HEADER (Desktop) ─── */}
      <div className="hidden lg:grid grid-cols-[1fr_repeat(4,92px)_130px] items-center px-5 py-2.5 lg:px-7 bg-[var(--color-base-subtle)]/70 border-b border-[var(--color-line-subtle)] text-[10px] font-sans uppercase tracking-widest text-[var(--color-ink-tertiary)] font-medium">
        <div>Cadence Track &amp; Founder</div>
        <div className="text-center">Drafting</div>
        <div className="text-center">Founder Desk</div>
        <div className="text-center">Scheduled</div>
        <div className="text-center">Published (7d)</div>
        <div className="text-right pr-1">Action</div>
      </div>

      {/* ─── CLIENT CADENCE ROWS ─── */}
      <div className="divide-y divide-[var(--color-line-subtle)]">
        {filteredGroups.map((group) => (
          <StudioMatrixRow
            key={group.clientId}
            group={group}
            isCollapsed={Boolean(collapsedClients[group.clientId])}
            onToggleCollapse={() => toggleClient(group.clientId)}
            isPending={isPending}
            copiedId={copiedId}
            sevenDaysAgo={sevenDaysAgo}
            onStatusTransition={onStatusTransition}
            onCopyReviewLink={onCopyReviewLink}
            onOpenWhatsApp={onOpenWhatsApp}
            onSetPublishingPost={onSetPublishingPost}
          />
        ))}
      </div>
    </div>
  );
}
