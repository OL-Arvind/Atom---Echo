import type { DocumentCategory } from "@/types/domain";

export const CATEGORIES: { value: DocumentCategory; label: string; dotColor: string }[] = [
  { value: "agreement", label: "Agreement / SOW", dotColor: "bg-emerald-400" },
  { value: "roadmap", label: "Roadmap", dotColor: "bg-blue-400" },
  { value: "proposal", label: "Proposal", dotColor: "bg-purple-400" },
  { value: "quotation", label: "Quotation", dotColor: "bg-amber-400" },
  { value: "asset", label: "Brand Asset", dotColor: "bg-cyan-400" },
  { value: "other", label: "Other", dotColor: "bg-gray-400" },
];

export const QUICK_STATUS_TAGS = ["Signed", "Final", "v1.0", "Draft", "Active"];

export function detectPlatformLabel(url: string): string | null {
  const lower = url.toLowerCase().trim();
  if (!lower) return null;
  if (lower.includes("docs.google.com/document")) return "Google Doc";
  if (lower.includes("docs.google.com/spreadsheets")) return "Google Sheet";
  if (lower.includes("docs.google.com/presentation")) return "Google Slides";
  if (lower.includes("drive.google.com")) return "Google Drive";
  if (lower.includes("notion.so") || lower.includes("notion.site")) return "Notion";
  if (lower.includes("figma.com")) return "Figma";
  if (lower.includes("pitch.com") || lower.includes("canva.com")) return "Deck";
  if (lower.includes("loom.com")) return "Loom";
  if (lower.endsWith(".pdf")) return "PDF";
  return "Web Link";
}

/**
 * Infers a clean document category from a filename, title, or URL.
 */
export function inferCategoryFromText(text: string): DocumentCategory | null {
  const lower = text.toLowerCase();
  if (/\b(msa|sow|agreement|contract|nda|retainer|terms|signed)\b/.test(lower)) {
    return "agreement";
  }
  if (/\b(roadmap|strategy|plan|calendar|q[1-4]|blueprint)\b/.test(lower)) {
    return "roadmap";
  }
  if (/\b(proposal|pitch|deck|onboarding|scope)\b/.test(lower)) {
    return "proposal";
  }
  if (/\b(quote|quotation|pricing|estimate|commercial)\b/.test(lower)) {
    return "quotation";
  }
  if (/\b(brand|logo|asset|styleguide|identity|kit|font)\b/.test(lower)) {
    return "asset";
  }
  return null;
}

/**
 * Attempts to extract a readable document title from a pasted URL slug
 * (e.g., Notion or file links).
 */
export function extractTitleFromUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === "edit" || last === "view" || last.length < 4) {
      return null;
    }
    // Strip trailing 32-char Notion hex IDs or hashes
    const withoutHash = last
      .replace(/-[a-f0-9]{32}$/i, "")
      .replace(/\.[a-z0-9]{2,5}$/i, "");
    if (/^[a-zA-Z0-9_-]{20,}$/.test(withoutHash) && !withoutHash.includes("-")) {
      // Looks like an opaque Google Doc ID
      return null;
    }
    const readable = decodeURIComponent(withoutHash)
      .replace(/[-_]+/g, " ")
      .trim();
    if (readable.length >= 3 && readable.length <= 80) {
      return readable;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
