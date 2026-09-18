import { notFound } from "next/navigation";
import { getClientByIdFromDb } from "@/lib/data/supabase-queries";
import { ClientWorkspaceView } from "./client-workspace-view";

export const dynamic = "force-dynamic";

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientByIdFromDb(id);

  if (!client) {
    notFound();
  }

  return <ClientWorkspaceView client={client} />;
}
