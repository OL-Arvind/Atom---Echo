# Acceptance Criteria: Phase 1 Operating Core

This document establishes the objective, testable acceptance criteria (`AC-1` through `AC-7`) required for formal User Acceptance Testing (UAT) and final delivery sign-off for Phase 1 of the Atom & Echo Operating System.

---

## 1. Traceability Matrix

| ID | Operational Area | Objective Acceptance Criteria Statement | Verification Method |
| :--- | :--- | :--- | :--- |
| **AC-1** | Command Center Cockpit | Sudeesh can view all active clients, overdue client reviews (>48h), pending draft invoices, and tool renewal alerts on a single screen in < 3 seconds. | E2E Browser Test / Visual Inspection |
| **AC-2** | Zero-Login Mobile PWA | An external client opening a tokenized review link on mobile can view realistic LinkedIn previews, tap 'Approve', and have the post status transition to `Approved` with scheduled date locked in < 30 seconds without authentication. | Mobile Device Simulation / Token Test |
| **AC-3** | Unified Content Pipeline | Content moves through formal states (`Draft` &rarr; `Internal Review` &rarr; `Client Review` &rarr; `Approved` &rarr; `Scheduled`). The Master Calendar automatically projects scheduled posts with zero duplicate data entry. | Workflow Integration Test |
| **AC-4** | Encrypted Credential Vault | Client passwords are stored encrypted (AES-256-GCM), masked by default (`••••••••`), revealed only on demand with an ephemeral 30-second timer, and produce immutable audit logs on copy/reveal. | Security Audit / Database Inspection |
| **AC-5** | Zero-Leak Retainer Billing | 7 days prior to a client's billing anchor day, the system automatically drafts an invoice containing the base monthly retainer plus all unbilled pass-through tool expenses as line items. | Cron Simulation / Billing Test |
| **AC-6** | Emergency Hold Cascade | Submitting a client request with category `emergency_hold` automatically transitions all `scheduled` posts for that client to `paused` and triggers high-priority alerts in the Command Center. | State Machine Mutation Test |
| **AC-7** | Data Isolation & Security | PostgreSQL Row Level Security (RLS) guarantees that an operator or client token can never query or view content, passwords, or invoices belonging to another client or organization. | Multi-Tenant Penetration Test |

---

## 2. Detailed Verification Scenarios

### AC-1: Command Center Triage Verification
1. **Given**: 2 posts in `client_review` updated > 48 hours ago, 1 unallocated tool subscription renewing in 3 days, and 1 client request with `urgent` priority.
2. **When**: Sudeesh logs into `/command-center`.
3. **Then**:
   - The KPI cards display accurate totals.
   - The "Urgent Triage Queue" highlights all 4 items with distinct warning badges.
   - Clicking any item navigates directly to the relevant drawer or generates a pre-filled WhatsApp follow-up link.

### AC-2: Zero-Login Client Review PWA Verification
1. **Given**: A batch of 3 posts in `client_review` for client "FinTech Corp".
2. **When**: A reviewer opens `/review?token=<valid_token>` on an iOS Safari or Android Chrome browser.
3. **Then**:
   - The page loads in < 1.5 seconds without any username or password prompt.
   - Posts render as pixel-perfect LinkedIn cards (displaying hook, "...see more" fold, avatar, and media).
   - Tapping "Approve Post" on Post 1 displays a success animation, shifts `content_items.status` to `approved` in PostgreSQL, and locks in the next scheduled publishing date.
   - Tapping "Request Edits" on Post 2 opens the inline feedback modal, records comments in `content_feedback`, and transitions status back to `draft`.

### AC-3: Unified Content Pipeline & Calendar Verification
1. **Given**: A ghostwriter drafts a post in `/content`.
2. **When**: The writer types taboo words (e.g., *"synergy"*, *"delve"*), the editor flags them in red.
3. **When**: The writer submits for `internal_review`, Sudeesh approves, and client approves via PWA.
4. **Then**:
   - The post automatically receives a `scheduled_publish_date`.
   - The post appears immediately on `/calendar` under the assigned date.
   - Updating the scheduled date in the calendar drawer updates the underlying content row.

### AC-4: Credential Vault Security Verification
1. **Given**: A client profile with LinkedIn credentials stored.
2. **When**: An operator opens the "Credential Vault" tab.
3. **Then**:
   - Password is displayed as `••••••••••••••••`.
   - Clicking "Reveal" triggers a 30-second visible countdown timer and unmasks the password.
   - Clicking "Copy" copies the plaintext to the clipboard.
   - An inspection of `credential_audit_logs` shows a new record with `user_id`, `action = 'copy_password'`, IP address, and timestamp.
   - Querying the database as a restricted writer role returns zero rows from `credentials`.

### AC-5: Tool Expense & Retainer Invoicing Verification
1. **Given**: Client "SaaS Scale" on a Rs. 1,50,000/mo retainer with anchor day = 1st of month, and 2 unbilled tool expenses (HeyReach: Rs. 6,600, Proxies: Rs. 2,500).
2. **When**: The billing cron executes 7 days before the anchor day (24th of month).
3. **Then**:
   - A draft invoice is generated with subtotal = Rs. 1,59,100.
   - Line Item 1: Base Retainer (Rs. 1,50,000).
   - Line Item 2: HeyReach Seat Reimbursement (Rs. 6,600).
   - Line Item 3: Dedicated Proxy Pool (Rs. 2,500).
   - The 2 tool expenses update status to `drafted_in_invoice`.
   - A notification appears in Sudeesh's Command Center triage feed.

### AC-6: Emergency Hold Automation Verification
1. **Given**: Client "FinTech Corp" has 3 posts in status `scheduled` for this week.
2. **When**: A request with category `emergency_hold` is submitted.
3. **Then**:
   - All 3 posts immediately update status to `paused`.
   - The posts disappear from the upcoming publishing calendar or display with a red paused stripe.
   - An alert banner appears across the client workspace: *"Publishing paused due to active emergency hold."*
