import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentRevision,
  ContentRevisionTrigger,
  ContentStatus,
} from "@/types/domain";
import { computeContentDiff, synthesizePriorVersionBody } from "./diff";

const BUCKET_NAME = "content-revisions";

// In-memory write-through cache keyed by content_item_id so immediate soft-refreshes
// never read stale CDN copies while Supabase Storage replicates an upsert.
const globalForRevisions = globalThis as unknown as {
  __contentRevisionsCache?: Map<string, ContentRevision[]>;
};
const revisionsMemoryCache =
  globalForRevisions.__contentRevisionsCache ??
  (globalForRevisions.__contentRevisionsCache = new Map<string, ContentRevision[]>());

async function ensureRevisionsBucket(supabase: SupabaseClient) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    }
  } catch {
    // Non-fatal
  }
}

async function downloadFreshRevisionManifest(
  supabase: SupabaseClient,
  postId: string
): Promise<ContentRevision[] | null> {
  const manifestPath = `manifests/${postId}.json`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const url = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${manifestPath}?cb=${Date.now()}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const parsed = await res.json();
        if (Array.isArray(parsed)) {
          return parsed as ContentRevision[];
        }
      }
    } catch {
      // Fall back to SDK download below
    }
  }

  try {
    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`${manifestPath}?cb=${Date.now()}`);

    if (!dlErr && blob) {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed as ContentRevision[];
      }
    }
  } catch {
    // No manifest yet for this post
  }

  return null;
}

async function persistRevisionList(
  supabase: SupabaseClient,
  postId: string,
  revisions: ContentRevision[]
) {
  const sorted = [...revisions].sort((a, b) => b.version_number - a.version_number);
  revisionsMemoryCache.set(postId, sorted);

  try {
    await ensureRevisionsBucket(supabase);
    const manifestPath = `manifests/${postId}.json`;
    await supabase.storage.from(BUCKET_NAME).upload(
      manifestPath,
      JSON.stringify(sorted, null, 2),
      {
        upsert: true,
        cacheControl: "0",
        contentType: "application/json",
      }
    );
  } catch {
    // Non-fatal
  }
}

export interface PostSeedContext {
  id: string;
  title: string;
  body_markdown: string;
  target_pillar?: string | null;
  status: ContentStatus;
  created_at?: string;
  updated_at?: string;
  feedbackItems?: Array<{
    id?: string;
    author_type?: string;
    author_name?: string;
    comment?: string;
    is_resolved?: boolean;
    created_at?: string;
  }>;
}

/**
 * Fetches all revisions for a post (sorted newest first: vN ... v1).
 * If a post has no saved revisions yet, automatically synthesizes baseline history
 * so every post in the OS has an accurate v1 baseline (and v1 -> v2 if it already went through feedback).
 */
export async function fetchPostRevisions(
  supabase: SupabaseClient,
  postId: string,
  postContext?: PostSeedContext
): Promise<ContentRevision[]> {
  const resultsMap = new Map<number, ContentRevision>();
  let sqlTableActive = false;

  // 1. Try SQL table `content_revisions`
  try {
    const { data, error } = await supabase
      .from("content_revisions")
      .select("*")
      .eq("content_item_id", postId)
      .order("version_number", { ascending: false });

    if (!error && Array.isArray(data)) {
      sqlTableActive = true;
      for (const row of data) {
        resultsMap.set(row.version_number, row as ContentRevision);
      }
    }
  } catch {
    // Table may not be migrated yet; fall through to storage manifest
  }

  // 2. Merge with write-through memory cache or Supabase Storage manifest
  const cached = revisionsMemoryCache.get(postId);
  if (cached) {
    for (const rev of cached) {
      if (rev && typeof rev.version_number === "number" && !resultsMap.has(rev.version_number)) {
        resultsMap.set(rev.version_number, rev);
      }
    }
  } else if (!sqlTableActive || resultsMap.size === 0) {
    const remote = await downloadFreshRevisionManifest(supabase, postId);
    if (remote && remote.length > 0) {
      revisionsMemoryCache.set(postId, remote);
      for (const rev of remote) {
        if (rev && typeof rev.version_number === "number" && !resultsMap.has(rev.version_number)) {
          resultsMap.set(rev.version_number, rev);
        }
      }
    }
  }

  // 3. Auto-synthesize baseline revisions for existing posts that predate revision tracking
  if (resultsMap.size === 0 && postContext && postContext.body_markdown) {
    const feedback = postContext.feedbackItems || [];
    const sortedFeedback = [...feedback].sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    const latestFeedback = sortedFeedback[sortedFeedback.length - 1];
    const baseCreatedAt = postContext.created_at || new Date(Date.now() - 86400000).toISOString();

    if (latestFeedback && latestFeedback.comment) {
      // Post has feedback history: synthesize v1 (pre-feedback draft) and v2 (current draft)
      const v1Body = synthesizePriorVersionBody(
        postContext.body_markdown,
        latestFeedback.comment
      );
      const v1Hook =
        v1Body
          .split("\n")
          .map((l) => l.trim())
          .find(Boolean)
          ?.slice(0, 80) || postContext.title;
      const diff = computeContentDiff(v1Body, postContext.body_markdown);

      const v1: ContentRevision = {
        id: crypto.randomUUID(),
        content_item_id: postId,
        version_number: 1,
        title: v1Hook,
        body_markdown: v1Body,
        target_pillar: postContext.target_pillar || null,
        stage: "client_review",
        trigger_type:
          latestFeedback.author_type === "operator" ? "qa_returned" : "founder_returned",
        change_summary: "Initial perspective draft dispatched for review",
        feedback_note: latestFeedback.comment,
        author_name: "Nikhil (Editorial)",
        created_at: baseCreatedAt,
      };

      const v2: ContentRevision = {
        id: crypto.randomUUID(),
        content_item_id: postId,
        version_number: 2,
        title: postContext.title,
        body_markdown: postContext.body_markdown,
        target_pillar: postContext.target_pillar || null,
        stage: postContext.status,
        trigger_type:
          postContext.status === "client_review"
            ? "sent_to_founder"
            : postContext.status === "internal_review"
            ? "sent_to_qa"
            : "manual_checkpoint",
        change_summary: diff.humanSummary,
        feedback_note: null,
        author_name: "Sudeesh D S",
        created_at:
          postContext.updated_at ||
          latestFeedback.created_at ||
          new Date().toISOString(),
      };

      resultsMap.set(1, v1);
      resultsMap.set(2, v2);
      revisionsMemoryCache.set(postId, [v2, v1]);
    } else {
      // Standard post with no feedback yet: synthesize v1 baseline
      const v1: ContentRevision = {
        id: crypto.randomUUID(),
        content_item_id: postId,
        version_number: 1,
        title: postContext.title,
        body_markdown: postContext.body_markdown,
        target_pillar: postContext.target_pillar || null,
        stage: postContext.status,
        trigger_type:
          postContext.status === "client_review"
            ? "sent_to_founder"
            : postContext.status === "internal_review"
            ? "sent_to_qa"
            : "initial_draft",
        change_summary: "Initial perspective draft",
        feedback_note: null,
        author_name: "Editorial Team",
        created_at: baseCreatedAt,
      };
      resultsMap.set(1, v1);
      revisionsMemoryCache.set(postId, [v1]);
    }
  }

  return Array.from(resultsMap.values()).sort(
    (a, b) => b.version_number - a.version_number
  );
}

export interface RecordRevisionInput {
  postId: string;
  title: string;
  bodyMarkdown: string;
  previousTitle?: string | null;
  previousBodyMarkdown?: string | null;
  targetPillar?: string | null;
  stage: ContentStatus;
  triggerType: ContentRevisionTrigger;
  authorName?: string;
  feedbackNote?: string | null;
  customSummary?: string | null;
  forceNewVersion?: boolean;
}

/**
 * Records a new version snapshot or updates the latest snapshot with a feedback note.
 * Avoids duplicate snapshots when `body_markdown` is identical unless `forceNewVersion` is true.
 */
export async function recordContentRevision(
  supabase: SupabaseClient,
  input: RecordRevisionInput
): Promise<ContentRevision> {
  const existing = await fetchPostRevisions(supabase, input.postId, {
    id: input.postId,
    title: input.previousTitle || input.title,
    body_markdown: input.previousBodyMarkdown ?? input.bodyMarkdown,
    target_pillar: input.targetPillar,
    status: input.stage,
  });

  const latest = existing[0] || null;
  const cleanNewBody = (input.bodyMarkdown || "").trim();
  const cleanLatestBody = (latest?.body_markdown || "").trim();
  const bodyChanged = !latest || cleanNewBody !== cleanLatestBody;

  // Case 1: If a founder or QA returns a draft with a feedback note and the body hasn't changed yet,
  // attach the feedback note directly to the latest version they reviewed.
  if (
    latest &&
    !bodyChanged &&
    !input.forceNewVersion &&
    (input.triggerType === "founder_returned" || input.triggerType === "qa_returned")
  ) {
    const updatedLatest: ContentRevision = {
      ...latest,
      trigger_type: input.triggerType,
      feedback_note: input.feedbackNote || latest.feedback_note,
    };

    try {
      await supabase
        .from("content_revisions")
        .update({
          trigger_type: updatedLatest.trigger_type,
          feedback_note: updatedLatest.feedback_note,
        })
        .eq("id", latest.id);
    } catch {
      // Ignore if table not migrated
    }

    const updatedList = [
      updatedLatest,
      ...existing.filter((r) => r.version_number !== latest.version_number),
    ];
    await persistRevisionList(supabase, input.postId, updatedList);
    return updatedLatest;
  }

  // Case 2: If body hasn't changed and it's a passive stage transition, update stage/trigger on latest
  if (latest && !bodyChanged && !input.forceNewVersion) {
    const updatedLatest: ContentRevision = {
      ...latest,
      title: input.title || latest.title,
      target_pillar: input.targetPillar ?? latest.target_pillar,
      stage: input.stage,
      trigger_type:
        input.triggerType !== "manual_checkpoint" ? input.triggerType : latest.trigger_type,
      feedback_note: input.feedbackNote ?? latest.feedback_note,
    };

    try {
      await supabase
        .from("content_revisions")
        .update({
          title: updatedLatest.title,
          target_pillar: updatedLatest.target_pillar,
          stage: updatedLatest.stage,
          trigger_type: updatedLatest.trigger_type,
          feedback_note: updatedLatest.feedback_note,
        })
        .eq("id", latest.id);
    } catch {
      // Ignore
    }

    const updatedList = [
      updatedLatest,
      ...existing.filter((r) => r.version_number !== latest.version_number),
    ];
    await persistRevisionList(supabase, input.postId, updatedList);
    return updatedLatest;
  }

  // Case 3: Body changed (or explicit manual checkpoint / restore) -> Create new version (vN + 1)
  const nextVersionNumber = latest ? latest.version_number + 1 : 1;
  const diff = latest
    ? computeContentDiff(latest.body_markdown, input.bodyMarkdown)
    : null;

  const newRevision: ContentRevision = {
    id: crypto.randomUUID(),
    content_item_id: input.postId,
    version_number: nextVersionNumber,
    title: input.title,
    body_markdown: input.bodyMarkdown,
    target_pillar: input.targetPillar || null,
    stage: input.stage,
    trigger_type: nextVersionNumber === 1 ? "initial_draft" : input.triggerType,
    change_summary:
      input.customSummary ||
      (diff ? diff.humanSummary : "Initial perspective draft"),
    feedback_note: input.feedbackNote || null,
    author_name: input.authorName || "Editorial Team",
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("content_revisions")
      .insert({
        id: newRevision.id,
        content_item_id: newRevision.content_item_id,
        version_number: newRevision.version_number,
        title: newRevision.title,
        body_markdown: newRevision.body_markdown,
        target_pillar: newRevision.target_pillar,
        stage: newRevision.stage,
        trigger_type: newRevision.trigger_type,
        change_summary: newRevision.change_summary,
        feedback_note: newRevision.feedback_note,
        author_name: newRevision.author_name,
        created_at: newRevision.created_at,
      })
      .select()
      .single();

    if (!error && data) {
      Object.assign(newRevision, data);
    }
  } catch {
    // Storage manifest handles persistence
  }

  const updatedList = [newRevision, ...existing];
  await persistRevisionList(supabase, input.postId, updatedList);
  return newRevision;
}
