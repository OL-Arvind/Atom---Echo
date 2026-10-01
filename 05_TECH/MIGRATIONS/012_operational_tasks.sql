-- =====================================================================
-- ATOM & ECHO OPERATING SYSTEM - MIGRATION 012
-- Target: PostgreSQL 16 (Supabase)
-- Module: Operational Tasks & ADHD Action Queue
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.operational_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL DEFAULT 5 CHECK (estimated_minutes IN (1, 2, 3, 5, 10, 15, 30, 45, 60)),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'system_generated')),
    source_entity_type TEXT CHECK (source_entity_type IN ('content_item', 'content_feedback', 'invoice', 'tool_subscription', 'client_request')),
    source_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_operational_tasks_org_due ON public.operational_tasks(organization_id, due_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_assigned ON public.operational_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_operational_tasks_source ON public.operational_tasks(source_entity_type, source_entity_id);

-- Enable Row Level Security
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to operational_tasks"
    ON public.operational_tasks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
