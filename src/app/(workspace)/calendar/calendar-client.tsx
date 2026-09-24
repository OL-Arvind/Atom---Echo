"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  CreditCard,
  Wrench,
  Clock,
  ExternalLink,
  X,
  CheckCircle2,
  CalendarDays,
  List,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomSelect } from "@/components/ui/custom-select";

interface CalendarClientProps {
  initialContentPosts: any[];
  engagements: any[];
  toolSubscriptions: any[];
  clients: any[];
}

type CalendarView = "month" | "week" | "agenda";

interface CalendarEvent {
  id: string;
  type: "content" | "billing" | "tool";
  title: string;
  subtitle?: string;
  date: Date;
  dateString: string; // YYYY-MM-DD
  status?: string;
  clientName: string;
  clientId?: string;
  rawItem: any;
}

export function CalendarClient({
  initialContentPosts,
  engagements,
  toolSubscriptions,
  clients,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 1. Build Operational Temporal Projection (ADR-001)
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // A. Scheduled Content Posts
    initialContentPosts.forEach((post) => {
      if (!post.scheduled_publish_date) return;
      const d = new Date(post.scheduled_publish_date);
      const client = post.engagements?.clients;
      const dateStr = d.toISOString().split("T")[0];

      events.push({
        id: `post-${post.id}`,
        type: "content",
        title: post.title,
        subtitle: client?.founder_name || client?.name || "Client",
        date: d,
        dateString: dateStr,
        status: post.status,
        clientName: client?.name || "Client",
        clientId: client?.id,
        rawItem: post,
      });
    });

    // B. Projected Billing Anchor Days for Current & Surrounding Months
    engagements.forEach((eng) => {
      if (!eng.billing_anchor_day || eng.status !== "active") return;
      const client = eng.clients;
      const anchorDay = Math.min(Math.max(1, eng.billing_anchor_day), 28);

      // Project into visible months (prev, current, next)
      for (let offset = -1; offset <= 1; offset++) {
        const projDate = new Date(year, month + offset, anchorDay);
        const dateStr = projDate.toISOString().split("T")[0];

        events.push({
          id: `billing-${eng.id}-${offset}`,
          type: "billing",
          title: `Monthly Retainer: ₹${Number(eng.monthly_retainer || 0).toLocaleString("en-IN")}`,
          subtitle: `${client?.name || "Client"} · Anchor Day ${anchorDay}`,
          date: projDate,
          dateString: dateStr,
          status: "scheduled",
          clientName: client?.name || "Client",
          clientId: client?.id,
          rawItem: eng,
        });
      }
    });

    // C. Tool Subscription Renewal Milestones
    toolSubscriptions.forEach((tool) => {
      const renewal = tool.next_renewal_date || tool.renewal_date;
      if (!renewal) return;
      const d = new Date(renewal);
      const client = tool.clients;
      const dateStr = d.toISOString().split("T")[0];
      const cost = Number(tool.cost_amount || tool.license_cost_monthly || 0);

      events.push({
        id: `tool-${tool.id}`,
        type: "tool",
        title: `${tool.tool_name} Renewal: ₹${cost.toLocaleString("en-IN")}`,
        subtitle: client ? `Allocated to ${client.name}` : "Shared Agency Tool",
        date: d,
        dateString: dateStr,
        status: "renewal",
        clientName: client?.name || "Agency Operations",
        clientId: tool.allocated_client_id,
        rawItem: tool,
      });
    });

    return events;
  }, [initialContentPosts, engagements, toolSubscriptions, year, month]);

  // Filter by selected client
  const filteredEvents = useMemo(() => {
    if (selectedClientId === "all") return allEvents;
    return allEvents.filter((ev) => ev.clientId === selectedClientId);
  }, [allEvents, selectedClientId]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    // Adjust to Mon = 0
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; dateString: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateString: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month filler to complete rows (multiple of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Group filtered events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.dateString]) map[ev.dateString] = [];
      map[ev.dateString].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Metrics for current month
  const scheduledCount = initialContentPosts.filter((p) => {
    if (!p.scheduled_publish_date) return false;
    const d = new Date(p.scheduled_publish_date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const totalBillingProjected = engagements.reduce(
    (acc, e) => acc + Number(e.monthly_retainer || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Standardized Header */}
      <PageHeader
        title="Master Calendar"
        description="Temporal operational projection of scheduled LinkedIn posts, client billing anchor days, and software renewals."
        portalActionsToTopNav={false}
      >
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5">
            <button
              onClick={() => setView("month")}
              className={`px-2.5 py-1 text-xs rounded-[3px] transition-colors cursor-pointer ${
                view === "month"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("agenda")}
              className={`px-2.5 py-1 text-xs rounded-[3px] transition-colors cursor-pointer ${
                view === "agenda"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              Agenda
            </button>
          </div>

          <Link href="/content" className="btn btn-secondary text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span>Content Pipeline</span>
          </Link>
        </div>
      </PageHeader>

      {/* KPI Metric Slabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Scheduled Slots ({new Date(year, month, 1).toLocaleString("en-US", { month: "short" })})
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {scheduledCount}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Locked &amp; ready to publish</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Monthly Retainer Invoices
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ok-text)]">
            ₹{totalBillingProjected.toLocaleString("en-IN")}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Projected across active anchor days</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent-text)] font-medium">
            Calendar Engine
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-accent-text)]">
            ADR-001
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Zero manual duplicate date entry</p>
        </div>
      </div>

      {/* Calendar Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-line-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-normal text-[var(--color-ink)]">
            {monthName}
          </h2>
          <div className="flex items-center gap-1 border border-[var(--color-line)] rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-0.5">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[3px] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-0.5 text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] font-mono transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[3px] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
            <div className="w-56">
              <CustomSelect
                size="sm"
                options={[
                  { value: "all", label: `All Clients (${clients.length})` },
                  ...clients.map((c) => ({
                    value: c.id,
                    label: c.name,
                    description: c.founder_name,
                    brandName: c.name,
                  })),
                ]}
                value={selectedClientId}
                onChange={setSelectedClientId}
              />
            </div>
          </div>

          {/* Operational Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-[var(--color-ink-tertiary)] pl-2 border-l border-[var(--color-line)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" /> Content
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-ok)]" /> Retainers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-warn)]" /> Tool Renewal
            </span>
          </div>
        </div>
      </div>

      {/* VIEW: MONTH CALENDAR GRID */}
      {view === "month" && (
        <div className="card overflow-hidden border border-[var(--color-line)]">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-[var(--color-line)] bg-[var(--color-base-raised)] text-center text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--color-line-subtle)] bg-[var(--color-base)]">
            {calendarDays.map((day, idx) => {
              const events = eventsByDate[day.dateString] || [];
              const hasEvents = events.length > 0;

              return (
                <div
                  key={day.dateString + idx}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors ${
                    !day.isCurrentMonth
                      ? "bg-[var(--color-base-subtle)]/30 text-[var(--color-ink-muted)]"
                      : "hover:bg-[var(--color-surface-hover)]/30"
                  } ${day.isToday ? "bg-[var(--color-accent-dim)]/5" : ""}`}
                >
                  {/* Date Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center font-mono text-xs rounded-full h-5 w-5 ${
                        day.isToday
                          ? "bg-[var(--color-accent)] text-black font-bold"
                          : day.isCurrentMonth
                          ? "text-[var(--color-ink)]"
                          : "text-[var(--color-ink-tertiary)]"
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    {hasEvents && (
                      <span className="text-[10px] font-mono text-[var(--color-ink-tertiary)]">
                        {events.length}
                      </span>
                    )}
                  </div>

                  {/* Operational Chips */}
                  <div className="mt-1.5 space-y-1 overflow-hidden">
                    {events.slice(0, 3).map((ev) => {
                      const isContent = ev.type === "content";
                      const isBilling = ev.type === "billing";
                      const isTool = ev.type === "tool";

                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-sans transition-all block cursor-pointer border ${
                            isContent
                              ? "bg-[var(--color-base-subtle)] border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent-dim)]"
                              : isBilling
                              ? "bg-[var(--color-ok-bg)]/60 border-[var(--color-ok-line)] text-[var(--color-ok-text)] hover:bg-[var(--color-ok-bg)]"
                              : "bg-[var(--color-warn-bg)]/60 border-[var(--color-warn-line)] text-[var(--color-warn-text)] hover:bg-[var(--color-warn-bg)]"
                          }`}
                          title={`${ev.title} (${ev.clientName})`}
                        >
                          <span className="font-mono text-[9px] uppercase mr-1 opacity-75 font-medium">
                            {isContent ? "Post" : isBilling ? "Retainer" : "Tool"}
                          </span>
                          <span>{ev.title}</span>
                        </button>
                      );
                    })}

                    {events.length > 3 && (
                      <span className="block text-[10px] font-mono text-[var(--color-ink-tertiary)] pl-1">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: CHRONOLOGICAL AGENDA */}
      {view === "agenda" && (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-3">
            <h3 className="font-display text-base font-normal text-[var(--color-ink)]">
              Chronological Operational Stream
            </h3>
            <span className="font-mono text-xs text-[var(--color-ink-tertiary)]">
              {filteredEvents.length} total projected events
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
              <CalendarIcon className="h-8 w-8 mx-auto text-[var(--color-ink-muted)] opacity-60" />
              <p>No operational events scheduled for this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {filteredEvents
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-hover)] px-2 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-2 text-center min-w-[50px]">
                        <span className="text-[10px] font-mono uppercase text-[var(--color-ink-tertiary)] block">
                          {ev.date.toLocaleString("en-US", { month: "short" })}
                        </span>
                        <span className="font-display text-lg font-bold text-[var(--color-ink)] block leading-tight">
                          {ev.date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[var(--color-ink)]">
                            {ev.title}
                          </span>
                          <span
                            className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded ${
                              ev.type === "content"
                                ? "bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)]"
                                : ev.type === "billing"
                                ? "bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)]"
                                : "bg-[var(--color-warn-bg)] text-[var(--color-warn-text)] border border-[var(--color-warn-line)]"
                            }`}
                          >
                            {ev.type}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-secondary)]">
                          {ev.clientName} {ev.subtitle ? `· ${ev.subtitle}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-xs text-[var(--color-ink-tertiary)] font-mono">
                      <span>{ev.date.toLocaleDateString("en-IN")}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SLIDE-OVER EVENT DETAIL DRAWER */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="h-full w-full max-w-md bg-[var(--color-base-raised)] border-l border-[var(--color-line)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
                    Operational Detail · {selectedEvent.type.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
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
                  Client: <strong className="text-[var(--color-ink)] font-medium">{selectedEvent.clientName}</strong>
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-tertiary)] pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Scheduled: {selectedEvent.date.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Body Content if Post */}
              {selectedEvent.type === "content" && selectedEvent.rawItem && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-ink-tertiary)]">Status:</span>
                    <span className="font-mono uppercase font-semibold text-[var(--color-accent-text)]">
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
                    <span className="font-mono text-[10px] uppercase text-[var(--color-ink-tertiary)] block font-medium">
                      Post Markdown Preview:
                    </span>
                    <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base)] p-3.5 text-xs text-[var(--color-ink-secondary)] font-sans max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedEvent.rawItem.body_markdown || "No body draft available."}
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
                      <span className="font-mono font-bold text-[var(--color-ink)]">
                        ₹{Number(selectedEvent.rawItem.monthly_retainer || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-ink-tertiary)]">Anchor Day:</span>
                      <span className="font-mono text-[var(--color-accent-text)]">
                        Day {selectedEvent.rawItem.billing_anchor_day} of each month
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-ink-tertiary)]">Service:</span>
                      <span className="font-medium text-[var(--color-ink)]">
                        {selectedEvent.rawItem.service_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-[var(--color-ink-tertiary)]">
                    Per ADR-001, retainer drafts are aggregated automatically 7 days prior to the anchor day with all unbilled third-party tool expenses.
                  </p>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="border-t border-[var(--color-line-subtle)] pt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn btn-secondary text-xs flex-1"
              >
                Close Drawer
              </button>

              {selectedEvent.type === "content" && (
                <Link
                  href={`/content/${selectedEvent.rawItem.id}`}
                  className="btn btn-primary text-xs flex-1 inline-flex items-center justify-center gap-1.5"
                >
                  <span>Open in Editor</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}

              {selectedEvent.type === "billing" && (
                <Link
                  href="/billing"
                  className="btn btn-primary text-xs flex-1 inline-flex items-center justify-center gap-1.5"
                >
                  <span>Go to Invoices</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
