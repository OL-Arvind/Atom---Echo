"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Trash2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { OperationalTask } from "@/types/domain";

interface DailyActionChecklistProps {
  tasks: OperationalTask[];
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  isPending?: boolean;
  compact?: boolean;
  onSwitchToTasksTab?: () => void;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
}

export function DailyActionChecklist({
  tasks,
  onToggleTask,
  onDeleteTask,
  isPending,
  compact = false,
  onSwitchToTasksTab,
  selectedTaskId,
  onSelectTask,
}: DailyActionChecklistProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  const completedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimated_minutes || 5), 0);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;

  // In compact mode, show top 3 active tasks to save vertical height
  const visibleTasks = compact ? activeTasks.slice(0, 3) : activeTasks;
  const remainingCount = compact ? Math.max(0, activeTasks.length - 3) : 0;

  // In compact mode, if there are no tasks at all, don't waste vertical space
  if (compact && totalTasks === 0) {
    return null;
  }

  return (
    <div className="flex flex-col border-b border-[var(--color-line-subtle)] bg-[var(--color-base)]">
      {/* Calm Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-[var(--color-base-subtle)]/40 border-b border-[var(--color-line-subtle)]">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
          <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-[var(--color-ink-secondary)]">
            Today's Tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalTasks > 0 ? (
            <span className="text-[11px] font-sans text-[var(--color-ink-muted)] tabular-nums">
              {completedCount} of {totalTasks} done
            </span>
          ) : (
            <span className="text-[11px] font-sans text-[var(--color-ink-muted)]">
              No open tasks
            </span>
          )}
          {completedMinutes > 0 && (
            <span className="text-[11px] font-sans font-medium text-[var(--color-accent)] tabular-nums">
              ({completedMinutes}m saved)
            </span>
          )}
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="divide-y divide-[var(--color-line-subtle)]">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="py-4 px-4 text-center">
            <p className="text-xs text-[var(--color-ink-muted)]">No tasks on your desk today.</p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask?.(task.id)}
                className={`group flex items-start gap-3 px-4 sm:px-5 py-2.5 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--color-base-subtle)] border-l-2 border-l-[var(--color-ink)]"
                    : "hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                {/* Checkbox Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id, task.is_completed);
                  }}
                  disabled={isPending}
                  aria-label={`Mark task completed: ${task.title}`}
                  className="mt-0.5 h-4 w-4 rounded border border-[var(--color-line-strong)] hover:border-[var(--color-accent)] flex items-center justify-center shrink-0 transition-colors bg-[var(--color-surface)] cursor-pointer"
                >
                  {task.is_completed && <Check className="h-3 w-3 text-[var(--color-ink)]" />}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12.5px] text-[var(--color-ink)] font-normal leading-snug break-words">
                      {task.title}
                    </span>
                    {/* Calibrated Time Chip */}
                    <span className="text-[10px] font-mono tracking-tight text-[var(--color-ink-secondary)] bg-[var(--color-base-subtle)] border border-[var(--color-line-subtle)] px-1.5 py-0.5 rounded shrink-0 tabular-nums font-medium">
                      ⚡ {task.estimated_minutes}m
                    </span>
                  </div>

                  {/* Sub-label Context (Client & Assignee) */}
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
                    {task.client_name && (
                      <span className="text-[var(--color-ink-secondary)] font-medium">
                        {task.client_name}
                      </span>
                    )}
                    {task.assigned_user_name && (
                      <>
                        <span>&middot;</span>
                        <span>{task.assigned_user_name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete Manual Task */}
                {task.source_type === "manual" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    aria-label="Delete task"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-ink-muted)] hover:text-rose-400 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Compact Overflow Link */}
        {remainingCount > 0 && onSwitchToTasksTab && (
          <button
            type="button"
            onClick={onSwitchToTasksTab}
            className="w-full text-left px-4 sm:px-5 py-2 text-[11.5px] text-[var(--color-accent-text)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            +{remainingCount} more in To-Do &rarr;
          </button>
        )}
      </div>

      {/* Completed Tasks Fold (Dopamine Retention) */}
      {completedTasks.length > 0 && (
        <div className="border-t border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/30">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-2 text-[11px] font-sans text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Completed ({completedTasks.length})</span>
            </div>
            {showCompleted ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showCompleted && (
            <div className="divide-y divide-[var(--color-line-subtle)] border-t border-[var(--color-line-subtle)]">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 px-4 sm:px-5 py-2 bg-[var(--color-base)]/40 opacity-55 hover:opacity-85 transition-opacity"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id, task.is_completed)}
                    disabled={isPending}
                    aria-label={`Mark task incomplete: ${task.title}`}
                    className="mt-0.5 h-4 w-4 rounded border border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Check className="h-3 w-3 text-emerald-400" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] line-through text-[var(--color-ink-muted)] leading-snug break-words">
                      {task.title}
                    </span>
                  </div>

                  <span className="text-[9.5px] font-mono text-[var(--color-ink-muted)] shrink-0 tabular-nums">
                    {task.estimated_minutes}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
