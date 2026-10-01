"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createOperationalTaskAction,
  toggleOperationalTaskAction,
  deleteOperationalTaskAction,
} from "@/lib/actions/tasks";
import type { OperationalTask, TaskEstimatedMinutes } from "@/types/domain";

interface UseOperationalTasksOptions {
  initialTasks?: OperationalTask[];
  showToast: (msg: string) => void;
  onSelectTask?: (taskId: string | null) => void;
  selectedTaskId?: string | null;
}

export function useOperationalTasks({
  initialTasks = [],
  showToast,
  onSelectTask,
  selectedTaskId,
}: UseOperationalTasksOptions) {
  const [tasks, setTasks] = useState<OperationalTask[]>(initialTasks);
  const [isTaskPending, startTaskTransition] = useTransition();

  const handleToggleTask = useCallback(
    (taskId: string, currentStatus: boolean) => {
      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                is_completed: !currentStatus,
                completed_at: !currentStatus ? new Date().toISOString() : null,
              }
            : t
        )
      );

      startTaskTransition(async () => {
        const res = await toggleOperationalTaskAction(taskId, !currentStatus);
        if (res.success) {
          showToast(!currentStatus ? "Task completed · Nice momentum!" : "Task marked active.");
        } else {
          showToast(`Error: ${res.error || "Could not update task."}`);
        }
      });
    },
    [showToast]
  );

  const handleAddTask = useCallback(
    async (taskInput: {
      title: string;
      estimated_minutes: TaskEstimatedMinutes;
      assigned_to?: string | null;
      client_id?: string | null;
    }) => {
      startTaskTransition(async () => {
        const res = await createOperationalTaskAction(taskInput);
        if (res.success && res.task) {
          const newTask = res.task as OperationalTask;
          setTasks((prev) => [newTask, ...prev]);
          onSelectTask?.(newTask.id);
          showToast("Task added to today's desk.");
        } else {
          showToast(`Error: ${res.error || "Could not create task."}`);
        }
      });
    },
    [onSelectTask, showToast]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      if (selectedTaskId === taskId) {
        onSelectTask?.(null);
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      startTaskTransition(async () => {
        const res = await deleteOperationalTaskAction(taskId);
        if (!res.success) {
          showToast(`Error: ${res.error || "Could not delete task."}`);
        }
      });
    },
    [selectedTaskId, onSelectTask, showToast]
  );

  return {
    tasks,
    setTasks,
    isTaskPending,
    handleToggleTask,
    handleAddTask,
    handleDeleteTask,
  };
}
