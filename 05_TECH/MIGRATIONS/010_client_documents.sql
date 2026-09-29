-- Migration 010: Client Documents & Strategic Assets Vault
-- Date: 2026-09-26
-- Description: Adds client_documents table to store agreements, SOWs, roadmaps, proposals, quotations, and brand assets per client.

CREATE TABLE IF NOT EXISTS client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('agreement', 'proposal', 'quotation', 'roadmap', 'asset', 'other')),
    document_type TEXT NOT NULL CHECK (document_type IN ('link', 'file')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    external_platform TEXT, -- 'google_drive', 'notion', 'figma', 'pitch', 'loom', 'doc', 'other'
    notes TEXT,
    version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast per-client and per-category filtering
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_documents_category ON client_documents(client_id, category);

-- Modtime trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_documents_modtime') THEN
        CREATE TRIGGER update_client_documents_modtime
            BEFORE UPDATE ON client_documents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
