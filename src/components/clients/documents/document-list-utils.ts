import type { DocumentCategory } from "@/types/domain";

export function formatBytes(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function getCategoryMeta(cat: DocumentCategory): { label: string; dotColor: string } {
  switch (cat) {
    case "agreement":
      return { label: "Agreement", dotColor: "bg-emerald-400" };
    case "roadmap":
      return { label: "Roadmap", dotColor: "bg-blue-400" };
    case "proposal":
      return { label: "Proposal", dotColor: "bg-purple-400" };
    case "quotation":
      return { label: "Quotation", dotColor: "bg-amber-400" };
    case "asset":
      return { label: "Brand Asset", dotColor: "bg-cyan-400" };
    default:
      return { label: "Document", dotColor: "bg-gray-400" };
  }
}

export function getPlatformDisplay(platform?: string | null, docType?: string): string {
  if (docType === "file") {
    if (platform === "pdf") return "PDF";
    if (platform === "doc") return "Word Doc";
    if (platform === "sheet") return "Spreadsheet";
    return "Uploaded File";
  }
  switch (platform) {
    case "google_drive":
      return "Google Docs";
    case "notion":
      return "Notion";
    case "figma":
      return "Figma";
    case "pitch":
      return "Deck";
    case "loom":
      return "Loom";
    case "pdf":
      return "PDF";
    default:
      return "Cloud Link";
  }
}
