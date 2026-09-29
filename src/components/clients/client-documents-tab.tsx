"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
  FileText,
  Link2,
  Receipt,
  X,
} from "lucide-react";
import type { ClientDocument, DocumentCategory, Invoice } from "@/types/domain";
import { deleteClientDocumentAction } from "@/lib/actions/documents";
import { AddDocumentModal } from "./add-document-modal";
import { SegmentedFilter, FilterSearchInput } from "@/components/ui/segmented-filter";

interface ClientDocumentsTabProps {
  clientId: string;
  clientName: string;
  documents: ClientDocument[];
  invoices: Invoice[];
  onToast?: (msg: string) => void;
  onDocumentsChange?: (docs: ClientDocument[]) => void;
}

type FilterOption = "all" | DocumentCategory | "invoice";

function formatBytes(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatShortDate(iso?: string | null): string {
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

function getCategoryMeta(cat: DocumentCategory): { label: string; dotColor: string } {
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

function getPlatformDisplay(platform?: string | null, docType?: string): string {
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

export function ClientDocumentsTab({
  clientId,
  clientName,
  documents,
  invoices,
  onToast,
  onDocumentsChange,
}: ClientDocumentsTabProps) {
  const [localDocuments, setLocalDocuments] = useState<ClientDocument[]>(documents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDefaultCat, setModalDefaultCat] = useState<DocumentCategory>("agreement");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<ClientDocument | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();

  // Keep local state synchronized when server props refresh
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const counts = useMemo(() => {
    const c = {
      all: localDocuments.length + invoices.length,
      agreement: 0,
      roadmap: 0,
      proposal: 0,
      quotation: 0,
      asset: 0,
      other: 0,
      invoice: invoices.length,
    };
    for (const d of localDocuments) {
      if (c[d.category] !== undefined) {
        c[d.category]++;
      } else {
        c.other++;
      }
    }
    return c;
  }, [localDocuments, invoices]);

  const filteredDocuments = useMemo(() => {
    if (selectedFilter === "invoice") return [];
    return localDocuments.filter((d) => {
      if (selectedFilter !== "all" && d.category !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = d.title.toLowerCase().includes(q);
        const inNotes = (d.notes || "").toLowerCase().includes(q);
        const inCat = d.category.toLowerCase().includes(q);
        const inVersion = (d.version || "").toLowerCase().includes(q);
        return inTitle || inNotes || inCat || inVersion;
      }
      return true;
    });
  }, [localDocuments, selectedFilter, searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (selectedFilter !== "all" && selectedFilter !== "invoice") {
      return [];
    }
    return invoices.filter((inv) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inNum = inv.invoice_number.toLowerCase().includes(q);
        const inStatus = inv.status.toLowerCase().includes(q);
        const inItems = (inv.line_items || []).some((li) =>
          li.description.toLowerCase().includes(q)
        );
        return inNum || inStatus || inItems || "invoice".includes(q);
      }
      return true;
    });
  }, [invoices, selectedFilter, searchQuery]);

  const handleCopyUrl = async (id: string, url: string, label: string) => {
    try {
      const fullUrl =
        url.startsWith("/") && typeof window !== "undefined"
          ? `${window.location.origin}${url}`
          : url;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      onToast?.(`Copied link for ${label}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenAddModal = (cat?: DocumentCategory) => {
    setModalDefaultCat(cat || "agreement");
    setShowAddModal(true);
  };

  const handleDocumentAdded = (msg: string, newDoc?: ClientDocument) => {
    if (newDoc) {
      const nextDocs = [
        newDoc,
        ...localDocuments.filter((d) => d.id !== newDoc.id),
      ];
      setLocalDocuments(nextDocs);
      onDocumentsChange?.(nextDocs);

      // Ensure the active filter shows the newly added document
      if (selectedFilter !== "all" && selectedFilter !== newDoc.category) {
        setSelectedFilter("all");
      }
      if (searchQuery.trim()) {
        setSearchQuery("");
      }
    }
    onToast?.(msg);
    router.refresh();
  };

  const confirmDeleteDoc = () => {
    if (!docToDelete) return;
    const target = docToDelete;
    startDeleteTransition(async () => {
      const res = await deleteClientDocumentAction(target.id, clientId);
      if (res.success) {
        const nextDocs = localDocuments.filter((d) => d.id !== target.id);
        setLocalDocuments(nextDocs);
        onDocumentsChange?.(nextDocs);
        onToast?.(`Removed "${target.title}".`);
        setDocToDelete(null);
        router.refresh();
      } else {
        onToast?.(res.error || "Failed to delete document.");
      }
    });
  };

  const totalVisible = filteredDocuments.length + filteredInvoices.length;

  return (
    <div className="space-y-5">
      {/* Add Document Modal */}
      <AddDocumentModal
        clientId={clientId}
        clientName={clientName}
        defaultCategory={modalDefaultCat}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleDocumentAdded}
      />

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDocToDelete(null);
          }}
        >
          <div className="w-full max-w-sm rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4 animate-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                Remove Document?
              </h3>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              Remove{" "}
              <strong className="font-medium text-[var(--color-ink)]">
                {docToDelete.title}
              </strong>{" "}
              from {clientName}?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoc}
                disabled={isDeleting}
                className="btn btn-primary text-xs"
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Documents
            </h2>
            <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
              ({counts.all})
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
            Contracts, roadmaps, proposals, and billing records for {clientName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            handleOpenAddModal(
              selectedFilter !== "all" && selectedFilter !== "invoice"
                ? selectedFilter
                : "agreement"
            )
          }
          className="btn btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Document</span>
        </button>
      </div>

      {/* ─── 2. COHESIVE FILTER TRACK & SEARCH ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SegmentedFilter
          options={[
            { id: "all", label: "All", count: counts.all },
            { id: "agreement", label: "Agreements", count: counts.agreement },
            { id: "roadmap", label: "Roadmaps", count: counts.roadmap },
            { id: "proposal", label: "Proposals", count: counts.proposal },
            { id: "quotation", label: "Quotations", count: counts.quotation },
            { id: "invoice", label: "Invoices", count: counts.invoice },
            { id: "asset", label: "Assets", count: counts.asset },
          ]}
          value={selectedFilter}
          onChange={(val) => setSelectedFilter(val as FilterOption)}
        />

        <FilterSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search files, links, or invoices..."
        />
      </div>

      {/* ─── 3. UNIFIED DOCUMENT & INVOICE LIST ─── */}
      {totalVisible === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink-secondary)]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="space-y-1 max-w-xs mx-auto">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              {searchQuery
                ? "No matching documents"
                : selectedFilter === "invoice"
                ? "No invoices issued yet"
                : "No documents added yet"}
            </h3>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {searchQuery
                ? `Nothing matched "${searchQuery}".`
                : selectedFilter === "invoice"
                ? "Issued retainer invoices automatically appear here."
                : "Drop a PDF or paste a Google Doc, Notion, or Figma link."}
            </p>
          </div>
          {selectedFilter !== "invoice" && !searchQuery && (
            <button
              type="button"
              onClick={() =>
                handleOpenAddModal(
                  selectedFilter !== "all"
                    ? (selectedFilter as DocumentCategory)
                    : "agreement"
                )
              }
              className="btn btn-secondary text-xs mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-[var(--color-line)] bg-[var(--color-surface)] divide-y divide-[var(--color-line-subtle)] overflow-hidden">
          {/* 1. Client Documents */}
          {filteredDocuments.map((doc) => {
            const meta = getCategoryMeta(doc.category);
            const platformName = getPlatformDisplay(
              doc.external_platform,
              doc.document_type
            );
            const sizeLabel = formatBytes(doc.file_size_bytes);
            const isCopied = copiedId === doc.id;

            return (
              <div
                key={doc.id}
                className="group px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Clean Icon Tile */}
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] group-hover:border-[var(--color-line-strong)] group-hover:text-[var(--color-ink)] transition-colors mt-0.5 sm:mt-0"
                  >
                    {doc.document_type === "file" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </a>

                  {/* Title + Scannable Sub-line */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] hover:underline truncate"
                      >
                        {doc.title}
                      </a>

                      {doc.version && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-sans tabular-nums text-[var(--color-ink-secondary)]">
                          <span className="text-[var(--color-ink-muted)]">·</span>
                          <span className="font-medium text-[var(--color-ink)]">
                            {doc.version}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`} />
                        <span>{meta.label}</span>
                      </span>
                      <span>·</span>
                      <span>{platformName}</span>
                      {sizeLabel && (
                        <>
                          <span>·</span>
                          <span>{sizeLabel}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatShortDate(doc.created_at)}</span>
                      {doc.notes && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--color-ink-secondary)] truncate max-w-[320px]">
                            {doc.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Cluster */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(doc.id, doc.file_url, doc.title)}
                    className="btn btn-ghost text-xs p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    title="Copy document link"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-[var(--color-ok-text)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-[11.5px] py-1 px-2.5 inline-flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-danger-text)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* 2. Projected Invoices */}
          {filteredInvoices.map((inv) => {
            const statusDot =
              inv.status === "paid"
                ? "bg-emerald-400"
                : inv.status === "overdue"
                ? "bg-red-400"
                : inv.status === "sent"
                ? "bg-blue-400"
                : "bg-amber-400";

            const statusLabel =
              inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
            const invoiceUrl = `/billing/invoices/${inv.id}`;
            const isCopied = copiedId === inv.id;
            const summaryText =
              inv.line_items && inv.line_items.length > 0
                ? inv.line_items.map((li) => li.description).join(" + ")
                : null;

            return (
              <div
                key={inv.id}
                className="group px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <Link
                    href={invoiceUrl}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-secondary)] group-hover:border-[var(--color-line-strong)] group-hover:text-[var(--color-ink)] transition-colors mt-0.5 sm:mt-0"
                  >
                    <Receipt className="h-4 w-4" />
                  </Link>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 font-sans tabular-nums">
                      <Link
                        href={invoiceUrl}
                        className="text-[13.5px] font-semibold tracking-tight text-[var(--color-ink)] hover:underline"
                      >
                        Invoice {inv.invoice_number}
                      </Link>
                      <span className="text-xs font-medium text-[var(--color-ink-secondary)]">
                        ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                      <span className="inline-flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                        <span>{statusLabel}</span>
                      </span>
                      <span>·</span>
                      <span>Issued {formatShortDate(inv.issue_date)}</span>
                      {inv.due_date && (
                        <>
                          <span>·</span>
                          <span>Due {formatShortDate(inv.due_date)}</span>
                        </>
                      )}
                      {summaryText && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--color-ink-secondary)] truncate max-w-[280px]">
                            {summaryText}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyUrl(inv.id, invoiceUrl, inv.invoice_number)
                    }
                    className="btn btn-ghost text-xs p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
                    title="Copy invoice link"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-[var(--color-ok-text)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <Link
                    href={invoiceUrl}
                    className="btn btn-secondary text-[11.5px] py-1 px-2.5 inline-flex items-center gap-1"
                  >
                    <span>Invoice</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--color-ink-tertiary)]" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
