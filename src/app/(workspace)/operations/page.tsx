import { getOperationsDataFromDb, getClientsFromDb } from "@/lib/data/supabase-queries";
import { OperationsClient } from "./operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [{ credentialLogs, clientRequests, feedback }, clients] = await Promise.all([
    getOperationsDataFromDb(),
    getClientsFromDb(),
  ]);

  return (
    <OperationsClient
      initialCredentialLogs={credentialLogs}
      initialClientRequests={clientRequests}
      initialFeedback={feedback}
      clients={clients}
    />
  );
}
