# Implementation Checklist & Execution Roadmap: Atom & Echo OS

This document tracks the step-by-step engineering tasks for building the Phase 1 Operating Core, organized strictly by the 5 sequential Vertical Slices.

---

## Slice 1: Core Foundation & Command Center Cockpit

### 1.1 Project Scaffolding & Database Setup
- [ ] Initialize Next.js 15 App Router project with TypeScript and Tailwind CSS v4.
- [ ] Configure Supabase project and execute `05_TECH/DATABASE_SCHEMA.sql`.
- [ ] Implement Supabase client/server helper utilities (`src/lib/supabase/`).
- [ ] Set up environment variable validation via Zod (`src/lib/env.ts`).
- [ ] Establish BaseWorks dark mode design tokens and base typography (Outfit / Inter).

### 1.2 Tenancy, Users, & Client Management
- [ ] Build internal staff authentication flow via Supabase Auth (`/login`).
- [ ] Implement Organization & User profile queries with Role checks (`admin`, `lead_operator`, `writer`).
- [ ] Create Client Directory screen (`/clients`) with status filtering (`onboarding`, `active`, `paused`).
- [ ] Build Client Detail 360 view (`/clients/[id]`) with header, retainer terms, and tab navigation.
- [ ] Implement Client Context vault editor (Positioning, ICP, Voice guidelines, Taboo words).

### 1.3 Command Center Morning Cockpit (`/command-center`)
- [ ] Build KPI stat cards (Active Clients, Posts in Review, Scheduled Posts, Unbilled Tools).
- [ ] Implement Urgent Triage Queue querying:
  - Posts in `client_review` > 48 hours.
  - Posts in `internal_review` > 24 hours.
  - Invoices overdue or approaching anchor day.
  - Orphan tool subscriptions renewing in < 5 days.
- [ ] Build "Today's Operational Actions" checklist with optimistic UI updates.
- [ ] Build Quick Review Drawer allowing Sudeesh 1-click internal sign-off.

---

## Slice 2: Content Production Studio & Master Calendar

### 2.1 Content State Machine & Pipeline
- [ ] Implement TypeScript state machine guardrails for `content_items` transitions.
- [ ] Build Content Pipeline Kanban board (`/content`) grouped by state:
  - `Draft` &rarr; `Internal Review` &rarr; `Client Review` &rarr; `Approved` &rarr; `Scheduled` &rarr; `Published`.
- [ ] Add multi-client filter dropdown and assigned writer filter chips.

### 2.2 Rich Authoring Environment & Context Drawer
- [ ] Build Markdown post editor canvas (`/content/[id]`) with live word/character counters.
- [ ] Implement real-time Taboo Word Linter flagging forbidden buzzwords (`client_contexts.taboo_words`).
- [ ] Build Live LinkedIn Mobile Simulator rendering accurate typography, hooks, and "...see more" folds.
- [ ] Create slide-out Context Drawer allowing writers to search client stories and inject proof points in 1 click.

### 2.3 Master Temporal Operational Calendar (`/calendar`)
- [ ] Implement operational projection query combining scheduled content, campaign milestones, and billing dates.
- [ ] Build Month, Week, and Agenda calendar views with color-coded operational chips.
- [ ] Build slide-over card details drawer on calendar card click.

---

## Slice 3: Zero-Login Client Review Mobile PWA

### 3.1 Token Generation & Verification Engine
- [ ] Implement cryptographically secure token generator using SHA-256 and 7-day expiration.
- [ ] Create Server Action `sendForClientReview` that generates token and formats WhatsApp magic link.
- [ ] Build token authentication middleware scoping queries strictly to `review_tokens.client_id`.

### 3.2 Mobile-First PWA Review Interface (`/review`)
- [ ] Build zero-login mobile web view simulating native LinkedIn mobile post cards.
- [ ] Implement prominent 1-tap **"Approve Post"** button with haptic feedback animation.
- [ ] Build Server Action `approvePostByClient`:
  - Sets `status = 'approved'`.
  - Calculates and locks next available publishing date.
  - Sets `status = 'scheduled'`.
  - Emits `content.client_approved` event to Inngest.
- [ ] Build **"Request Edits"** drawer with quick tone pills (*"Too casual"*, *"Change hook"*) and comment box.
- [ ] Record inline comments into `content_feedback` and shift post back to `draft`.
- [ ] Build archive tab showing previously approved and scheduled posts.

---

## Slice 4: Credential Vault, Client Requests, & Emergency Hold

### 4.1 Encrypted Credential Vault
- [ ] Implement AES-256-GCM encryption/decryption helper using `VAULT_MASTER_KEY`.
- [ ] Build Credential Vault tab on Client 360 view (`/clients/[id]#vault`).
- [ ] Implement masked display (`••••••••••••••••`) by default.
- [ ] Build ephemeral "Reveal Password" action with 30-second visual countdown timer.
- [ ] Build 1-click "Copy Password" action writing directly to system clipboard.
- [ ] Enforce append-only write to `credential_audit_logs` on every reveal/copy event.
- [ ] Apply RLS policy restricting password access to `admin` and `lead_operator` roles only.

### 4.2 Client Service Requests & Emergency Hold System
- [ ] Build Client Requests board (`/operations`) with category, priority, and assignment tags.
- [ ] Implement Emergency Hold Automation:
  - When ticket category = `emergency_hold`, execute SQL updating all `scheduled` posts for that client to `paused`.
  - Inject critical alert banner across the Command Center and client workspace.
- [ ] Build resolution flow to resume or reschedule paused posts once emergency clears.

---

## 5. Slice 5: Tool Expenses, Retainer Invoicing, & Production Polish

### 5.1 Tool Catalog & Pass-Through Expense Tracker
- [ ] Build Tool Subscriptions catalog (`/billing/tools`) tracking license costs and renewal dates.
- [ ] Build Tool Expense allocation modal attaching costs to specific client engagements.
- [ ] Implement Inngest cron flagging unallocated tools renewing within 5 days.

### 5.2 Retainer Invoicing Engine
- [ ] Implement billing engine cron running 7 days prior to client `billing_anchor_day`.
- [ ] Auto-generate draft `invoices` combining base monthly retainer and unbilled tool expenses.
- [ ] Update tool expense status to `drafted_in_invoice`.
- [ ] Build Invoice Review screen (`/billing/invoices/[id]`) allowing Sudeesh to verify line items and mark `Sent` / `Paid`.

### 5.3 Data Migration, Testing, & Final Delivery
- [ ] Seed database with live clients, tone rules, and credentials from active Notion workspace.
- [ ] Run full E2E verification across AC-1 through AC-7.
- [ ] Conduct live UAT review with Sudeesh.
- [ ] Deploy production build to Vercel and transfer ownership.
