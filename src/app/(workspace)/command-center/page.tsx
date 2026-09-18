import { getCommandCenterDataFromDb } from "@/lib/data/supabase-queries";
import { CommandCenterClient } from "./command-center-client";

export const dynamic = "force-dynamic";

export default async function CommandCenterPage() {
  const data = await getCommandCenterDataFromDb();

  return <CommandCenterClient initialData={data} />;
}
