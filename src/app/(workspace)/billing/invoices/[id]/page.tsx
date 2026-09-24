import { notFound } from "next/navigation";
import { getInvoiceByIdFromDb } from "@/lib/data/supabase-queries";
import { InvoiceDetailClient } from "./invoice-detail-client";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const invoice = await getInvoiceByIdFromDb(id);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} />;
}
