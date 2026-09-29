import { getClientRosterDataFromDb } from "@/lib/data/supabase-queries";
import { ClientRosterView } from "./client-roster-view";

export const dynamic = "force-dynamic";

export default async function ClientsDirectoryPage() {
  const { clients, tokenMap } = await getClientRosterDataFromDb();

  return (
    <ClientRosterView
      initialClients={clients}
      tokenMap={tokenMap}
    />
  );
}
