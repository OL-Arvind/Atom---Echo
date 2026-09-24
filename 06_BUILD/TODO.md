# Implementation Checklist & Execution Roadmap: Atom & Echo OS

This document tracks the step-by-step engineering tasks for building the Phase 1 Operating Core, organized strictly by the 5 sequential Vertical Slices.

---

## Slice 1: Core Foundation & Command Center Cockpit (Complete)

### 1.1 Project Scaffolding & Database Setup
- [x] Initialize Next.js 16 App Router project with TypeScript and Tailwind CSS v4.
- [x] Configure Supabase project and execute `05_TECH/DATABASE_SCHEMA.sql`.
- [x] Implement Supabase client/server helper utilities (`src/lib/supabase/`).
- [x] Set up environment variable validation via Zod (`src/lib/env.ts`).
- [x] Establish BaseWorks dark mode design tokens and base typography (Plus Jakarta Sans / Inter).

### 1.2 Tenancy, Users, & Client Management
- [x] Build internal staff authentication flow via Supabase Auth & session mocking (`/login`).
- [x] Implement Organization & User profile queries with Role checks (`admin`, `lead_operator`, `writer`).
- [x] Create Client Directory screen (`/clients`) with status filtering (`onboarding`, `active`, `paused`).
- [x] Build Client Detail 360 view (`/clients/[id]`) with header, retainer terms, and tab navigation.
- [x] Implement Client Context vault editor (Positioning, ICP, Voice guidelines, Taboo words).

### 1.3 Command Center Morning Cockpit (`/command-center`)
- [x] Build KPI stat cards (Active Clients, Posts in Review, Scheduled Posts, Unbilled Tools).
- [x] Implement Urgent Triage Queue querying:
  - Posts in `client_review` > 48 hours.
  - Posts in `internal_review` > 24 hours.
  - Invoices overdue or approaching anchor day.
  - Orphan tool subscriptions renewing in < 5 days.
- [x] Build "Today's Operational Actions" checklist with optimistic UI updates.
- [x] Build Quick Review Drawer allowing Sudeesh 1-click internal sign-off.

---

## Slice 2: Content Production Studio & Master Calendar (Complete)

### 2.1 Content State Machine & Pipeline
- [x] Implement TypeScript state machine guardrails for `content_items` transitions.
- [x] Build Content Pipeline Kanban board (`/content`) grouped by state:
  - `Draft` &rarr; `Internal Review` &rarr; `Client Review` &rarr; `Approved` &rarr; `Scheduled` &rarr; `Published`.
- [x] Add multi-client filter dropdown and assigned writer filter chips.

### 2.2 Rich Authoring Environment & Context Drawer
- [x] Build Markdown post editor canvas (`/content/[id]`) with live word/character counters.
- [x] Implement real-time Taboo Word Linter flagging forbidden buzzwords (`client_contexts.taboo_words`).
- [x] Build Live LinkedIn Mobile Simulator rendering accurate typography, hooks, and "...see more" folds.
- [x] Create slide-out Context Drawer allowing writers to search client stories and inject proof points in 1 click.

### 2.3 Master Temporal Operational Calendar (`/calendar`)
- [x] Implement operational projection query combining scheduled content, campaign milestones, and billing dates.
- [x] Build Month, Week, and Agenda calendar views with color-coded operational chips.
- [x] Build slide-over card details drawer on calendar card click.

---

## Slice 3: Zero-Login Client Review Mobile PWA (Complete)

### 3.1 Token Generation & Verification Engine
- [x] Implement cryptographically secure token generator using SHA-256 and 7-day expiration.
- [x] Create Server Action `sendForClientReview` that generates token and formats WhatsApp magic link.
- [x] Build token authentication middleware scoping queries strictly to `review_tokens.client_id`.

### 3.2 Mobile-First PWA Review Interface (`/review`)
- [x] Build zero-login mobile web view simulating native LinkedIn mobile post cards.
- [x] Implement prominent 1-tap **"Approve Post"** button with haptic feedback animation.
- [x] Build Server Action `approvePostByClient`:
  - Sets `status = 'approved'`.
  - Calculates and locks next available publishing date.
  - Sets `status = 'scheduled'`.
  - Emits `content.client_approved` event / audit log.
- [x] Build **"Request Edits"** drawer with quick tone pills (*"Too casual"*, *"Change hook"*) and comment box.
- [x] Record inline comments into `content_feedback` and shift post back to `draft`.
- [x] Build archive tab showing previously approved and scheduled posts.

---

## Slice 4: Credential Vault, Client Requests, & Emergency Hold (Complete)

### 4.1 Encrypted Credential Vault
- [x] Implement AES-256-GCM encryption/decryption helper using `VAULT_MASTER_KEY`.
- [x] Build Credential Vault tab on Client 360 view (`/clients/[id]#vault`).
- [x] Implement masked display (`••••••••••••••••`) by default.
- [x] Build ephemeral "Reveal Password" action with 30-second visual countdown timer.
- [x] Build 1-click "Copy Password" action writing directly to system clipboard.
- [x] Enforce append-only write to `credential_audit_logs` on every reveal/copy event.
- [x] Apply RLS policy restricting password access to `admin` and `lead_operator` roles only.

### 4.2 Client Service Requests & Emergency Hold System
- [x] Build Client Requests board (`/operations`) with category, priority, and assignment tags.
- [x] Implement Emergency Hold Automation:
  - When ticket category = `emergency_hold`, execute SQL updating all `scheduled` posts for that client to `paused`.
  - Inject critical alert banner across the Command Center and client workspace.
- [x] Build resolution flow to resume or reschedule paused posts once emergency clears.

---

## 5. Slice 5: Tool Expenses, Retainer Invoicing, & Production Polish (Complete)

### 5.1 Tool Catalog & Pass-Through Expense Tracker
- [x] Build Tool Subscriptions catalog (`/billing`) tracking license costs, renewal dates, and pass-through defaults.
- [x] Build Tool Expense allocation modal attaching costs to specific client engagements with catalog quick-selection.
- [x] Implement Command Center triage alerting for tools renewing within 5 days.

### 5.2 Retainer Invoicing Engine
- [x] Implement billing engine anchor cycle (`runBillingAnchorCycleAction`) running 7 days prior to client `billing_anchor_day`.
- [x] Auto-generate draft `invoices` combining base monthly retainer and unbilled tool expenses.
- [x] Update tool expense status to `drafted_in_invoice`.
- [x] Build Invoice Review screen (`/billing/invoices/[id]`) allowing Sudeesh to verify line items, transition status (`Approved` / `Sent` / `Paid`), send WhatsApp notices, and print/export PDF.
- [x] Automated background cron endpoint (`/api/cron/billing`).

### 5.3 Data Migration, Testing, & Final Delivery
- [x] Verify database schema and seed data integrity across all 14 core tables.
- [x] Run full E2E verification scripts (`scripts/verify-slice-4.mjs` and `scripts/verify-slice-5.mjs`).
- [x] Verify production Next.js 16 Turbopack build (0 errors across 19 routes).
- [x] Finalize architectural documentation and governance handoff.
