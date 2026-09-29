import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientDocument } from "@/types/domain";

const BUCKET_NAME = "client-documents";

// In-memory write-through cache keyed by clientId so immediate soft-refreshes
// never read stale CDN copies while Supabase Storage replicates an upsert.
const globalForDocs = globalThis as unknown as {
  __clientDocsManifestCache?: Map<string, ClientDocument[]>;
};
const manifestMemoryCache =
  globalForDocs.__clientDocsManifestCache ??
  (globalForDocs.__clientDocsManifestCache = new Map<string, ClientDocument[]>());

/**
 * Automatically detects the external platform from a URL.
 */
export function detectExternalPlatform(url: string, fileName?: string | null): string {
  const lower = (url || "").toLowerCase();
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return "google_drive";
  }
  if (lower.includes("notion.so") || lower.includes("notion.site")) {
    return "notion";
  }
  if (lower.includes("figma.com")) {
    return "figma";
  }
  if (lower.includes("pitch.com") || lower.includes("canva.com")) {
    return "pitch";
  }
  if (lower.includes("loom.com")) {
    return "loom";
  }
  const ext = (fileName || lower).split(".").pop() || "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  return "other";
}

/**
 * Ensures the `client-documents` bucket exists in Supabase Storage.
 */
async function ensureDocumentsBucket(supabase: SupabaseClient) {
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

/**
 * Downloads the JSON manifest from Supabase Storage bypassing Cloudflare CDN cache.
 */
async function downloadFreshManifest(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientDocument[] | null> {
  const manifestPath = `manifests/${clientId}.json`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Prefer cache-busted direct REST fetch so Cloudflare CDN never returns a cached manifest
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
          return parsed as ClientDocument[];
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
        return parsed as ClientDocument[];
      }
    }
  } catch {
    // No manifest yet for this client
  }

  return null;
}

/**
 * Fetches client documents from `client_documents` table if available,
 * combined with the write-through cache and Supabase Storage `client-documents` manifest.
 */
export async function fetchClientDocuments(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientDocument[]> {
  const resultsMap = new Map<string, ClientDocument>();

  let sqlTableActive = false;

  // 1. Try SQL table `client_documents` (Primary Source of Truth)
  try {
    const { data, error } = await supabase
      .from("client_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      sqlTableActive = true;
      for (const row of data) {
        resultsMap.set(row.id, row as ClientDocument);
      }
    }
  } catch {
    // Table may not be migrated yet; fall through to storage manifest
  }

  // 2. Fallback / Migration bridge from write-through cache or Storage manifest
  const cachedManifest = manifestMemoryCache.get(clientId);
  if (cachedManifest) {
    for (const doc of cachedManifest) {
      if (doc && doc.id && !resultsMap.has(doc.id)) {
        resultsMap.set(doc.id, doc);
      }
    }
  } else if (!sqlTableActive || resultsMap.size === 0) {
    const remoteManifest = await downloadFreshManifest(supabase, clientId);
    if (remoteManifest) {
      manifestMemoryCache.set(clientId, remoteManifest);
      const missingInSql: ClientDocument[] = [];
      for (const doc of remoteManifest) {
        if (doc && doc.id && !resultsMap.has(doc.id)) {
          resultsMap.set(doc.id, doc);
          missingInSql.push(doc);
        }
      }
      // If SQL table is now active, auto-promote manifest records into PostgreSQL
      if (sqlTableActive && missingInSql.length > 0) {
        supabase
          .from("client_documents")
          .upsert(missingInSql, { onConflict: "id" })
          .then(() => {});
      }
    }
  }

  return Array.from(resultsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Saves a document to both `client_documents` SQL table (when present) and
 * the Supabase Storage manifest for guaranteed persistence.
 */
export async function saveClientDocumentRecord(
  supabase: SupabaseClient,
  doc: ClientDocument
): Promise<ClientDocument> {
  await ensureDocumentsBucket(supabase);

  // 1. Try inserting into SQL table
  try {
    const { data, error } = await supabase
      .from("client_documents")
      .insert({
        id: doc.id,
        client_id: doc.client_id,
        title: doc.title,
        category: doc.category,
        document_type: doc.document_type,
        file_url: doc.file_url,
        file_name: doc.file_name || null,
        file_size_bytes: doc.file_size_bytes || null,
        external_platform: doc.external_platform || null,
        notes: doc.notes || null,
        version: doc.version || null,
        created_at: doc.created_at,
      })
      .select()
      .single();

    if (!error && data) {
      doc = data as ClientDocument;
    }
  } catch {
    // Table not migrated yet; storage manifest handles persistence
  }

  // 2. Sync with write-through memory cache & Supabase Storage manifest
  const existing = await fetchClientDocuments(supabase, doc.client_id);
  const updated = [doc, ...existing.filter((d) => d.id !== doc.id)];

  // Immediately update in-memory write-through cache before storage roundtrip
  manifestMemoryCache.set(doc.client_id, updated);

  const manifestPath = `manifests/${doc.client_id}.json`;
  await supabase.storage.from(BUCKET_NAME).upload(
    manifestPath,
    JSON.stringify(updated, null, 2),
    {
      upsert: true,
      cacheControl: "0",
      contentType: "application/json",
    }
  );

  return doc;
}

/**
 * Deletes a document from both SQL table and Supabase Storage manifest.
 */
export async function removeClientDocumentRecord(
  supabase: SupabaseClient,
  clientId: string,
  documentId: string
): Promise<void> {
  // 1. Try deleting from SQL table
  try {
    await supabase.from("client_documents").delete().eq("id", documentId);
  } catch {
    // Ignore if table not present
  }

  // 2. Update write-through memory cache & Supabase Storage manifest
  try {
    const existing = await fetchClientDocuments(supabase, clientId);
    const targetDoc = existing.find((d) => d.id === documentId);
    const updated = existing.filter((d) => d.id !== documentId);

    // Immediately update in-memory write-through cache
    manifestMemoryCache.set(clientId, updated);

    const manifestPath = `manifests/${clientId}.json`;
    await supabase.storage.from(BUCKET_NAME).upload(
      manifestPath,
      JSON.stringify(updated, null, 2),
      {
        upsert: true,
        cacheControl: "0",
        contentType: "application/json",
      }
    );

    // If the document was an uploaded file in our bucket, clean up the file object
    if (targetDoc?.document_type === "file" && targetDoc.file_url.includes(`/${BUCKET_NAME}/`)) {
      const splitParts = targetDoc.file_url.split(`/${BUCKET_NAME}/`);
      const storageObjectPath = splitParts[1];
      if (storageObjectPath) {
        await supabase.storage.from(BUCKET_NAME).remove([decodeURIComponent(storageObjectPath)]);
      }
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Uploads a raw File object to Supabase Storage `client-documents` bucket
 * and returns its public URL.
 */
export async function uploadDocumentFileToStorage(
  supabase: SupabaseClient,
  clientId: string,
  file: File
): Promise<{ publicUrl: string; fileName: string; fileSize: number }> {
  await ensureDocumentsBucket(supabase);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `files/${clientId}/${Date.now()}_${safeName}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(objectPath, buffer, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
    });

  if (uploadErr) {
    throw new Error(`File upload failed: ${uploadErr.message}`);
  }

  const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);

  return {
    publicUrl: pubData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
  };
}
