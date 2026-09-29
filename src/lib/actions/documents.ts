"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateDbCache } from "@/lib/data/supabase-queries";
import { requireOperatorSession } from "@/lib/auth/session";
import {
  detectExternalPlatform,
  saveClientDocumentRecord,
  removeClientDocumentRecord,
  uploadDocumentFileToStorage,
} from "@/lib/documents/storage";
import type { ClientDocument, DocumentCategory, DocumentType } from "@/types/domain";

const VALID_CATEGORIES: DocumentCategory[] = [
  "agreement",
  "proposal",
  "quotation",
  "roadmap",
  "asset",
  "other",
];

function revalidateClient(clientId: string) {
  invalidateDbCache();
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

/**
 * Add a new client document (either a cloud link or an uploaded file).
 */
export async function addClientDocumentAction(formData: FormData) {
  try {
    await requireOperatorSession();

    const clientId = String(formData.get("client_id") || "").trim();
    let title = String(formData.get("title") || "").trim();
    const rawCategory = String(formData.get("category") || "agreement").trim() as DocumentCategory;
    const category: DocumentCategory = VALID_CATEGORIES.includes(rawCategory)
      ? rawCategory
      : "other";
    const documentType = (String(formData.get("document_type") || "link").trim() === "file"
      ? "file"
      : "link") as DocumentType;
    const notes = String(formData.get("notes") || "").trim() || null;
    const version = String(formData.get("version") || "").trim() || null;

    if (!clientId) {
      return { success: false, error: "Client ID is required." };
    }

    const supabase = createAdminClient();

    let fileUrl = String(formData.get("file_url") || "").trim();
    let fileName: string | null = String(formData.get("file_name") || "").trim() || null;
    let fileSizeBytes: number | null = null;

    if (documentType === "file") {
      const uploadedFile = formData.get("file") as File | null;
      if (uploadedFile && uploadedFile.size > 0) {
        const uploadResult = await uploadDocumentFileToStorage(supabase, clientId, uploadedFile);
        fileUrl = uploadResult.publicUrl;
        fileName = uploadResult.fileName;
        fileSizeBytes = uploadResult.fileSize;
      } else if (!fileUrl) {
        return { success: false, error: "Please select a file to upload." };
      }
    } else {
      if (!fileUrl) {
        return { success: false, error: "Document URL is required." };
      }
      if (!/^https?:\/\//i.test(fileUrl)) {
        fileUrl = `https://${fileUrl}`;
      }
    }

    const externalPlatform = detectExternalPlatform(fileUrl, fileName);

    if (!title) {
      if (fileName) {
        title = fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim();
      } else {
        const catLabels: Record<DocumentCategory, string> = {
          agreement: "Client Agreement",
          roadmap: "Strategy & Content Roadmap",
          proposal: "Scope Proposal",
          quotation: "Commercial Quotation",
          asset: "Brand Asset",
          other: "Shared Document",
        };
        const dateStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        title = `${catLabels[category] || "Document"} · ${dateStr}`;
      }
    }

    const newDoc: ClientDocument = {
      id: crypto.randomUUID(),
      client_id: clientId,
      title,
      category,
      document_type: documentType,
      file_url: fileUrl,
      file_name: fileName,
      file_size_bytes: fileSizeBytes,
      external_platform: externalPlatform,
      notes,
      version,
      created_at: new Date().toISOString(),
    };

    const saved = await saveClientDocumentRecord(supabase, newDoc);

    revalidateClient(clientId);
    return { success: true, document: saved };
  } catch (err: any) {
    console.error("Error in addClientDocumentAction:", err);
    return {
      success: false,
      error: err?.message || "Failed to save document.",
    };
  }
}

/**
 * Delete a client document by ID.
 */
export async function deleteClientDocumentAction(documentId: string, clientId: string) {
  try {
    await requireOperatorSession();
    if (!documentId || !clientId) {
      return { success: false, error: "Missing document or client identifier." };
    }

    const supabase = createAdminClient();
    await removeClientDocumentRecord(supabase, clientId, documentId);

    revalidateClient(clientId);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteClientDocumentAction:", err);
    return {
      success: false,
      error: err?.message || "Failed to delete document.",
    };
  }
}
