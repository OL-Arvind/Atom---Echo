import { notFound } from "next/navigation";
import { getContentPostByIdFromDb } from "@/lib/data/supabase-queries";
import { ContentEditorClient } from "./content-editor-client";

export const dynamic = "force-dynamic";

interface ContentEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContentEditorPage({ params }: ContentEditorPageProps) {
  const { id } = await params;
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
      reviewToken={data.reviewToken}
    />
  );
}
