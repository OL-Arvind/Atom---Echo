import { getContentStudioDataFromDb } from "@/lib/data/supabase-queries";
import { ContentStudioClient } from "./content-studio-client";

export const dynamic = "force-dynamic";

export default async function ContentEnginePage() {
  const data = await getContentStudioDataFromDb();

  return (
    <ContentStudioClient
      initialPosts={data.posts}
      engagements={data.engagements}
      tokenMap={data.tokenMap}
    />
  );
}
