# Vertical Slice Build Plan: Atom & Echo OS

## Slice 1: Core Foundation & Command Center Cockpit (Complete)
- [x] Canonical 9-folder architectural blueprint, source-of-truth hierarchy, and domain model.
- [x] Supabase PostgreSQL database schema, migrations, and admin helper client.
- [x] Organization, Users, Clients, and Engagements data access layer and models.
- [x] Command Center morning cockpit (`/command-center`) with triage alert feed and KPI metrics.
- [x] Client 360 Workspace (`/clients/[id]`) with positioning context and retainer terms.
- [x] Standardized `PageHeader` and calm editorial theme tokens.

## Slice 2: Content Production Studio & Master Calendar (Complete)
- [x] Reconcile build tracking documentation and governance.
- [x] Add Master Calendar to sidebar navigation rail (`/calendar`).
- [x] Implement operational temporal projection query (combining scheduled posts, billing anchor days, and campaigns).
- [x] Master Temporal Calendar view (`/calendar`) with Month, Week, and Agenda projections and detail drawers.
- [x] Markdown post editor canvas (`/content/[id]`) with real-time character/word metrics and LinkedIn character counter.
- [x] Real-time Taboo Word Linter flagging forbidden buzzwords (`client_contexts.taboo_words`).
- [x] Live LinkedIn Mobile Simulator rendering accurate typography, hooks, and `...see more` fold line.
- [x] Slide-out Client Context Drawer for searching and 1-click inserting founder stories and verified proof points.
- [x] Content Pipeline Kanban Board (`/content`) with visual lifecycle columns and multi-client filtering.

## Slice 3: Zero-Login Client Review Mobile PWA (Complete)
- [x] Token generation engine with SHA-256 signatures and 7-day expiration.
- [x] WhatsApp magic link generator pre-formatting founder review nudges.
- [x] Zero-login mobile web view simulating native LinkedIn post cards on mobile viewport.
- [x] 1-tap "Approve Post" action with automatic scheduled publish date assignment.
- [x] "Request Edits" drawer recording inline comments into `content_feedback`.
- [x] Past approved and scheduled posts archive view.

## Slice 4: Credential Vault, Client Requests & Emergency Hold (Complete)
- [x] AES-256-GCM credential encryption/decryption vault.
- [x] Ephemeral password reveal with 30-second visible countdown timer.
- [x] Append-only `credential_audit_logs` tracking every disclosure and clipboard copy.
- [x] Client service request board (`/operations`) with triage categories and priority routing.
- [x] Emergency Hold cascading automation pausing all scheduled posts for the client.

## Slice 5: Tool Expenses, Invoicing Engine & Production Polish (Complete)
- [x] Tool subscription catalog and client pass-through expense allocation.
- [x] Automated invoice draft generator aggregating monthly retainers + unbilled tool seats 7 days before anchor day.
- [x] Dedicated Invoice Review & Print Workspace (`/billing/invoices/[id]`) with WhatsApp payment nudge.
- [x] Automated background cron endpoint (`/api/cron/billing`) for automated daily execution.
- [x] Full operational walkthrough, E2E verification script (`scripts/verify-slice-5.mjs`), and Turbopack 0-error build across 19 routes.
