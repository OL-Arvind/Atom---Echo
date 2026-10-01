# Slice 2 Detailed Implementation Plan: Hot Leads Tracker & 72-Hour Sample Post Pipeline

**Target System**: Custom Operating System for Atom & Echo  
**Product Architecture**: BaseEngine Productized Operating System (by BaseWorks)  
**Stakeholders**: Sudeesh D S (Founder & Admin, Atom & Echo), Nikhil (Lead Operator), Aravind (BaseWorks)  
**Status**: DRAFTED FOR REVIEW & EXECUTION  
**Primary Reference Files**:
- Client Demo Transcript & Email Recap: [`To-Do List`](file:///d:/BaseWorks/Atom%20&%20Echo/To-Do%20List)
- Operating Rules & Craft Standards: [`AGENTS.md`](file:///d:/BaseWorks/Atom%20&%20Echo/AGENTS.md)
- High-Level Roadmap: [`06_BUILD/ENHANCEMENT_PLAN_V1.md`](file:///d:/BaseWorks/Atom%20&%20Echo/06_BUILD/ENHANCEMENT_PLAN_V1.md)
- Previous Slice Baseline: [`06_BUILD/SLICE_1_IMPLEMENTATION_PLAN.md`](file:///d:/BaseWorks/Atom%20&%20Echo/06_BUILD/SLICE_1_IMPLEMENTATION_PLAN.md)

---

## 1. Context & Why This Task Was Selected

### 1.1 The Real-Life Pain Identified in Demo & Transcript
During the September 24 demo, Sudeesh explained how Atom & Echo actually acquires founder clients:
1. **The Core Acquisition Engine**:
   - Atom & Echo runs an outbound campaign where any founder who responds is offered **two high-value, bespoke sample LinkedIn posts**.
   - Sudeesh commits to a strict SLA: **"We will deliver your 2 custom sample posts within 72 hours of your reply."**
2. **The Current Notion Headache**:
   - Sudeesh currently tracks this in a messy Notion table (`https://app.notion.com/p/atomnecho/Leads-Tracker-Sample-Posts-Campaign...`).
   - In Notion, tracking follow-ups is chaotic: manual checkbox columns ("Follow-up 1 Done", "Next Follow-up Date: 27th", "Follow-up 2 Done", "Next Follow-up Date: 17th").
   - Crucially, Sudeesh keeps the **drafted sample posts right inside the Notion card** so he and Nikhil can write, revise, and copy them.
3. **The Current Embarrassment in the OS**:
   - In our current navigation, the link `/campaigns` is called "Outbound & GTM".
   - It is a completely static placeholder displaying fake marketing metrics (*"99.2% inbox placement"*, *"₹63,00,000 pipeline"*). It does not connect to the database, cannot create leads, and provides zero operational utility.
   - Sudeesh explicitly asked (Requirement #5):
     > *"We have to build a complete Hot Leads Management section, this will replace the current 'Outbound & GTM' section... tell me how we can go about this?"*

---

## 2. Rational Critique & Critique of `ENHANCEMENT_PLAN_V1.md`

The previous agent outlined Slice 4 in `06_BUILD/ENHANCEMENT_PLAN_V1.md`. While the direction was correct, a critical review against Sudeesh's actual workflow reveals **five serious flaws**:

### Flaw 1: The "Ghost Posts" Defect (Nowhere to write or store the sample posts!)
* **What the previous plan proposed**:
  `sample_post_1_status: Enum ('not_started', 'drafted', 'sent')`
  `sample_post_2_status: Enum ('not_started', 'drafted', 'sent')`
* **Why that fails in real life**:
  It stored status tags, but **no fields to actually store the post text**! Sudeesh specifically told Aravind in the transcript:
  > *"And another idea of why we built here is because we had this content inside itself. The sample post that we were offering, we had this inside itself."*
  If operators cannot write, edit, and review Sample Post 1 and Sample Post 2 directly inside the Lead Inspector, they will be forced to keep writing them in Notion or Google Docs.
* **Our Rational Fix**:
  Add dedicated text columns for both sample posts (`sample_post_1_hook`, `sample_post_1_body`, `sample_post_2_hook`, `sample_post_2_body`). Provide a tabbed editor directly in the Lead Inspector with a live LinkedIn post preview.

### Flaw 2: Lifeless Database Timestamps vs. Visual 72-Hour ADHD Ticker
* **What the previous plan proposed**:
  A plain `deadline_72h: Timestamptz`.
* **Why that fails in real life**:
  For an ADHD founder, seeing `2026-10-05 14:30:00` does not trigger motivation or urgency.
* **Our Rational Fix**:
  A color-calibrated live countdown indicator:
  - `⏳ 54h left` (Serene olive slate / calm)
  - `⚡ 8h left` (High-focus amber)
  - `⚠️ Overdue by 4h` (Crisp red alert)
  All active leads are automatically sorted so the closest deadline is anchored at the very top.

### Flaw 3: The Multi-Step Follow-Up Lifecycle Was Completely Ignored
* **What the previous plan proposed**:
  Only high-level statuses: `active`, `converted`, `dropped`, `maybe_later`.
* **Why that fails in real life**:
  Sending the sample posts is only half the battle. Founders are busy; Sudeesh follows up 2 days later, then 4 days later, or books a discovery call.
* **Our Rational Fix**:
  A structured operational pipeline:
  1. `sample_drafting` (Within the 72h delivery SLA)
  2. `sample_sent` (Sample posts delivered, waiting for founder review)
  3. `followed_up_1` (First follow-up sent)
  4. `followed_up_2` (Second follow-up sent)
  5. `call_booked` (Discovery / closing call scheduled)
  6. `converted` (Won client)
  7. `maybe_later` (Snoozed for 6–8 months)
  8. `dropped` (Disqualified / archived)
  With a 1-click `[Log Follow-Up]` button that automatically advances the stage and bumps the follow-up reminder date.

### Flaw 4: Missing the 1-Click Conversion Bridge to Content Studio
* **What the previous plan proposed**:
  "Creates a client record in clients."
* **Why that fails in real life**:
  When a founder signs on, the 2 sample posts they loved are already written! If the team has to manually copy-paste them from the lead record into the Content Studio, it violates BaseWorks Law 1: *"Manual by Exception"*.
* **Our Rational Fix**:
  When Sudeesh clicks "Convert to Client", the system creates the client profile, generates an active engagement, and **automatically copies Sample Post 1 and Sample Post 2 into `content_items` as real drafted posts** in the Content Studio.

### Flaw 5: Disconnected from the Command Center
* **What the previous plan proposed**:
  Vague mention of Command Center tasks.
* **Our Rational Fix**:
  Direct bidirectional integration with the Slice 1 Command Center:
  - If a 72h sample post deadline is due within 24 hours, the Command Center automatically injects an ADHD action item: `⚡ 15 min Draft sample posts for {Lead Name}`.
  - If a lead was snoozed as "Maybe Later" for 6 months, when that future date arrives, the Command Center automatically pops a reconnection action: `⚡ 3 min Reconnect with {Lead Name} (Snoozed 6m ago)`.

---

## 3. Database Schema Specification

### 3.1 Migration File: `05_TECH/MIGRATIONS/013_hot_leads_pipeline.sql`

```sql
-- Migration: 013_hot_leads_pipeline.sql
-- Description: Create hot_leads table for the 72-hour sample post acquisition engine

CREATE TYPE public.lead_priority AS ENUM ('urgent', 'high', 'normal');
CREATE TYPE public.lead_pipeline_stage AS ENUM (
    'sample_drafting',
    'sample_sent',
    'followed_up_1',
    'followed_up_2',
    'call_booked',
    'converted',
    'maybe_later',
    'dropped'
);

CREATE TABLE IF NOT EXISTS public.hot_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Lead Identity
    lead_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    linkedin_url TEXT,
    founder_title TEXT DEFAULT 'Founder & CEO',
    whatsapp_number TEXT,
    email TEXT,
    
    -- Assignment & Ownership
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    priority public.lead_priority NOT NULL DEFAULT 'normal',
    
    -- 72h SLA & Follow-up Tracking
    reply_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_72h TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '72 hours'),
    next_followup_date DATE,
    pipeline_stage public.lead_pipeline_stage NOT NULL DEFAULT 'sample_drafting',
    
    -- Sample Content Drafting (Stored directly inside the lead object)
    sample_post_1_hook TEXT,
    sample_post_1_body TEXT,
    sample_post_2_hook TEXT,
    sample_post_2_body TEXT,
    
    -- Lifecycle Outcomes
    converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    drop_reason TEXT,
    snooze_until_date DATE,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for rapid pipeline filtering
CREATE INDEX IF NOT EXISTS idx_hot_leads_org_stage ON public.hot_leads(organization_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_hot_leads_deadline ON public.hot_leads(deadline_72h);
CREATE INDEX IF NOT EXISTS idx_hot_leads_assigned ON public.hot_leads(assigned_to);

-- Enable RLS
ALTER TABLE public.hot_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to hot_leads"
    ON public.hot_leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

### 3.2 Rollback Script: `05_TECH/MIGRATIONS/013_hot_leads_pipeline_down.sql`
```sql
DROP TABLE IF EXISTS public.hot_leads CASCADE;
DROP TYPE IF EXISTS public.lead_pipeline_stage CASCADE;
DROP TYPE IF EXISTS public.lead_priority CASCADE;
```

---

## 4. UI/UX Architecture (Calm Attention Surface)

### 4.1 Route & Layout Refactoring
- **Rename Navigation**: In `sidebar-nav.tsx`, rename `/campaigns` from `"Outbound & GTM"` to **`"Hot Leads Pipeline"`** (or `"Hot Leads"`).
- **Master-Detail Split View**:
  - **Left Pane (Lead Horizon)**:
    - Stage Filter Tabs:
      `[All Active]` · `[72h Sample Queue]` · `[Waiting on Reply]` · `[Follow-Ups Due]` · `[Converted]` · `[Archived]`
    - Each card shows: Lead name, Company, Assignee (Sudeesh / Nikhil), Priority, and the **72h Live Countdown Ticker**.
  - **Right Pane (Lead Dossier & Sample Studio)**:
    - **Vitals Strip**: Founder name, company, LinkedIn URL, WhatsApp button.
    - **Sample Post Studio Tab**: Tabbed editor (`[Sample Post 1]` / `[Sample Post 2]`) with hook, body, and preview.
    - **1-Click WhatsApp Pitch Button**: Generates a clean, formatted WhatsApp pitch with the sample posts and copies it to clipboard.
    - **Pipeline Action Controls**: `[Advance to Sample Sent]`, `[Log Follow-Up]`, `[Convert to Client]`, `[Maybe Later (Snooze)]`, `[Drop]`.

---

## 5. Step-by-Step Execution Roadmap

- [ ] **Step 1: Database Migration**: Run `013_hot_leads_pipeline.sql` and verify row structure via Node inspection script.
- [ ] **Step 2: Domain Types**: Add `HotLead`, `LeadPipelineStage`, `LeadPriority` to `src/types/domain.ts`.
- [ ] **Step 3: Server Actions (`src/lib/actions/leads.ts`)**:
  - `createLeadAction`: Validates inputs with Zod, sets 72h deadline.
  - `updateLeadContentAction`: Saves draft sample posts with debouncing.
  - `advanceLeadStageAction`: Advances pipeline stages with audit timestamps.
  - `convertLeadToClientAction`: Creates client, creates engagement, migrates sample posts to `content_items`.
  - `snoozeLeadAction`: Sets `snooze_until_date` for 6–8 months.
- [ ] **Step 4: Command Center Integration**: Update `command-center.ts` query to auto-surface urgent 72h sample tasks and snoozed leads due today.
- [ ] **Step 5: UI Construction (`src/app/(workspace)/campaigns/`)**:
  - Replace static page with `HotLeadsClient` split view.
  - Build `LeadCard`, `LeadInspector`, `SamplePostStudio`, and `NewLeadModal`.
- [ ] **Step 6: Sidebar Navigation & Label Cleanups**: Update `sidebar-nav.tsx` to reflect `"Hot Leads"`.
- [ ] **Step 7: Verification & Build**: Run `node "./node_modules/typescript/bin/tsc" --noEmit` to ensure 0 errors.
