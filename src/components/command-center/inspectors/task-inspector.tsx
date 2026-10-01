"use client";

import React from "react";
import Link from "next/link";
import { Check, Clock, User, Building2, Trash2 } from "lucide-react";
import type { OperationalTask } from "@/types/domain";

interface TaskInspectorProps {
  task: OperationalTask;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  isPending: boolean;
}

export function TaskInspector({
  task,
  onToggleTask,
  onDeleteTask,
  isPending,
}: TaskInspectorProps) {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Sleek Header */}
      <div className="px-6 py-3.5 border-b border-[var(--color-line)] bg-[var(--color-base-raised)]/70 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)]">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                task.is_completed ? "bg-emerald-400" : "bg-[var(--color-accent)]"
              }`}
            />
            <span className="font-semibold text-[var(--color-ink)]">
              {task.is_completed ? "Completed Task" : "Today's Focus"}
            </span>
            <span className="text-[var(--color-ink-ghost)]">&middot;</span>
            <span className="text-[var(--color-ink-muted)]">
              ⚡ {task.estimated_minutes} minute commitment
            </span>
          </div>

          {task.source_type === "manual" && (
            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              disabled={isPending}
              className="text-xs text-[var(--color-ink-muted)] hover:text-rose-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Focus Reading Canvas */}
      <div className="flex-1 px-6 py-6 sm:px-8 sm:py-8 overflow-y-auto min-h-0 space-y-6">
        <div className="max-w-2xl space-y-4">
          <h2
            className={`text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-ink)] font-display leading-snug ${
              task.is_completed ? "line-through opacity-60" : ""
            }`}
          >
            {task.title}
          </h2>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="card p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                Estimated Time
              </span>
              <div className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                <span>{task.estimated_minutes} minutes</span>
              </div>
            </div>

            <div className="card p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[var(--color-ink-muted)] font-medium">
                Client Account
              </span>
              <div className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" />
                {task.client_id ? (
                  <Link
                    href={`/clients/${task.client_id}`}
                    className="hover:underline truncate"
                  >
                    {task.client_name || "Client"}
                  </Link>
                ) : (
                  <span className="text-[var(--color-ink-secondary)]">Internal Desk</span>
                )}
              </div>
            </div>
          </div>

          {/* Calming ADHD Execution Guidance */}
          <div className="border-l-2 border-[var(--color-line-strong)] pl-4 py-2 mt-4 space-y-1">
            <p className="text-xs font-medium text-[var(--color-ink)]">
              {task.is_completed
                ? "This task is completed. Great job keeping the momentum going!"
                : "Single Focus: Finish this in one short push. No multitasking needed."}
            </p>
            <p className="text-[11.5px] text-[var(--color-ink-muted)] leading-relaxed">
              {task.is_completed
                ? `Cleared on ${task.completed_at ? new Date(task.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "today"}.`
                : `Set a ${task.estimated_minutes}-minute timer, do the action, and check it off.`}
            </p>
          </div>
        </div>
      </div>

      {/* Docked Action Footer */}
      <div className="px-6 py-3 border-t border-[var(--color-line)] bg-[var(--color-base-raised)]/95 backdrop-blur-xs mt-auto shrink-0 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onToggleTask(task.id, task.is_completed)}
          disabled={isPending}
          className={`inline-flex items-center justify-center gap-1.5 btn text-xs font-semibold px-4 py-2 cursor-pointer transition-colors ${
            task.is_completed
              ? "btn-secondary"
              : "btn-primary shadow-xs"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          <span>{task.is_completed ? "Reopen Task" : "Mark as Done"}</span>
        </button>

        <span className="text-xs text-[var(--color-ink-muted)]">
          {task.is_completed ? "Done" : "Pending completion"}
        </span>
      </div>
    </div>
  );
}
