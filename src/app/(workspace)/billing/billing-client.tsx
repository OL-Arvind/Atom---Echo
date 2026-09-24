"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  Calendar,
  Building2,
  Wrench,
  RotateCw,
  Trash2,
  AlertTriangle,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { LogExpenseModal } from "@/components/clients/log-expense-modal";
import { AddToolSubscriptionModal } from "@/components/billing/add-tool-subscription-modal";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CustomSelect } from "@/components/ui/custom-select";
import { generateDraftInvoiceAction } from "@/lib/actions/client";
import { markExpenseBilledAction } from "@/lib/actions/content";
import { runBillingAnchorCycleAction, deleteToolSubscriptionAction } from "@/lib/actions/billing";

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
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Invoices &amp; Expenses"
        description="Track monthly retainers, software pass-through expenses, and generate client invoices."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnchorCycle}
            disabled={isPending}
            className="btn btn-secondary text-xs"
            title="Auto-draft invoices for clients with anchor day in next 7 days"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Run Anchor Cycle</span>
          </button>
          <button
            onClick={() => setShowAddToolModal(true)}
            className="btn btn-secondary text-xs"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Add Tool License</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn btn-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Software Expense</span>
          </button>
        </div>
      </PageHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Active Tool Licenses
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {toolSubscriptions.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Agency software subscriptions tracked</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Unbilled Software Expenses
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            ₹{unbilledTotal.toLocaleString("en-IN")}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Ready to attach to upcoming invoices</p>
        </div>

        <div className="card p-5 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Invoices Drafted
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-accent-text)]">
            {initialInvoices.length}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Retainers &amp; software expenses</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[var(--color-line)] gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "invoices"
              ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Invoices ({initialInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "expenses"
              ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Pass-Through Expenses ({initialExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === "catalog"
              ? "border-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
          }`}
        >
          Tool Catalog ({toolSubscriptions.length})
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* Quick Draft Generator Card */}
          <div className="card p-5 space-y-3 bg-[var(--color-base-raised)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-display text-base font-normal text-[var(--color-ink)] block">
                  Create Draft Invoice
                </span>
                <p className="text-xs text-[var(--color-ink-secondary)]">
                  Creates an invoice combining monthly retainer and unbilled pass-through expenses.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-56">
                  <CustomSelect
                    options={clients.map((c) => ({
                      value: c.id,
                      label: c.name,
                      description: c.founder_name,
                      brandName: c.name,
                    }))}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder="Select Client"
                  />
                </div>

                <button
                  onClick={handleDraftInvoice}
                  disabled={isPending || clients.length === 0}
                  className="btn btn-primary text-xs"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>{isPending ? "Creating..." : "Create Invoice"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Invoices List */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
              <div className="flex items-center gap-2.5">
                <Receipt className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
                  All Client Invoices ({initialInvoices.length})
                </h2>
              </div>
              <span className="font-mono text-xs text-[var(--color-ink-tertiary)]">
                Click invoice to review or mark paid
              </span>
            </div>

            {initialInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
                <p>No invoices drafted yet.</p>
                <p className="text-[11px]">Select a client above and click &quot;Create Invoice&quot;, or run the anchor cycle.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line-subtle)]">
                {initialInvoices.map((inv) => {
                  const client = inv.engagements?.clients;
                  const items = inv.invoice_line_items || [];

                  return (
                    <Link
                      key={inv.id}
                      href={`/billing/invoices/${inv.id}`}
                      className="block p-5 space-y-3 hover:bg-[var(--color-surface-hover)] transition-colors group cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-[var(--color-ink)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] px-2.5 py-1 rounded-[var(--radius-xs)]">
                            {inv.invoice_number}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <BrandLogo nameOrDomain={client?.name || ""} size={18} className="rounded-[2px]" />
                            <span className="text-xs font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                              {client?.name}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[var(--radius-xs)] border ${
                            inv.status === "paid"
                              ? "bg-[var(--color-ok-bg)] border-[var(--color-ok-line)] text-[var(--color-ok-text)]"
                              : inv.status === "sent"
                              ? "bg-[var(--color-accent-bg)] border-[var(--color-accent-line)] text-[var(--color-accent-text)]"
                              : "bg-[var(--color-base-subtle)] border-[var(--color-line)] text-[var(--color-ink-secondary)]"
                          }`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-display text-lg font-normal text-[var(--color-ink)] tabular-nums block">
                              ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[11px] text-[var(--color-ink-tertiary)] font-mono">
                              Due: {inv.due_date}
                            </span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-ink)] transition-colors shrink-0" />
                        </div>
                      </div>

                      {/* Line Items Preview */}
                      <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)] space-y-1.5 text-xs">
                        {items.map((it: any) => (
                          <div key={it.id} className="flex items-center justify-between text-[var(--color-ink-secondary)]">
                            <span>{it.description}</span>
                            <span className="font-mono font-medium text-[var(--color-ink)] tabular-nums">
                              ₹{Number(it.total_price).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PASS-THROUGH EXPENSES */}
      {activeTab === "expenses" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
                Logged Software Expenses ({initialExpenses.length})
              </h2>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="btn btn-secondary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Expense</span>
            </button>
          </div>

          {initialExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] leading-relaxed space-y-2">
              <p>No software expenses recorded yet.</p>
              <button
                onClick={() => setShowLogModal(true)}
                className="btn btn-secondary text-xs"
              >
                Log Software Expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {initialExpenses.map((exp: any) => (
                <div
                  key={exp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BrandLogo
                      nameOrDomain={exp.tool_name || exp.description}
                      size={28}
                      className="rounded-[var(--radius-xs)] border border-[var(--color-line)] shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[var(--color-ink)]">{exp.description}</span>
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[var(--radius-xs)] border ${
                          exp.status === "invoiced"
                            ? "bg-[var(--color-ok-bg)] border-[var(--color-ok-line)] text-[var(--color-ok-text)]"
                            : exp.status === "drafted_in_invoice"
                            ? "bg-[var(--color-accent-bg)] border-[var(--color-accent-line)] text-[var(--color-accent-text)]"
                            : "bg-[var(--color-base-subtle)] border-[var(--color-line)] text-[var(--color-ink-secondary)]"
                        }`}>
                          {exp.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-tertiary)] font-mono">
                        Client: {exp.engagements?.clients?.name || "Client"} &middot; Incurred: {exp.incurred_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-display text-base font-normal text-[var(--color-ink)] block tabular-nums">
                        ₹{Number(exp.amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {exp.status === "unbilled" && (
                      <button
                        onClick={() => handleMarkBilled(exp.id)}
                        disabled={isPending}
                        className="btn btn-ghost text-xs"
                        title="Mark as invoiced manually"
                      >
                        Mark Billed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOOL CATALOG */}
      {activeTab === "catalog" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3.5 bg-[var(--color-base-raised)]">
            <div className="flex items-center gap-2.5">
              <Wrench className="h-4 w-4 text-[var(--color-accent)]" />
              <div>
                <h2 className="font-display text-base font-normal text-[var(--color-ink)]">
                  Agency Tool Subscriptions ({toolSubscriptions.length})
                </h2>
                <p className="text-[11px] text-[var(--color-ink-secondary)]">
                  Active software licenses, renewal cycles, and pass-through defaults.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddToolModal(true)}
              className="btn btn-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tool</span>
            </button>
          </div>

          {toolSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
              <p>No tools in the catalog yet.</p>
              <button
                onClick={() => setShowAddToolModal(true)}
                className="btn btn-secondary text-xs"
              >
                Add Your First Tool
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line-subtle)]">
              {toolSubscriptions.map((tool) => {
                const today = new Date().toISOString().split("T")[0];
                const fiveDays = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
                const isRenewingSoon = tool.next_renewal_date >= today && tool.next_renewal_date <= fiveDays;

                return (
                  <div
                    key={tool.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BrandLogo
                        nameOrDomain={tool.tool_name}
                        size={32}
                        className="rounded-[var(--radius-xs)] border border-[var(--color-line)] shrink-0"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[var(--color-ink)]">{tool.tool_name}</span>
                          <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)]">
                            {tool.billing_cycle}
                          </span>
                          {tool.default_pass_through && (
                            <span className="text-[10px] font-mono bg-[var(--color-base-subtle)] border border-[var(--color-line)] px-1.5 py-0.2 rounded text-[var(--color-ink-tertiary)]">
                              Pass-Through
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-tertiary)]">
                          <span>Next Renewal: {tool.next_renewal_date}</span>
                          {isRenewingSoon && (
                            <span className="flex items-center gap-1 text-[var(--color-warning-text)] bg-[var(--color-warning-bg)] border border-[var(--color-warning-line)] px-1.5 py-0.2 rounded text-[10px]">
                              <AlertTriangle className="h-3 w-3" />
                              Renews in &le; 5 days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-display text-base font-normal text-[var(--color-ink)] tabular-nums block">
                          {tool.currency} {Number(tool.cost_amount).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-[var(--color-ink-tertiary)] font-mono">
                          per {tool.billing_cycle}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteTool(tool.id)}
                        disabled={isPending}
                        className="btn btn-ghost text-xs text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg)] p-2"
                        title="Delete Tool Subscription"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
