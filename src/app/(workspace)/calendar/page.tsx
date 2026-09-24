import { getCalendarDataFromDb } from "@/lib/data/supabase-queries";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const data = await getCalendarDataFromDb();

  return (
    <CalendarClient
      initialContentPosts={data.contentPosts}
      engagements={data.engagements}
      toolSubscriptions={data.toolSubscriptions}
      clients={data.clients}
    />
  );
}
