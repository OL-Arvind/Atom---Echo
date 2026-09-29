"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  ArrowRight,
  X,
} from "lucide-react";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import type { CalendarEvent } from "./types";

export interface CalendarEventDrawerProps {
  selectedEvent: CalendarEvent | null;
  onClose: () => void;
}

export function CalendarEventDrawer({
  selectedEvent,
  onClose,
}: CalendarEventDrawerProps) {
  if (!selectedEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="h-full w-full max-w-md bg-[var(--color-base-raised)] border-l border-[var(--color-line)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="font-sans tabular-nums text-xs uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
                Schedule Detail · {selectedEvent.type === "content" ? "Perspective Release" : selectedEvent.type === "billing" ? "Retainer Cycle" : "Tool Subscription"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Event Title & Client */}
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-normal text-[var(--color-ink)]">
              {selectedEvent.title}
            </h3>
            <p className="text-xs text-[var(--color-ink-secondary)]">
              Founder Account: <strong className="text-[var(--color-ink)] font-medium">{selectedEvent.clientName}</strong>
            </p>
            <div className="flex items-center gap-2 text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)] pt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Scheduled: {formatDisplayDateTimeIST(selectedEvent.date, true)}
              </span>
            </div>
          </div>

          {/* Body Content if Post */}
          {selectedEvent.type === "content" && selectedEvent.rawItem && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-ink-tertiary)]">Status:</span>
                <span className="font-sans tabular-nums uppercase font-semibold text-[var(--color-accent-text)]">
                  {selectedEvent.rawItem.status}
                </span>
              </div>
              {selectedEvent.rawItem.target_pillar && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-ink-tertiary)]">Target Pillar:</span>
                  <span className="text-[var(--color-ink)] font-medium">
                    {selectedEvent.rawItem.target_pillar}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <span className="font-sans tabular-nums text-[10px] uppercase text-[var(--color-ink-tertiary)] block font-medium">
                  Perspective Preview:
                </span>
                <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base)] p-3.5 text-xs text-[var(--color-ink-secondary)] font-sans max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.rawItem.body_markdown || "No draft available."}
                </div>
              </div>
            </div>
          )}

          {/* Billing Item Details */}
          {selectedEvent.type === "billing" && (
            <div className="space-y-3 pt-2">
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-4 border border-[var(--color-line)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-ink-tertiary)]">Monthly Retainer:</span>
                  <span className="font-sans tabular-nums font-bold text-[var(--color-ink)]">
                    ₹{Number(selectedEvent.rawItem.monthly_retainer || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-ink-tertiary)]">Anchor Day:</span>
                  <span className="font-sans tabular-nums text-[var(--color-accent-text)]">
                    Day {selectedEvent.rawItem.billing_anchor_day} of each month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-ink-tertiary)]">Engagement Tier:</span>
                  <span className="font-medium text-[var(--color-ink)]">
                    {selectedEvent.rawItem.service_type?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] text-[var(--color-ink-tertiary)]">
                Retainer invoices are generated automatically 7 days prior to the anchor day, bundling dedicated client software pass-throughs.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-[var(--color-line-subtle)] pt-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary text-xs flex-1"
          >
            Close
          </button>

          {selectedEvent.type === "content" && (
            <>
              {selectedEvent.rawItem.linkedin_post_url && (
                <a
                  href={selectedEvent.rawItem.linkedin_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs flex-1 inline-flex items-center justify-center gap-1.5 text-[var(--color-ok-text)]"
                >
                  <span>View on LinkedIn</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Link
                href={`/content/${selectedEvent.rawItem.id}?from=calendar`}
                className="btn btn-primary text-xs flex-1 inline-flex items-center justify-center gap-1.5"
              >
                <span>Refine in Studio</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </>
          )}

          {selectedEvent.type === "billing" && (
            <Link
              href="/billing"
              className="btn btn-primary text-xs flex-1 inline-flex items-center justify-center gap-1.5"
            >
              <span>View Retainers &amp; Billing</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
