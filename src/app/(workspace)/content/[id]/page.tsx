import { notFound } from "next/navigation";
import { getContentPostByIdFromDb } from "@/lib/data/supabase-queries";
import { ContentEditorClient } from "./content-editor-client";

export const dynamic = "force-dynamic";

interface ContentEditorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function ContentEditorPage({
  params,
  searchParams,
}: ContentEditorPageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = await getContentPostByIdFromDb(id);

  if (!data || !data.post) {
    notFound();
  }

  return (
    <ContentEditorClient
      post={data.post}
      context={data.context}
      knowledgeItems={data.knowledgeItems}
      feedbackItems={data.feedbackItems}
      revisions={data.revisions}
      reviewToken={data.reviewToken}
      latestMeetings={data.latestMeetings}
      initialFrom={sp.from}
    />
  );
}
