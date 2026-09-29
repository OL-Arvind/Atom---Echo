"use client";

import React, { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";

export interface OperationsRequestsTabProps {
  requests: any[];
  isPending: boolean;
  onStatusChange: (requestId: string, newStatus: "submitted" | "in_progress" | "resolved") => void;
  onReleaseHold: (clientId: string) => void;
}

export function OperationsRequestsTab({
  requests,
  isPending,
  onStatusChange,
  onReleaseHold,
}: OperationsRequestsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (categoryFilter !== "all" && req.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === "open") {
        return req.status === "submitted" || req.status === "in_progress";
      }
      if (statusFilter === "resolved") {
        return req.status === "resolved" || req.status === "closed";
      }
      return true;
    });
  }, [requests, categoryFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Cohesive Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
          <div className="w-52">
            <CustomSelect
              size="sm"
              options={[
                { value: "all", label: "All Categories" },
                { value: "emergency_hold", label: "Emergency Holds" },
                { value: "content_pivot", label: "Content Pivots" },
                { value: "design_tweak", label: "Design Tweaks" },
                { value: "tool_issue", label: "Tool Issues" },
                { value: "general_query", label: "General Queries" },
              ]}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>
        </div>

        <SegmentedFilter
          options={[
            {
              id: "open",
              label: "Open / In Progress",
              count: requests.filter(
                (r) => r.status === "submitted" || r.status === "in_progress"
              ).length,
            },
            {
              id: "resolved",
              label: "Resolved",
              count: requests.filter(
                (r) => r.status === "resolved" || r.status === "closed"
              ).length,
            },
            {
              id: "all",
              label: "All",
              count: requests.length,
            },
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as "all" | "open" | "resolved")}
        />
      </div>

      {/* List */}
      {filteredRequests.length === 0 ? (
        <div className="card p-12 text-center text-xs text-[var(--color-ink-tertiary)]">
          No service requests matching the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isHold = req.category === "emergency_hold";
            const isUrgent = req.priority === "urgent";
            const isResolved = req.status === "resolved" || req.status === "closed";

            return (
              <div
                key={req.id}
                className={`card p-4 space-y-3 transition-colors ${
                  isHold
                    ? "border-[var(--color-danger-line)] bg-[var(--color-danger-bg)]/15"
                    : isUrgent
                    ? "border-[var(--color-warn-line)]"
                    : "border-[var(--color-line)]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-sans tabular-nums text-[10.5px] uppercase tracking-wider inline-flex items-center gap-1.5 ${
                          isHold
                            ? "text-[var(--color-danger-text)] font-semibold"
                            : "text-[var(--color-ink-secondary)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isHold ? "bg-[var(--color-danger-text)]" : "bg-[var(--color-ink-muted)]"
                          }`}
                        />
                        {req.category.replace("_", " ")}
                      </span>

                      <span className="font-medium text-xs text-[var(--color-ink)]">
                        {req.clients?.name || "Client"}
                      </span>

                      {req.clients?.founder_name && (
                        <span className="text-[11px] text-[var(--color-ink-tertiary)]">
                          ({req.clients.founder_name})
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-sans tabular-nums uppercase tracking-wider ${
                          req.priority === "urgent"
                            ? "text-[var(--color-danger-text)] font-semibold"
                            : req.priority === "high"
                            ? "text-[var(--color-warn-text)]"
                            : "text-[var(--color-ink-muted)]"
                        }`}
                      >
                        &middot; {req.priority}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-[var(--color-ink)]">
                      {req.title}
                    </h3>

                    {req.description && (
                      <p className="text-xs text-[var(--color-ink-secondary)] whitespace-pre-wrap">
                        {req.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isHold && !isResolved && (
                      <button
                        onClick={() => onReleaseHold(req.client_id)}
                        disabled={isPending}
                        className="btn btn-secondary text-xs"
                      >
                        <span>Resume Publishing</span>
                      </button>
                    )}

                    {!isResolved ? (
                      <div className="flex items-center gap-1.5">
                        {req.status === "submitted" && (
                          <button
                            onClick={() => onStatusChange(req.id, "in_progress")}
                            disabled={isPending}
                            className="btn btn-secondary text-xs"
                          >
                            Mark In Progress
                          </button>
                        )}
                        <button
                          onClick={() => onStatusChange(req.id, "resolved")}
                          disabled={isPending}
                          className="btn btn-primary text-xs"
                        >
                          <span>Resolve</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-sans tabular-nums text-xs text-[var(--color-ink-secondary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ok)]" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-tertiary)] font-sans tabular-nums border-t border-[var(--color-line-subtle)] pt-2">
                  <span>Status: {req.status.replace("_", " ")}</span>
                  <span>
                    {formatDisplayDateTimeIST(req.created_at, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
