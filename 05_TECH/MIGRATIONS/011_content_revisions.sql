-- Migration 011: Content Revisions & Version History Ledger
-- Date: 2026-09-30
-- Description: Adds content_revisions table to track every version snapshot of a post across brainstorming, internal QA, and founder review cycles.

CREATE TABLE IF NOT EXISTS content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number >= 1),
    title TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    target_pillar TEXT,
    stage content_status NOT NULL DEFAULT 'draft',
    trigger_type TEXT NOT NULL DEFAULT 'manual_checkpoint' CHECK (
        trigger_type IN (
            'initial_draft',
            'manual_checkpoint',
            'sent_to_qa',
            'qa_returned',
            'sent_to_founder',
            'founder_returned',
            'approved',
            'published',
            'restored'
        )
    ),
    change_summary TEXT,
    feedback_note TEXT,
    author_name TEXT NOT NULL DEFAULT 'Editorial Team',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (content_item_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_item_version
    ON content_revisions(content_item_id, version_number DESC);
