"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { EditClientTrigger } from "@/components/clients/edit-client-modal";
import { formatDisplayDateIST } from "@/lib/date-utils";
import { getDaysUntilAnchor } from "./roster-utils";
import type { ClientWithEngagements, Engagement } from "@/types/domain";

interface ClientTableProps {
  filteredClients: ClientWithEngagements[];
  tokenMap: Record<string, string>;
}

export function ClientTable({ filteredClients, tokenMap }: ClientTableProps) {
  return (
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
  );
}
