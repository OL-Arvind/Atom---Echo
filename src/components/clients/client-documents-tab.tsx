"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import type { ClientDocument, DocumentCategory, Invoice } from "@/types/domain";
import { deleteClientDocumentAction } from "@/lib/actions/documents";
import { AddDocumentModal } from "./add-document-modal";
import { SegmentedFilter, FilterSearchInput } from "@/components/ui/segmented-filter";
import { DocumentRowItem } from "./documents/document-row-item";
import { InvoiceRowItem } from "./documents/invoice-row-item";
import { DeleteDocumentDialog } from "./documents/delete-document-dialog";

interface ClientDocumentsTabProps {
  clientId: string;
  clientName: string;
  documents: ClientDocument[];
  invoices: Invoice[];
  onToast?: (msg: string) => void;
  onDocumentsChange?: (docs: ClientDocument[]) => void;
}

type FilterOption = "all" | DocumentCategory | "invoice";

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
      <DeleteDocumentDialog
        doc={docToDelete}
        clientName={clientName}
        isDeleting={isDeleting}
        onClose={() => setDocToDelete(null)}
        onConfirm={confirmDeleteDoc}
      />

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
          {filteredDocuments.map((doc) => (
            <DocumentRowItem
              key={doc.id}
              doc={doc}
              isCopied={copiedId === doc.id}
              onCopyUrl={() => handleCopyUrl(doc.id, doc.file_url, doc.title)}
              onDelete={() => setDocToDelete(doc)}
            />
          ))}

          {/* 2. Projected Invoices */}
          {filteredInvoices.map((inv) => (
            <InvoiceRowItem
              key={inv.id}
              inv={inv}
              isCopied={copiedId === inv.id}
              onCopyUrl={() =>
                handleCopyUrl(inv.id, `/billing/invoices/${inv.id}`, inv.invoice_number)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
