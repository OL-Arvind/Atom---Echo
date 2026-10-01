import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperationalTask, TaskEstimatedMinutes } from "@/types/domain";
import { getTodayDateStringIST } from "../date-utils";

const BUCKET_NAME = "operational-tasks";
const FILE_PATH = "daily_tasks.json";

// In-memory write-through fallback cache so immediate revalidations never drop state
const globalForTasks = globalThis as unknown as {
  __operationalTasksCache?: Map<string, OperationalTask>;
};
const tasksMemoryCache =
  globalForTasks.__operationalTasksCache ??
  (globalForTasks.__operationalTasksCache = new Map<string, OperationalTask>());

async function ensureStorageBucket(supabase: SupabaseClient) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: false });
    }
  } catch {
    // Non-fatal fallback
  }
}

async function readFromStorage(supabase: SupabaseClient): Promise<OperationalTask[]> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(FILE_PATH);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        parsed.forEach((t: OperationalTask) => tasksMemoryCache.set(t.id, t));
        return parsed;
      }
    }
  } catch {
    // Fall back to memory
  }
  return Array.from(tasksMemoryCache.values());
}

async function writeToStorage(supabase: SupabaseClient, tasks: OperationalTask[]) {
  try {
    await ensureStorageBucket(supabase);
    const body = Buffer.from(JSON.stringify(tasks, null, 2), "utf8");
    await supabase.storage.from(BUCKET_NAME).upload(FILE_PATH, body, {
      upsert: true,
      contentType: "application/json",
    });
  } catch {
    // Non-fatal in memory
  }
}

/**
 * Fetch operational tasks for a specific date (defaults to today in IST).
 */
export async function getOperationalTasksForDate(
  supabase: SupabaseClient,
  dateStr?: string
): Promise<OperationalTask[]> {
  const targetDate = dateStr || getTodayDateStringIST();

  // Try Postgres Table first
  try {
    const { data, error } = await supabase
      .from("operational_tasks")
      .select("*, users:assigned_to(full_name), clients:client_id(name)")
      .eq("due_date", targetDate)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((t: any) => ({
        id: t.id,
        organization_id: t.organization_id,
        title: t.title,
        estimated_minutes: t.estimated_minutes as TaskEstimatedMinutes,
        due_date: t.due_date,
        assigned_to: t.assigned_to,
        assigned_user_name: t.users?.full_name || null,
        client_id: t.client_id,
        client_name: t.clients?.name || null,
        is_completed: t.is_completed,
        completed_at: t.completed_at,
        source_type: t.source_type,
        source_entity_type: t.source_entity_type,
        source_entity_id: t.source_entity_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }));
    }
  } catch {
    // Table not found in schema cache, fallback to storage
  }

  // Fallback to storage/memory
  const stored = await readFromStorage(supabase);
  return stored
    .filter((t) => t.due_date === targetDate)
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * Create a new operational task (manual or system generated).
 */
export async function createOperationalTask(
  supabase: SupabaseClient,
  task: {
    organization_id: string;
    title: string;
    estimated_minutes: TaskEstimatedMinutes;
    due_date?: string;
    assigned_to?: string | null;
    client_id?: string | null;
    source_type?: "manual" | "system_generated";
    source_entity_type?: "content_item" | "content_feedback" | "invoice" | "tool_subscription" | "client_request" | null;
    source_entity_id?: string | null;
  }
): Promise<OperationalTask> {
  const due_date = task.due_date || getTodayDateStringIST();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: OperationalTask = {
    id,
    organization_id: task.organization_id,
    title: task.title,
    estimated_minutes: task.estimated_minutes,
    due_date,
    assigned_to: task.assigned_to || null,
    client_id: task.client_id || null,
    is_completed: false,
    completed_at: null,
    source_type: task.source_type || "manual",
    source_entity_type: task.source_entity_type || null,
    source_entity_id: task.source_entity_id || null,
    created_at: now,
    updated_at: now,
  };

  // Try Postgres Table
  try {
    const { data, error } = await supabase
      .from("operational_tasks")
      .insert({
        id: record.id,
        organization_id: record.organization_id,
        title: record.title,
        estimated_minutes: record.estimated_minutes,
        due_date: record.due_date,
        assigned_to: record.assigned_to,
        client_id: record.client_id,
        is_completed: false,
        source_type: record.source_type,
        source_entity_type: record.source_entity_type,
        source_entity_id: record.source_entity_id,
      })
      .select("*, users:assigned_to(full_name), clients:client_id(name)")
      .single();

    if (!error && data) {
      return {
        ...record,
        assigned_user_name: data.users?.full_name || null,
        client_name: data.clients?.name || null,
      };
    }
  } catch {
    // Fallback
  }

  // Fallback to storage/memory
  tasksMemoryCache.set(record.id, record);
  const allTasks = Array.from(tasksMemoryCache.values());
  await writeToStorage(supabase, allTasks);
  return record;
}

/**
 * Toggle task completion status.
 */
export async function toggleOperationalTask(
  supabase: SupabaseClient,
  taskId: string,
  is_completed: boolean
): Promise<{ success: boolean; task?: OperationalTask; error?: string }> {
  const completed_at = is_completed ? new Date().toISOString() : null;

  // Try Postgres Table
  try {
    const { data, error } = await supabase
      .from("operational_tasks")
      .update({
        is_completed,
        completed_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("*, users:assigned_to(full_name), clients:client_id(name)")
      .single();

    if (!error && data) {
      return {
        success: true,
        task: {
          id: data.id,
          organization_id: data.organization_id,
          title: data.title,
          estimated_minutes: data.estimated_minutes,
          due_date: data.due_date,
          assigned_to: data.assigned_to,
          assigned_user_name: data.users?.full_name || null,
          client_id: data.client_id,
          client_name: data.clients?.name || null,
          is_completed: data.is_completed,
          completed_at: data.completed_at,
          source_type: data.source_type,
          source_entity_type: data.source_entity_type,
          source_entity_id: data.source_entity_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      };
    }
  } catch {
    // Fallback
  }

  // Fallback to storage/memory
  const existing = tasksMemoryCache.get(taskId);
  if (existing) {
    existing.is_completed = is_completed;
    existing.completed_at = completed_at;
    existing.updated_at = new Date().toISOString();
    tasksMemoryCache.set(taskId, existing);
    const all = Array.from(tasksMemoryCache.values());
    await writeToStorage(supabase, all);
    return { success: true, task: existing };
  }

  return { success: false, error: "Task not found" };
}

/**
 * Delete an operational task.
 */
export async function deleteOperationalTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  // Try Postgres Table
  try {
    const { error } = await supabase
      .from("operational_tasks")
      .delete()
      .eq("id", taskId);

    if (!error) {
      tasksMemoryCache.delete(taskId);
      return { success: true };
    }
  } catch {
    // Fallback
  }

  // Fallback
  tasksMemoryCache.delete(taskId);
  const all = Array.from(tasksMemoryCache.values());
  await writeToStorage(supabase, all);
  return { success: true };
}
