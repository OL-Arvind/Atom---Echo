# Discovery Audit: Atom & Echo Live Notion Workspace

This document inventories the actual databases, pages, schemas, and operational practices discovered in Atom & Echo's live Notion workspace.

---

## 1. Top-Level Workspace Organization

Atom & Echo's Notion workspace is not a single database; it is a federation of disconnected operating surfaces:

```text
                         ATOM & ECHO NOTION WORKSPACE
                                      │
        ┌──────────────────┬──────────┴──────────┬──────────────────┐
        ▼                  ▼                     ▼                  ▼
   [CLIENTS - PB]   [CLIENTS - OUTREACH]     [CONTENT]          [DAILY OPS]
   • Client Hubs    • Campaign DBs           • Internal Cal     • Daily Tasks
   • Onboarding     • Lead Lists (Sheets)    • Client Cal       • Updates Tracker
   • Passwords      • Tool Subscriptions     • Content Bank     • Tool Billing
   • Content Banks  • Reply Trackers         • Post Formats     • Invoices (Sheets)
```

---

## 2. Detailed Database & Schema Audit

### 2.1 Content Calendars (Scattered)
The workspace maintains **two separate content calendars**:
* **Internal Content Calendar**:
  * Fields: Title, Status, Format, Content Pillar, Profile / Client, Planned Publishing Date, Actual Publishing Date, Published Link, Impressions, Likes, Comments, Engagement Rate.
  * Status options: *Idea, In Development, Internal Review, Ready to Publish, Scheduled, Published, On Hold*.
  * Historical records: ~98 published records already exist in historical tracking.
* **Client-Facing Content Calendar**:
  * Maintained on client sub-pages to show schedules.
  * Friction: Requires double entry or complicated linked-database filters that clients find difficult to navigate on mobile.

### 2.2 Client Workspaces & Onboarding
* **Clients - LinkedIn Personal Branding**:
  * Contains dedicated client sub-pages for clients such as Chetan (Debtworks), Florian, Bilal, Zainab, etc.
  * Each client page embeds: Strategy Guidelines, Target ICP notes, Onboarding Discovery questionnaire, Content Bank, and a **`Passwords`** page.
* **Onboarding Discovery Data (The "Florian Schema")**:
  * Captures deep founder context: Business/Product Overview, Audience, Positioning, Voice/Tone, Personal Stories, Frustrations, Content Boundaries, Topics to Avoid, Preferred Post Styles, Growth Goals.
  * Friction: Lives as static text in sub-pages; never automatically references content creation or reviews.

### 2.3 Tools Billing & Expense Tracking
* **Tools Billing Database**:
  * Fields: Client, Tool Name, Purchase Date, Next Billing Date, Monthly Cost (₹), Payment Status (*Paid, Pending, Failed*), Card/Payment Method.
  * Real records: Mapped tools include HeyReach, Clay (~₹18k–₹20k/mo for Debtworks), Fathom, Smartlead.
  * Friction: Expenses are manually calculated and manually copied into Google Sheets invoice templates. If an operator forgets, tool costs leak without being recovered.

### 2.4 Client Updates Tracker (Requests & Ad-hoc Work)
* **Client Updates Tracker**:
  * Fields: Request Description, Client, Category (*Feature Request, Bug, Content Update, Design Change, Support*), Priority (*High, Medium, Low*), Assigned To, Due Date, Estimated Hours, Status (*Open, In Progress, In Review, Done*).
  * Evidence: Proves clients continuously generate ad-hoc requests outside planned content sprints.

### 2.5 Daily Tasks
* **Internal Task System**:
  * Fields: Task Name, Due Date, Assigned To, Priority, Status (*To Do, In Progress, Done*), Repeat/Recurring tag.
  * Friction: Tasks are disconnected from content cards or client requests; operators spend 30–45 minutes daily creating tasks manually.

### 2.6 External Dependencies
* The workflow crosses boundaries between Notion, Google Sheets (invoicing, lead lists, financial tracking), Fathom (call recording), WhatsApp (client communication and chase-ups), and credit card banking portals.
