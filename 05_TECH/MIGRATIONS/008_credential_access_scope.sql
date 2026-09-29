-- Migration 008: Add access_scope to credentials and relax credential_audit_logs user_id for client portal access
-- Date: 2026-09-26

-- 1. Add access_scope to credentials (distinguishes Agency Internal vs Client Shared logins)
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS access_scope TEXT NOT NULL DEFAULT 'agency_only' 
CHECK (access_scope IN ('agency_only', 'client_shared'));

-- 2. Relax user_id not-null constraint on credential_audit_logs to permit client token-based audit logging
ALTER TABLE credential_audit_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add client_id reference to credential_audit_logs for explicit client attribution
ALTER TABLE credential_audit_logs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
