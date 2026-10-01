"use client";

import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import { HeaderActions } from "@/components/layout/header-actions";
import { AlertInspectorPane } from "@/components/command-center/alert-inspector-pane";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { CommandCenterQueueList } from "@/components/command-center/command-center-queue-list";
import { DailyActionChecklist } from "@/components/command-center/daily-action-checklist";
import { QuickTaskModal } from "@/components/command-center/quick-task-modal";
import { UpcomingReleasesTopBar } from "@/components/command-center/upcoming-releases-top-bar";
import { WaitingOnClientsList } from "@/components/command-center/waiting-on-clients-list";
import { useCommandCenterActions } from "@/components/command-center/use-command-center-actions";
import { useResizableSplit } from "@/components/command-center/use-resizable-split";
import { useOperationalTasks } from "@/components/command-center/use-operational-tasks";
import type {
  Client,
  CommandCenterAlert,
  CommandCenterExpenseItem,
  CommandCenterReviewPost,
  CommandCenterScheduledPost,
  OperationalTask,
} from "@/types/domain";

interface CommandCenterClientProps {
  initialData: {
    activeClientsCount: number;
    pendingReviewCount: number;
    unbilledExpensesTotal: number;
    mrrTotal?: number;
    brandingCount?: number;
    outreachCount?: number;
    alerts: CommandCenterAlert[];
    clients: Array<{ id: string; name: string } & Partial<Client>>;
    reviewPosts: CommandCenterReviewPost[];
    unresolvedFeedback?: unknown[];
    scheduledPosts?: CommandCenterScheduledPost[];
    unbilledExpenses: CommandCenterExpenseItem[];
    operationalTasks?: OperationalTask[];
    teamMembers?: Array<{ id: string; full_name: string; email: string }>;
  };
}

export function CommandCenterClient({ initialData }: CommandCenterClientProps) {
  const [alerts, setAlerts] = useState<CommandCenterAlert[]>(initialData.alerts || []);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    initialData.alerts && initialData.alerts.length > 0 ? initialData.alerts[0].id : null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "tasks" | "reviews" | "waiting" | "billing">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Draggable Splitter Hook
  const { leftWidth, isResizing, containerRef, startResizing, resetWidth } = useResizableSplit({
    defaultWidth: 480,
    minWidth: 360,
    maxWidth: 720,
    storageKey: "atom-echo-command-center-left-width",
  });

  // Operational Tasks Hook
  const {
    tasks,
    isTaskPending,
    handleToggleTask,
    handleAddTask,
    handleDeleteTask,
  } = useOperationalTasks({
    initialTasks: initialData.operationalTasks || [],
    showToast,
    selectedTaskId,
    onSelectTask: (id) => {
      setSelectedTaskId(id);
      if (id) setSelectedAlertId(null);
    },
  });

  // Command Center Alert Actions Hook
  const {
    copiedToken,
    isPending: isActionPending,
    copyReviewLink,
    openWhatsAppPing,
    handleQuickApprove,
    handleResolveFeedback,
    openFeedbackWhatsAppPing,
    handleQuickDraftInvoice,
    handleApproveInvoice,
    handleResolveClientRequest,
    handleAdvanceToolRenewal,
    openInvoiceWhatsAppPing,
  } = useCommandCenterActions({
    alerts,
    setAlerts,
    selectedAlertId,
    setSelectedAlertId,
    showToast,
    unbilledExpenses: initialData.unbilledExpenses || [],
    defaultClientId: initialData.clients[0]?.id,
  });

  // Global 'N' keyboard shortcut to open task modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsTaskModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks]);

  // Operational Classification:
  // - actionAlerts: team action required (internal QA, stalled drafts, invoices, feedback, software)
  // - waitingAlerts: with founder for sign-off
  // - reviewAlerts: internal voice QA, feedback edits, drafts
  // - billingAlerts: unbilled software, invoice drafts, renewals
  const { actionAlerts, waitingAlerts, reviewAlerts, billingAlerts } = useMemo(() => {
    const action: CommandCenterAlert[] = [];
    const waiting: CommandCenterAlert[] = [];
    const reviews: CommandCenterAlert[] = [];
    const billing: CommandCenterAlert[] = [];

    alerts.forEach((alert) => {
      if (alert.entity_type === "content_item" && alert.post_status === "client_review") {
        waiting.push(alert);
      } else {
        action.push(alert);
      }

      if (
        alert.entity_type === "content_feedback" ||
        alert.post_status === "internal_review" ||
        alert.post_status === "draft"
      ) {
        reviews.push(alert);
      }

      if (
        alert.entity_type === "billing" ||
        alert.entity_type === "invoice_draft" ||
        alert.entity_type === "tool_renewal"
      ) {
        billing.push(alert);
      }
    });

    return {
      actionAlerts: action,
      waitingAlerts: waiting,
      reviewAlerts: reviews,
      billingAlerts: billing,
    };
  }, [alerts]);

  const filterOptions = useMemo(
    () => [
      { id: "all", label: "All", count: actionAlerts.length + activeTasks.length },
      { id: "tasks", label: "To-Do", count: activeTasks.length },
      { id: "reviews", label: "Reviews", count: reviewAlerts.length },
      { id: "waiting", label: "With Clients", count: waitingAlerts.length },
      { id: "billing", label: "Billing", count: billingAlerts.length },
    ],
    [
      actionAlerts.length,
      activeTasks.length,
      reviewAlerts.length,
      waitingAlerts.length,
      billingAlerts.length,
    ]
  );

  const activeItemsCount = useMemo(() => {
    if (filter === "tasks") return activeTasks.length;
    if (filter === "reviews") return reviewAlerts.length;
    if (filter === "waiting") return waitingAlerts.length;
    if (filter === "billing") return billingAlerts.length;
    return actionAlerts.length + activeTasks.length;
  }, [
    filter,
    activeTasks.length,
    reviewAlerts.length,
    waitingAlerts.length,
    billingAlerts.length,
    actionAlerts.length,
  ]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const selectedAlert = useMemo(() => {
    if (selectedTaskId) return null;
    if (selectedAlertId) {
      return alerts.find((a) => a.id === selectedAlertId) || alerts[0] || null;
    }
    return alerts[0] || null;
  }, [alerts, selectedAlertId, selectedTaskId]);

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Task Creation Modal */}
      <QuickTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onAddTask={handleAddTask}
        teamMembers={initialData.teamMembers}
        clients={initialData.clients as any}
        isPending={isTaskPending}
      />

      {/* Action Portal Target into TopNav: New Task Button */}
      <HeaderActions>
        <button
          type="button"
          onClick={() => setIsTaskModalOpen(true)}
          className="btn btn-primary text-xs font-semibold px-3 py-1.5 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
          <kbd className="hidden sm:inline-block text-[10px] bg-black/20 dark:bg-white/20 px-1.5 py-0.2 rounded font-mono">
            N
          </kbd>
        </button>
      </HeaderActions>

      {/* Full-bleed Native Workstation Console */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row h-full min-h-0 w-full bg-[var(--color-surface)] overflow-hidden"
      >
        {/* LEFT PANE: Resizable Attention Surface & Focused Workspace */}
        <div
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftWidth}px` : undefined,
          }}
          className="w-full lg:w-auto shrink-0 flex flex-col border-b lg:border-b-0 border-[var(--color-line)] bg-[var(--color-base-raised)] h-full min-h-0 relative"
        >
          {/* Header with Integrated Inline Segmented Filter */}
          <div className="border-b border-[var(--color-line)] px-4 py-2.5 sm:px-5 sm:py-3 bg-[var(--color-base-subtle)]/40 shrink-0">
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-[var(--color-ink)] tracking-tight font-display">
                  Today&apos;s Desk
                </span>
                <span className="text-xs font-sans text-[var(--color-ink-tertiary)] tabular-nums">
                  ({activeItemsCount} to do)
                </span>
              </div>

              <div className="min-w-0 max-w-full overflow-x-auto no-scrollbar py-0.5">
                <SegmentedFilter
                  options={filterOptions}
                  value={filter}
                  onChange={(val) => {
                    setFilter(val as any);
                    if (val === "tasks") {
                      const firstTask = tasks.find((t) => !t.is_completed) || tasks[0];
                      if (firstTask) {
                        setSelectedTaskId(firstTask.id);
                        setSelectedAlertId(null);
                      }
                    } else if (val === "waiting") {
                      if (waitingAlerts.length > 0) {
                        setSelectedAlertId(waitingAlerts[0].id);
                        setSelectedTaskId(null);
                      }
                    } else if (val === "reviews") {
                      if (reviewAlerts.length > 0) {
                        setSelectedAlertId(reviewAlerts[0].id);
                        setSelectedTaskId(null);
                      }
                    } else if (val === "billing") {
                      if (billingAlerts.length > 0) {
                        setSelectedAlertId(billingAlerts[0].id);
                        setSelectedTaskId(null);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Conditional Layout Based on Active Tab */}
          {filter === "tasks" ? (
            /* Dedicated ADHD Tasks Focus View */
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <DailyActionChecklist
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                isPending={isTaskPending}
                compact={false}
                selectedTaskId={selectedTaskId}
                onSelectTask={(id) => {
                  setSelectedTaskId(id);
                  setSelectedAlertId(null);
                }}
              />
            </div>
          ) : filter === "waiting" ? (
            /* Dedicated With Clients Queue */
            <div className="flex-1 overflow-y-auto min-h-0">
              <CommandCenterQueueList
                filteredAlerts={waitingAlerts}
                selectedAlertId={selectedAlert?.id ?? null}
                onSelectAlert={(id) => {
                  setSelectedAlertId(id);
                  setSelectedTaskId(null);
                }}
              />
            </div>
          ) : filter === "reviews" ? (
            /* Dedicated Reviews Queue */
            <div className="flex-1 overflow-y-auto min-h-0">
              <CommandCenterQueueList
                filteredAlerts={reviewAlerts}
                selectedAlertId={selectedAlert?.id ?? null}
                onSelectAlert={(id) => {
                  setSelectedAlertId(id);
                  setSelectedTaskId(null);
                }}
              />
            </div>
          ) : filter === "billing" ? (
            /* Dedicated Billing Queue */
            <div className="flex-1 overflow-y-auto min-h-0">
              <CommandCenterQueueList
                filteredAlerts={billingAlerts}
                selectedAlertId={selectedAlert?.id ?? null}
                onSelectAlert={(id) => {
                  setSelectedAlertId(id);
                  setSelectedTaskId(null);
                }}
              />
            </div>
          ) : (
            /* "All" Overview (De-boxed, balanced, spacious) */
            <>
              {/* Slim hairline release ticker (only if posts exist) */}
              <UpcomingReleasesTopBar scheduledPosts={initialData.scheduledPosts} />

              {/* Compact tasks strip (top 3) */}
              <DailyActionChecklist
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                isPending={isTaskPending}
                compact={true}
                onSwitchToTasksTab={() => setFilter("tasks")}
                selectedTaskId={selectedTaskId}
                onSelectTask={(id) => {
                  setSelectedTaskId(id);
                  setSelectedAlertId(null);
                }}
              />

              {/* Primary Action Queue */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <CommandCenterQueueList
                  filteredAlerts={actionAlerts}
                  selectedAlertId={selectedAlert?.id ?? null}
                  onSelectAlert={(id) => {
                    setSelectedAlertId(id);
                    setSelectedTaskId(null);
                  }}
                />
              </div>

              {/* Collapsed With Founders footer summary */}
              <WaitingOnClientsList
                waitingAlerts={waitingAlerts}
                selectedAlertId={selectedAlert?.id ?? null}
                onSelectAlert={(id) => {
                  setSelectedAlertId(id);
                  setSelectedTaskId(null);
                }}
                onOpenWhatsAppPing={openWhatsAppPing}
                initiallyExpanded={false}
              />
            </>
          )}
        </div>

        {/* INTERACTIVE RESIZER SPLITTER (Linear / Emil Kowalski Craft Standard) */}
        <div
          onMouseDown={startResizing}
          onDoubleClick={resetWidth}
          title="Drag to resize · Double-click to reset (480px)"
          className={`hidden lg:flex w-2 -ml-1 relative z-20 cursor-col-resize items-center justify-center group hover:bg-[var(--color-accent)]/20 active:bg-[var(--color-accent)]/40 transition-colors select-none ${
            isResizing ? "bg-[var(--color-accent)]/30" : ""
          }`}
        >
          <div className="h-8 w-0.5 rounded-full bg-[var(--color-line-strong)] group-hover:bg-[var(--color-accent)] transition-colors" />
        </div>

        {/* RIGHT PANE: Dedicated Instant Action Inspector (Fluid Canvas) */}
        <div className="flex-1 min-w-0 flex flex-col bg-[var(--color-base)]">
          <AlertInspectorPane
            selectedAlert={selectedAlert}
            selectedTask={selectedTask}
            unbilledExpensesTotal={initialData.unbilledExpensesTotal}
            unbilledExpenses={initialData.unbilledExpenses}
            copiedToken={copiedToken}
            isPending={isActionPending || isTaskPending}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsAppPing={openWhatsAppPing}
            onQuickApprove={handleQuickApprove}
            onResolveFeedback={handleResolveFeedback}
            onOpenFeedbackWhatsAppPing={openFeedbackWhatsAppPing}
            onQuickDraftInvoice={handleQuickDraftInvoice}
            onApproveInvoice={handleApproveInvoice}
            onOpenInvoiceWhatsAppPing={openInvoiceWhatsAppPing}
            onResolveClientRequest={handleResolveClientRequest}
            onAdvanceToolRenewal={handleAdvanceToolRenewal}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </div>
    </div>
  );
}
