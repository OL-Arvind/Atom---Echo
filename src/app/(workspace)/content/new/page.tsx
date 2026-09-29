import { getNewContentStudioDataFromDb } from "@/lib/data/supabase-queries";
import { ContentEditorClient } from "../[id]/content-editor-client";

export const dynamic = "force-dynamic";

interface NewContentStudioPageProps {
  searchParams: Promise<{
    clientId?: string;
    meetingId?: string;
    prompt?: string;
  }>;
}

export default async function NewContentStudioPage({
  searchParams,
}: NewContentStudioPageProps) {
  const [params, data] = await Promise.all([
    searchParams,
    getNewContentStudioDataFromDb(),
  ]);

  return (
    <ContentEditorClient
      isNew={true}
      clientOptions={data.clientOptions}
      initialClientId={params.clientId}
      initialMeetingId={params.meetingId}
      initialPrompt={params.prompt}
    />
  );
}
