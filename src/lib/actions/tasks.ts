"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorSession } from "@/lib/auth/session";
import {
  createOperationalTask,
  toggleOperationalTask,
  deleteOperationalTask,
} from "@/lib/tasks/storage";
import type { TaskEstimatedMinutes } from "@/types/domain";

const createTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters").max(200),
  estimated_minutes: z.coerce
    .number()
    .refine(
      (n): n is TaskEstimatedMinutes =>
        [1, 2, 3, 5, 10, 15, 30, 45, 60].includes(n),
      { message: "Invalid estimated duration" }
    )
    .default(5),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
});

export async function createOperationalTaskAction(input: {
  title: string;
  estimated_minutes?: number;
  due_date?: string;
  assigned_to?: string | null;
  client_id?: string | null;
}) {
  try {
    const session = await requireOperatorSession();
    const parsed = createTaskSchema.safeParse(input);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid task input" };
    }

    const supabase = createAdminClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "atom-and-echo")
      .maybeSingle();

    const organization_id = org?.id || "2a81bba3-4a33-47a8-908b-d1a399436a41";

    const task = await createOperationalTask(supabase, {
      organization_id,
      title: parsed.data.title,
      estimated_minutes: parsed.data.estimated_minutes,
      due_date: parsed.data.due_date,
      assigned_to: parsed.data.assigned_to,
      client_id: parsed.data.client_id,
      source_type: "manual",
    });

    revalidatePath("/command-center");
    return { success: true, task };
  } catch (err: any) {
    console.error("createOperationalTaskAction error:", err);
    return { success: false, error: err.message || "Failed to create task" };
  }
}

export async function toggleOperationalTaskAction(
  taskId: string,
  is_completed: boolean
) {
  try {
    await requireOperatorSession();
    if (!taskId) return { success: false, error: "Task ID is required" };

    const supabase = createAdminClient();
    const res = await toggleOperationalTask(supabase, taskId, is_completed);

    revalidatePath("/command-center");
    return res;
  } catch (err: any) {
    console.error("toggleOperationalTaskAction error:", err);
    return { success: false, error: err.message || "Failed to update task" };
  }
}

export async function deleteOperationalTaskAction(taskId: string) {
  try {
    await requireOperatorSession();
    if (!taskId) return { success: false, error: "Task ID is required" };

    const supabase = createAdminClient();
    const res = await deleteOperationalTask(supabase, taskId);

    revalidatePath("/command-center");
    return res;
  } catch (err: any) {
    console.error("deleteOperationalTaskAction error:", err);
    return { success: false, error: err.message || "Failed to delete task" };
  }
}
