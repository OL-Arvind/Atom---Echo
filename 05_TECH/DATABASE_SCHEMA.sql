-- =====================================================================
-- ATOM & ECHO OPERATING SYSTEM (BaseEngine) - PRODUCTION DATABASE DDL
-- Target: PostgreSQL 16 (Supabase)
-- Version: 1.0.0 (Phase 1 Operating Core)
-- =====================================================================

-- Enable required core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. ENUM TYPES SPECIFICATION
-- =====================================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'lead_operator',
    'writer',
    'designer'
);

CREATE TYPE client_status AS ENUM (
    'onboarding',
    'active',
    'paused',
    'churned'
);

CREATE TYPE service_type AS ENUM (
    'linkedin_branding',
    'cold_outreach',
    'hybrid_growth'
);

CREATE TYPE engagement_status AS ENUM (
    'active',
    'paused',
    'completed'
);

CREATE TYPE billing_frequency AS ENUM (
    'monthly',
    'quarterly',
    'project'
);

CREATE TYPE knowledge_category AS ENUM (
    'origin_story',
    'case_study',
    'metric_proof',
    'framework',
    'contrarian_opinion'
);

CREATE TYPE content_format AS ENUM (
    'text_only',
    'carousel_pdf',
    'image_single',
    'video'
);

CREATE TYPE content_status AS ENUM (
    'draft',
    'internal_review',
    'client_review',
    'approved',
    'scheduled',
    'published',
    'paused',
    'rejected'
);

CREATE TYPE author_type AS ENUM (
    'client',
    'internal_admin',
    'internal_writer'
);

CREATE TYPE vault_action AS ENUM (
    'view_masked',
    'unmask_password',
    'copy_password',
    'update_secret'
);

CREATE TYPE tool_cycle AS ENUM (
    'monthly',
    'annual',
    'credits'
);

CREATE TYPE expense_status AS ENUM (
    'unbilled',
    'drafted_in_invoice',
    'invoiced',
    'reimbursed'
);

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'approved',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);

CREATE TYPE request_category AS ENUM (
    'emergency_hold',
    'content_pivot',
    'design_tweak',
    'tool_issue',
    'general_query'
);

CREATE TYPE request_priority AS ENUM (
    'urgent',
    'high',
    'normal',
    'low'
);

CREATE TYPE request_status AS ENUM (
    'submitted',
    'acknowledged',
    'in_progress',
    'resolved',
    'closed'
);

-- =====================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 3. RELATIONAL TABLES
-- =====================================================================

-- 3.1 Organizations (Agency Tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_organizations_modtime
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Users (Agency Staff & Operators)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'writer',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.3 Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    founder_name TEXT NOT NULL,
    founder_title TEXT,
    founder_email TEXT,
    founder_phone TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    status client_status NOT NULL DEFAULT 'onboarding',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_clients_modtime
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.4 Engagements (Retainers / Contracts)
CREATE TABLE engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_type service_type NOT NULL DEFAULT 'linkedin_branding',
    status engagement_status NOT NULL DEFAULT 'active',
    monthly_retainer NUMERIC(12,2) NOT NULL,
    billing_frequency billing_frequency NOT NULL DEFAULT 'monthly',
    billing_anchor_day INTEGER NOT NULL CHECK (billing_anchor_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL,
    renewal_date DATE,
    primary_operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_engagements_modtime
    BEFORE UPDATE ON engagements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.5 Client Contexts (Founder Intelligence Vault)
CREATE TABLE client_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    positioning_statement TEXT,
    target_audience_icp TEXT,
    tone_archetype TEXT,
    voice_guidelines TEXT,
    taboo_words TEXT[] NOT NULL DEFAULT '{}',
    core_pillars TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_client_contexts_modtime
    BEFORE UPDATE ON client_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.6 Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meeting_date TIMESTAMPTZ NOT NULL,
    fathom_recording_url TEXT,
    raw_transcript TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.7 Knowledge Items (Proof points, stories, frameworks)
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    category knowledge_category NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    verified_metrics JSONB NOT NULL DEFAULT '{}',
    source_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_knowledge_items_modtime
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.8 Content Items (Pipeline Posts)
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body_markdown TEXT NOT NULL DEFAULT '',
    content_format content_format NOT NULL DEFAULT 'text_only',
    status content_status NOT NULL DEFAULT 'draft',
    assigned_writer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_designer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_pillar TEXT,
    scheduled_publish_date TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    linkedin_post_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_content_items_modtime
    BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.9 Review Tokens (Zero-Login PWA Links)
CREATE TABLE review_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10 Content Feedback (Inline comments from PWA review)
CREATE TABLE content_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    author_type author_type NOT NULL DEFAULT 'client',
    author_name TEXT NOT NULL,
    highlighted_text TEXT,
    comment TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.11 Credentials (Encrypted Vault)
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    username_or_email TEXT NOT NULL,
    encrypted_password TEXT NOT NULL, -- AES-256-GCM ciphertext + IV
    two_factor_method TEXT,
    notes TEXT,
    last_updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_credentials_modtime
    BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.12 Credential Audit Logs (Immutable compliance trail)
CREATE TABLE credential_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action vault_action NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.13 Tool Subscriptions (Agency SaaS catalog)
CREATE TABLE tool_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    tool_name TEXT NOT NULL,
    billing_cycle tool_cycle NOT NULL DEFAULT 'monthly',
    cost_amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    next_renewal_date DATE NOT NULL,
    default_pass_through BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tool_subscriptions_modtime
    BEFORE UPDATE ON tool_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.14 Tool Expenses (Client Pass-Through Expenses)
CREATE TABLE tool_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    tool_subscription_id UUID REFERENCES tool_subscriptions(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    incurred_date DATE NOT NULL,
    status expense_status NOT NULL DEFAULT 'unbilled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tool_expenses_modtime
    BEFORE UPDATE ON tool_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.15 Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status invoice_status NOT NULL DEFAULT 'draft',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_invoices_modtime
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.16 Invoice Line Items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tool_expense_id UUID REFERENCES tool_expenses(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.17 Client Requests (Service Tickets & Emergency Holds)
CREATE TABLE client_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category request_category NOT NULL DEFAULT 'general_query',
    priority request_priority NOT NULL DEFAULT 'normal',
    status request_status NOT NULL DEFAULT 'submitted',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_client_requests_modtime
    BEFORE UPDATE ON client_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.18 System Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. PERFORMANCE INDEXES
-- =====================================================================

-- Foreign key & association indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_engagements_client ON engagements(client_id);
CREATE INDEX idx_content_engagement ON content_items(engagement_id);
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_schedule ON content_items(scheduled_publish_date) WHERE scheduled_publish_date IS NOT NULL;
CREATE INDEX idx_review_tokens_hash ON review_tokens(token_hash) WHERE revoked = false;
CREATE INDEX idx_review_tokens_client ON review_tokens(client_id);
CREATE INDEX idx_credentials_client ON credentials(client_id);
CREATE INDEX idx_tool_expenses_engagement ON tool_expenses(engagement_id);
CREATE INDEX idx_tool_expenses_status ON tool_expenses(status);
CREATE INDEX idx_invoices_engagement ON invoices(engagement_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_client_requests_client ON client_requests(client_id);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_knowledge_client_cat ON knowledge_items(client_id, category);

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to fetch current user's organization
CREATE OR REPLACE FUNCTION get_auth_org_id() 
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organization tenant isolation policy
CREATE POLICY org_isolation_clients ON clients
  FOR ALL
  USING (organization_id = get_auth_org_id());

CREATE POLICY org_isolation_users ON users
  FOR SELECT
  USING (organization_id = get_auth_org_id());

CREATE POLICY org_isolation_engagements ON engagements
  FOR ALL
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = engagements.client_id AND clients.organization_id = get_auth_org_id()));

CREATE POLICY org_isolation_content ON content_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM engagements 
    JOIN clients ON clients.id = engagements.client_id 
    WHERE engagements.id = content_items.engagement_id 
    AND clients.organization_id = get_auth_org_id()
  ));

-- Credential Vault Access Restrictions
CREATE POLICY vault_operator_select ON credentials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'lead_operator')
    )
  );

CREATE POLICY vault_admin_modify ON credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Credential Audit Logs are append-only
CREATE POLICY audit_logs_insert ON credential_audit_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY audit_logs_select_admin ON credential_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
