# Information Architecture & Navigation Hierarchy: Atom & Echo OS

This document maps the complete information architecture, routing structure, layout archetypes, and navigation paradigms for both the **Internal Operator Workspace** and the **External Client Review PWA**.

---

## 1. High-Level System Partitioning

The Atom & Echo OS consists of two distinctly decoupled user surfaces:

```
Atom & Echo System Surface
├── 1. Internal Agency Workspace (Desktop-First Operator App)
│   ├── Secured via Supabase Session Auth
│   ├── Collapsible Primary Sidebar Navigation
│   ├── Top-Bar Context Header & Quick Actions
│   └── Multi-Drawer Slide-Over Architecture
│
└── 2. External Client Review Portal (Mobile-First Zero-Login PWA)
    ├── Secured via Cryptographic JWT Magic Link Tokens
    ├── Single-Purpose Focused Card Stream
    └── Zero Chrome, Zero Left Sidebar, Zero Login Prompts
```

---

## 2. Internal Operator Workspace Navigation Map

```mermaid
graph TD
    Root[/] --> CommandCenter[/command-center<br/>The Morning Cockpit]
    Root --> Clients[/clients<br/>Client 360 Hub]
    Root --> Content[/content<br/>Content Production Studio]
    Root --> Calendar[/calendar<br/>Master Temporal Calendar]
    Root --> Operations[/operations<br/>Requests & Triage Queue]
    Root --> Billing[/billing<br/>Tools & Retainer Invoices]
    Root --> Settings[/settings<br/>Vault, Team, Organization]

    Clients --> ClientDetail[/clients/:id<br/>Overview / Context / Vault / Retainers]
    Content --> ContentEditor[/content/:id<br/>Editor Drawer & LinkedIn Simulator]
    Billing --> InvoiceDetail[/billing/invoices/:id<br/>Invoice Review & Expense Breakdown]
```

### 2.1 Primary Routes & Layout Shell
* **`/command-center`**: The primary home screen. Displays urgent triage notifications, KPI stats, and daily focus tasks.
* **`/clients`**: Directory of all active and onboarding clients with health badges, active retainers, and primary operator tags.
  * **`/clients/[id]`**: Deep 360-degree client workspace with tabbed views:
    * `Tab 1: Overview & Content Pipeline` (Active posts, scheduled slots, recent drafts)
    * `Tab 2: Intelligence & Context Vault` (Tone rules, taboo words, proof bank, founder stories)
    * `Tab 3: Credential Vault` (Encrypted passwords, 2FA notes, copy audits)
    * `Tab 4: Tool Expenses & Retainers` (Active software seats, pass-through charges, contract terms)
    * `Tab 5: Requests & History` (Client tickets, emergency holds, meeting summaries)
* **`/content`**: Master pipeline view for personal branding posts across all clients. Toggleable between Kanban board (by state) and sortable table view.
* **`/calendar`**: Operational temporal projection view. Displays scheduled content, campaign launch milestones, and billing renewal dates.
* **`/operations`**: Client service requests and ticket queue with priority triage.
* **`/billing`**: Tool subscription tracker and consolidated retainer invoice generator.
* **`/settings`**: Team seats, user role assignments, audit logs, and agency profile.

---

## 3. External Client Review PWA Navigation Map

```mermaid
graph TD
    Link[WhatsApp Magic Link<br/>/review?token=...] --> PWA[/review<br/>Mobile Review Stream]
    PWA --> Approve[1-Tap Approve Action]
    PWA --> Revise[Inline Revision Drawer]
    PWA --> History[Archive View: Past Approved & Published Posts]
    PWA --> Help[Emergency Hold / Quick Help Modal]
```

### 3.1 PWA Architectural Principles
1. **Zero Global Sidebar**: Never show a traditional desktop sidebar on mobile. The client needs zero cognitive friction.
2. **Infinite Card Stack**: Posts awaiting review are presented as a clean vertical card stack or swipeable carousel simulating LinkedIn mobile feed rendering.
3. **Sticky Action Bar**: The bottom 80px of the screen features a persistent thumb-zone action bar with a prominent **Approve Post** button and a secondary **Request Edit** button.

---

## 4. Interaction Patterns & Component Modals

### 4.1 Slide-Out Drawers (Sheet Components)
* Used extensively in the Internal Workspace to prevent page context loss.
* Opening a post from the Kanban board slides open a right-side drawer (70% width) containing the editor, taboo word linter, and client story bank. Closing the drawer returns the user immediately to the board without a page refresh.

### 4.2 Ephemeral Security Modals
* Clicking "Reveal" on a password inside the Credential Vault triggers a scoped credential modal with a visible 30-second progress bar countdown before auto-masking.

### 4.3 Quick Action Command Palette (`Cmd + K`)
* Universal keyboard shortcut to quickly jump to any client, create a draft post, add a tool expense, or search the founder story vault.
