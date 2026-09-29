-- Migration 009: Client Memory, Meeting Intelligence & Context Stream
-- Date: 2026-09-26
-- Description: Extends meetings table with channel, attendees, key decisions, and action items 
-- to support seamless Fathom AI webhooks, manual phone debriefs, and WhatsApp conversation logs.

-- 1. Create channel enum if not present, or use text with check constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_channel') THEN
        CREATE TYPE meeting_channel AS ENUM (
            'fathom_video',
            'google_meet',
            'zoom',
            'phone_call',
            'whatsapp',
            'in_person'
        );
    END IF;
END $$;

-- 2. Add channel, attendees, key_decisions, and action_items to meetings table
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'fathom_video';

ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS attendees TEXT;

ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS key_decisions TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS action_items TEXT[] NOT NULL DEFAULT '{}';

-- 3. Add index on client_id and meeting_date for high-speed chronological timeline queries
CREATE INDEX IF NOT EXISTS idx_meetings_client_date 
ON meetings(client_id, meeting_date DESC);

-- 4. Ensure foreign key index on knowledge_items source_meeting_id exists
CREATE INDEX IF NOT EXISTS idx_knowledge_items_meeting 
ON knowledge_items(source_meeting_id);
