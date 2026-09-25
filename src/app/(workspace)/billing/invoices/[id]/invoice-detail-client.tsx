"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Share2,
  CheckCircle2,
  FileCheck,
  Send,
  Building2,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { BrandLogo } from "@/components/ui/brand-logo";
import { updateInvoiceStatusAction } from "@/lib/actions/billing";
import { InvoiceStatus } from "@/types/domain";

interface InvoiceDetailClientProps {
  invoice: any;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const client = invoice.engagements?.clients;
  const engagement = invoice.engagements;
  const lineItems = invoice.invoice_line_items || [];
  const status: InvoiceStatus = invoice.status;

  const handleStatusTransition = (newStatus: InvoiceStatus) => {
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(invoice.id, newStatus);
      if (res.success) {
        showToast(`Invoice updated to ${newStatus}.`);
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  // Pre-format WhatsApp payment notification
  const founderPhone = client?.founder_phone?.replace(/[^\d+]/g, "") || "";
  const whatsappText = encodeURIComponent(
    `Hi ${client?.founder_name || "there"},\n\n` +
      `Here is the invoice summary for ${client?.name || "your engagement"} with Atom & Echo:\n\n` +
      `📄 Invoice: ${invoice.invoice_number}\n` +
      `💰 Amount: ₹${Number(invoice.total_amount).toLocaleString("en-IN")}\n` +
      `📅 Due Date: ${invoice.due_date}\n\n` +
      `Please let us know once the wire transfer is initiated. Thank you!`
  );
  const whatsappUrl = founderPhone
    ? `https://wa.me/${founderPhone}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation & Controls Bar (Hidden during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Link
          href="/billing"
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Invoices &amp; Expenses</span>
        </Link>

        {/* Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {status === "draft" && (
            <button
              onClick={() => handleStatusTransition("approved")}
              disabled={isPending}
              className="btn btn-primary text-xs"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Approve Invoice</span>
            </button>
          )}

          {status === "approved" && (
            <button
              onClick={() => handleStatusTransition("sent")}
              disabled={isPending}
              className="btn btn-primary text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Mark as Sent</span>
            </button>
          )}

          {status === "sent" && (
            <button
              onClick={() => handleStatusTransition("paid")}
              disabled={isPending}
              className="btn btn-primary text-xs bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border-[var(--color-ok-line)] hover:opacity-90"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark as Paid</span>
            </button>
          )}

          {status === "paid" && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-ok-bg)] border border-[var(--color-ok-line)] text-xs font-medium text-[var(--color-ok-text)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Paid on {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : "Record"}</span>
            </span>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs flex items-center gap-1.5"
            title="Send WhatsApp payment link to founder"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span>WhatsApp Nudge</span>
          </a>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary text-xs"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE INVOICE PAPER CANVAS */}
      <div className="card bg-white p-8 sm:p-12 shadow-sm border border-[var(--color-line)] text-slate-800 space-y-8 rounded-[var(--radius-lg)] print:border-none print:shadow-none print:p-0">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Image
                src="/brand-wordmark-dark.svg"
                alt="Atom & Echo"
                width={150}
                height={55}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              BaseWorks Executive Personal Branding &amp; Growth Studio
              <br />
              Bangalore, Karnataka, India
              <br />
              billing@atomecho.com
            </p>
          </div>

          <div className="text-right space-y-2">
            <h1 className="font-display text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
              Invoice
            </h1>
            <div className="space-y-0.5 text-xs text-slate-500 font-sans tabular-nums">
              <p className="font-bold text-slate-800 text-sm">{invoice.invoice_number}</p>
              <p>Issue Date: {invoice.issue_date}</p>
              <p>Payment Due: {invoice.due_date}</p>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[11px] font-sans tabular-nums font-semibold uppercase tracking-wider text-slate-700">
              <span className={`h-1.5 w-1.5 rounded-full ${
                status === "paid"
                  ? "bg-emerald-600"
                  : status === "sent"
                  ? "bg-purple-600"
                  : status === "approved"
                  ? "bg-blue-600"
                  : "bg-slate-400"
              }`} />
              {status}
            </div>
          </div>
        </div>

        {/* Client & Service Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Billed To
            </span>
            <p className="font-bold text-slate-900 text-sm">{client?.name || "Client"}</p>
            <p className="text-slate-600 font-medium">Attn: {client?.founder_name} ({client?.founder_title || "Founder"})</p>
            {client?.founder_email && <p className="text-slate-500">{client.founder_email}</p>}
            {client?.founder_phone && <p className="text-slate-500 font-sans tabular-nums">{client.founder_phone}</p>}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Engagement Terms
            </span>
            <p className="font-semibold text-slate-800">
              {engagement?.service_type === "linkedin_branding"
                ? "Founder Personal Branding (Ghostwriting)"
                : engagement?.service_type === "cold_outreach"
                ? "Outbound Growth & Campaigns"
                : "Hybrid Growth Retainer"}
            </p>
            <p className="text-slate-500 font-sans tabular-nums">
              Anchor Day: {engagement?.billing_anchor_day || 1}st of month
            </p>
            <p className="text-slate-500 font-sans tabular-nums">Currency: INR (₹)</p>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="space-y-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-center w-16">Qty</th>
                <th className="py-3 px-3 text-right w-32">Rate (₹)</th>
                <th className="py-3 px-3 text-right w-36">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lineItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-3">
                    <span className="font-medium text-slate-900 block">{item.description}</span>
                    {item.tool_expense_id && (
                      <span className="text-[10px] font-sans tabular-nums text-slate-400">
                        Pass-through tool license reimbursement
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center font-sans tabular-nums">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-sans tabular-nums">
                    ₹{Number(item.unit_price).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3 text-right font-sans font-semibold text-slate-900 tabular-nums">
                    ₹{Number(item.total_price).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-sans font-medium tabular-nums">
                ₹{Number(invoice.subtotal_amount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Taxes / GST</span>
              <span className="font-sans tabular-nums">₹0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-sm text-slate-900">
              <span>Total Due</span>
              <span className="font-sans text-lg tabular-nums text-slate-950">
                ₹{Number(invoice.total_amount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Bank & Payment Instructions Footer */}
        <div className="rounded-[var(--radius-sm)] bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Payment Instructions</p>
          <p className="leading-relaxed">
            Please transfer the total amount via NEFT / RTGS / IMPS to the Atom &amp; Echo operating account.
            For any billing queries or updated purchase order numbers, contact Sudeesh at <span className="font-sans tabular-nums">sudeesh@atomecho.com</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
