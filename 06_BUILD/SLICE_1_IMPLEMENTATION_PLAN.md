# Slice 1 Detailed Implementation Plan: Command Center Redesign & ADHD Daily Action Layer

**Target System**: Custom Operating System for Atom & Echo  
**Product Architecture**: BaseEngine Productized Operating System (by BaseWorks)  
**Stakeholders**: Sudeesh D S (Founder & Admin, Atom & Echo), Nikhil (Lead Operator), Aravind (BaseWorks)  
**Status**: APPROVED IN PRINCIPLE — READY FOR IMPLEMENTATION  
**Primary Reference Files**:
- User Demo & Follow-up Notes: [`To-Do List`](file:///d:/BaseWorks/Atom%20&%20Echo/To-Do%20List)
- Operating Rules: [`AGENTS.md`](file:///d:/BaseWorks/Atom%20&%20Echo/AGENTS.md)
- Enhancements Overview: [`06_BUILD/ENHANCEMENT_PLAN_V1.md`](file:///d:/BaseWorks/Atom%20&%20Echo/06_BUILD/ENHANCEMENT_PLAN_V1.md)
- Current Queue Builder: [`src/lib/data/queries/command-center-builder.ts`](file:///d:/BaseWorks/Atom%20&%20Echo/src/lib/data/queries/command-center-builder.ts)

---

## 1. Context & Identified Problem Statement

### 1.1 The Real-Life Workflow Friction
During the September 24 system demo and follow-up analysis, the current Command Center (`/command-center`) revealed significant cognitive friction for Sudeesh:
1. **The "Everything in One Flat Queue" Problem**:
   - The left pane (`Editorial Queue`) currently merges 7 heterogeneous alert types into one scrolling column: posts waiting for client review, internal QA posts, unbilled software expenses, tool renewals, draft invoices, and client requests.
   - Sudeesh cannot tell at a glance: *"What do I have to do right now, and what am I just waiting for others to do?"*
2. **The "Waiting on Client" Anxiety Trap**:
   - When a post is sent to a founder for review, that founder may take 24–48 hours to respond.
   - Having this post sit in the active queue screaming "Action Required" creates false urgency and anxiety for an operator who has already done their part.
3. **The ADHD Task Initiation Barrier**:
   - Sudeesh has ADHD and relies on a physical notepad to list tasks and strike them out.
   - Seeing a vague pile of work triggers procrastination. But seeing calibrated time estimates (`⚡ 1 min`, `⚡ 5 min`, `⚡ 15 min`) dramatically reduces the initiation threshold because the brain realizes how short the task actually is.
   - Striking out a task provides the neurological dopamine hit that maintains momentum throughout the day.
4. **Buried Upcoming Releases**:
   - Today's and tomorrow's scheduled releases are currently crammed at the very bottom of the left column below the scrolling queue, instead of anchoring the day's publishing schedule.

---

## 2. Core Architecture: The Two-Zone Triage Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMMAND CENTER (DAILY COCKPIT)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ ZONE 1: ACTION REQUIRED TODAY (Ball in Our Court) ─────────────────────┐ │
│ │                                                                         │ │
│ │ 1. Today's Scheduled Releases (Anchored at top of horizon)             │ │
│ │    • BaseWorks (Aravind): "18-Day Delivery Milestone" · 2:30 PM IST     │ │
│ │    • Reliance (Mukesh): "5 Supply Chain Trends" · 6:00 PM IST           │ │
│ │                                                                         │ │
│ │ 2. Daily ADHD Action Checklist [ 4 of 6 cleared · 22m done ]            │ │
│ │    [✓] ⚡ 1 min  Nudge Florian on WhatsApp (Review pending 48h)  [Done] │ │
│ │    [ ] ⚡ 2 min  Approve Reliance Sept Invoice (₹75,000)          [Act]  │ │
│ │    [ ] ⚡ 15 min Revise Hook on Chetan's post (Requested 2h ago) [Studio]│ │
│ │    [ ] ⚡ 5 min  Call Nikhil about HeyReach campaign             [Nikhil]│ │
│ │    + [Quick task title...] [1m] [5m] [15m] [Assignee ▾] [Add]           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ ZONE 2: IN-FLIGHT & WAITING ON CLIENTS (Ball in Their Court - Quiet) ──┐ │
│ │ • DebtWorks (Chetan): "Credit Restructuring" · Sent 6h ago (Reviewing)  │ │
│ │ • BaseWorks (Aravind): "Autonomous Systems" · Sent 18h ago (Reviewing)  │ │
│ │ * Note: If pending > 48 hours, system auto-generates a 1-min nudge task │ │
│ │   in Zone 1 above.                                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Specification

### 3.1 Migration File: `05_TECH/MIGRATIONS/012_operational_tasks.sql`
Following the **Supabase Live DB Verification Hygiene** invariant in `AGENTS.md`:

```sql
-- Migration: 012_operational_tasks.sql
-- Description: Create operational_tasks table for ADHD daily action queue and team assignment

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

-- Enable RLS
ALTER TABLE public.operational_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to operational_tasks"
    ON public.operational_tasks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

### 3.2 Rollback Script: `05_TECH/MIGRATIONS/012_operational_tasks_down.sql`
```sql
DROP TABLE IF EXISTS public.operational_tasks CASCADE;
```

---

## 4. Domain Types & Contract Additions

### 4.1 `src/types/domain.ts` Additions:
```typescript
export type TaskEstimatedMinutes = 1 | 2 | 3 | 5 | 10 | 15 | 30 | 45 | 60;

export interface OperationalTask {
  id: string;
  organization_id: string;
  title: string;
  estimated_minutes: TaskEstimatedMinutes;
  due_date: string; // YYYY-MM-DD
  assigned_to?: string | null;
  assigned_user_name?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  source_type: "manual" | "system_generated";
  source_entity_type?: "content_item" | "content_feedback" | "invoice" | "tool_subscription" | "client_request" | null;
  source_entity_id?: string | null;
  created_at: string;
}
```

---

## 5. Server Actions & Backend Services

### 5.1 `src/lib/actions/tasks.ts`
Implement dedicated server actions following Zod validation:
1. `createOperationalTaskAction(formData: { title, estimated_minutes, due_date, assigned_to?, client_id? })`
2. `toggleOperationalTaskAction(taskId: string, is_completed: boolean)`:
   - Sets `is_completed`, updates `completed_at` to `now()` or `null`.
   - Revalidates path `/command-center`.
3. `deleteOperationalTaskAction(taskId: string)`:
   - Deletes manual tasks (or hides system tasks).

### 5.2 Dynamic Query Logic: `src/lib/data/queries/command-center.ts`
Enhance `getCommandCenterDataFromDb()`:
1. Fetch active tasks for today:
   ```typescript
   supabase.from("operational_tasks")
     .select("*, users:assigned_to(full_name), clients:client_id(name)")
     .eq("due_date", todayStr)
     .order("is_completed", { ascending: true })
     .order("created_at", { ascending: false });
   ```
2. Auto-escalate overdue client review posts (> 48h):
   - For posts in `client_review` created or sent > 48 hours ago without feedback, generate an ephemeral or persisted system task:
     `title: "Follow up with {founder_name} on review ({post_title})"`, `estimated_minutes: 1`.
3. Split the alerts into:
   - `actionAlerts`: Client revisions requested, internal Voice QA drafts, invoices needing sign-off, urgent client requests.
   - `waitingAlerts`: Posts in client review sent within 48h, tool renewal reminders.
   - `upcomingReleases`: Scheduled posts due today/tomorrow.

---

## 6. Frontend UI Components (BaseWorks Calm Attention Surface)

### 6.1 Component Hierarchy
```
src/app/(workspace)/command-center/
├── command-center-client.tsx (Main split-view orchestrator)
└── components/
    ├── daily-action-checklist.tsx (ADHD strike-through list with time chips)
    ├── quick-task-input.tsx (Fast manual task creator)
    ├── upcoming-releases-masthead.tsx (Anchor bar for today's scheduled releases)
    ├── waiting-on-clients-list.tsx (Quiet in-flight drawer with relative timestamps)
    └── alert-inspector-pane.tsx (Persistent detail inspector for selected item)
```

### 6.2 ADHD Interaction Standards (Emil Kowalski Craft)
- **Time Badges**: Subtle rounded tag with lightning bolt (`⚡ 1 min`, `⚡ 5 min`) using monospace tabular numerals.
- **Strike-Through Dopamine Animation**:
  - `transition: all 180ms ease-out`.
  - When checked, line-through sweeps across text, opacity dims to 0.5, and status counter increments immediately via optimistic state.
  - Stays visible in a quiet "Completed (X)" fold at the bottom of the list for the rest of the day.
- **Relative Timestamps**:
  - Show human relative age: `"Requested 2 hours ago"`, `"Sent 6 hours ago"`.

---

## 7. Step-by-Step Execution Checklist

- [ ] **Step 1: Database Migration**: Run `012_operational_tasks.sql` on live Supabase and verify with `node scripts/check-db.mjs`.
- [ ] **Step 2: Server Actions & Zod Schema**: Create `src/lib/actions/tasks.ts` with strict input validation.
- [ ] **Step 3: Query & Aggregation Layer**: Update `src/lib/data/queries/command-center.ts` and `command-center-builder.ts` to output two distinct collections: `actionRequired` and `waitingOnClients`.
- [ ] **Step 4: UI Presentation Components**: Build `DailyActionChecklist`, `QuickTaskInput`, and integrate with `CommandCenterClient`.
- [ ] **Step 5: TypeScript Compilation Verification**: Run `node "./node_modules/typescript/bin/tsc" --noEmit` to ensure 0 errors.
- [ ] **Step 6: Visual & Functional Verification**: Test manual task creation, 1-tap completion strike-through, and two-zone split responsiveness.
