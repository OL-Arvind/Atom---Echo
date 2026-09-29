"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Wrench,
  RotateCw,
  Receipt,
} from "lucide-react";
import { LogExpenseModal } from "@/components/clients/log-expense-modal";
import { AddToolSubscriptionModal } from "@/components/billing/add-tool-subscription-modal";
import { PageHeader } from "@/components/layout/page-header";
import { generateDraftInvoiceAction } from "@/lib/actions/client";
import { markExpenseBilledAction } from "@/lib/actions/content";
import { runBillingAnchorCycleAction, deleteToolSubscriptionAction } from "@/lib/actions/billing";
import { BillingInvoicesTab } from "@/components/billing/billing-invoices-tab";
import { BillingExpensesTab } from "@/components/billing/billing-expenses-tab";
import { BillingCatalogTab } from "@/components/billing/billing-catalog-tab";

interface BillingClientProps {
  initialExpenses: any[];
  initialInvoices: any[];
  clients: any[];
  toolSubscriptions?: any[];
}

export function BillingClient({
  initialExpenses,
  initialInvoices,
  clients,
  toolSubscriptions = [],
}: BillingClientProps) {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "catalog">("invoices");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const unbilledExpenses = initialExpenses.filter(
    (e) => e.status === "unbilled" || e.status === "drafted_in_invoice"
  );
  const unbilledTotal = unbilledExpenses.reduce(
    (acc, e) => acc + (e.status === "unbilled" ? Number(e.amount || 0) : 0),
    0
  );

  // Flatten engagements for LogExpenseModal
  const allEngagements = clients.flatMap((c) =>
    (c.engagements || []).map((eng: any) => ({
      ...eng,
      clientName: c.name,
      founderName: c.founder_name,
    }))
  );

  const handleDraftInvoice = () => {
    const targetClientId = selectedClientId || clients[0]?.id;
    if (!targetClientId) {
      showToast("No active client selected.");
      return;
    }

    startTransition(async () => {
      const res = await generateDraftInvoiceAction(targetClientId);
      if (res.success) {
        showToast(
          `Generated draft invoice ${res.invoiceNumber} for ₹${res.subtotal?.toLocaleString("en-IN")}`
        );
        router.refresh();
      } else {
        showToast(`Drafting error: ${res.error}`);
      }
    });
  };

  const handleRunAnchorCycle = () => {
    startTransition(async () => {
      const res = await runBillingAnchorCycleAction();
      if (res.success) {
        const count = res.draftedCount ?? 0;
        if (count > 0) {
          showToast(
            `Automated cycle complete: drafted ${count} invoice(s) for approaching anchor dates.`
          );
        } else {
          showToast("Anchor cycle complete: all eligible clients already invoiced for this month.");
        }
        router.refresh();
      } else {
        showToast(`Anchor cycle error: ${res.error}`);
      }
    });
  };

  const handleMarkBilled = (expenseId: string) => {
    startTransition(async () => {
      const res = await markExpenseBilledAction(expenseId);
      if (res.success) {
        showToast("Expense marked as invoiced.");
        router.refresh();
      }
    });
  };

  const handleDeleteTool = (toolId: string) => {
    if (!confirm("Are you sure you want to remove this tool subscription?")) return;
    startTransition(async () => {
      const res = await deleteToolSubscriptionAction(toolId);
      if (res.success) {
        showToast("Tool subscription removed.");
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Retainers &amp; Billing"
        description="Monthly retainers, transparent tool pass-throughs, and client invoice dispatch."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnchorCycle}
            disabled={isPending}
            className="btn btn-secondary text-xs"
            title="Auto-draft invoices for clients with anchor day in next 7 days"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Run Billing Cycle</span>
          </button>
          <button
            onClick={() => setShowAddToolModal(true)}
            className="btn btn-secondary text-xs"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Add Tool Subscription</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn btn-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Dedicated Tool</span>
          </button>
        </div>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Tool Infrastructure Catalog
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {toolSubscriptions.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Dedicated &amp; shared tool licenses</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Unbilled Client Tooling
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            ₹{unbilledTotal.toLocaleString("en-IN")}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Pass-through tooling ready for billing</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Invoices &amp; Retainers
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-accent-text)]">
            {initialInvoices.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Monthly scopes &amp; tool recovery</p>
        </div>
      </div>

      {/* Standardized Page-Level Tabs */}
      <div className="flex border-b border-[var(--color-line)] gap-7 overflow-x-auto overflow-y-hidden no-scrollbar">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "invoices"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Invoices ({initialInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "expenses"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Dedicated Client Tooling ({initialExpenses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors border-b-2 -mb-[1px] cursor-pointer whitespace-nowrap ${
            activeTab === "catalog"
              ? "border-[var(--color-ink)] text-[var(--color-ink)] font-medium"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Software Catalog ({toolSubscriptions.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === "invoices" && (
        <BillingInvoicesTab
          clients={clients}
          initialInvoices={initialInvoices}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          onDraftInvoice={handleDraftInvoice}
          isPending={isPending}
        />
      )}

      {/* TAB 2: PASS-THROUGH EXPENSES */}
      {activeTab === "expenses" && (
        <BillingExpensesTab
          initialExpenses={initialExpenses}
          onMarkBilled={handleMarkBilled}
          onAddExpense={() => setShowLogModal(true)}
          isPending={isPending}
        />
      )}

      {/* TAB 3: TOOL CATALOG */}
      {activeTab === "catalog" && (
        <BillingCatalogTab
          toolSubscriptions={toolSubscriptions}
          onAddTool={() => setShowAddToolModal(true)}
          onDeleteTool={handleDeleteTool}
          isPending={isPending}
        />
      )}

      {/* LOG EXPENSE MODAL */}
      <LogExpenseModal
        clientId={selectedClientId || clients[0]?.id || ""}
        engagements={allEngagements}
        toolSubscriptions={toolSubscriptions}
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
      />

      {/* ADD TOOL SUBSCRIPTION MODAL */}
      <AddToolSubscriptionModal
        isOpen={showAddToolModal}
        onClose={() => setShowAddToolModal(false)}
      />
    </div>
  );
}
