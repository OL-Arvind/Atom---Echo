import { notFound } from "next/navigation";
import { getClientByIdFromDb } from "@/lib/data/supabase-queries";
import { ClientWorkspaceView } from "./client-workspace-view";

import { ClientWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function ClientWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const client = await getClientByIdFromDb(id);

  if (!client) {
    notFound();
  }

  return (
    <ClientWorkspaceView
      client={client as unknown as ClientWithRelations}
      initialTab={sp.tab}
    />
  );
}
