# Architecture Decision Records (ADRs)

This document records the foundational architectural and design decisions for Atom & Echo OS. **AI agents must treat these decisions as locked; do not reopen or refactor settled decisions without explicit human authorization.**

---

## ADR-001: The Calendar is an Operational Projection, Not a Manual Database
* **Status**: ACCEPTED  
* **Context**: In Notion, operators create entries in separate calendar databases, requiring continuous manual upkeep.  
* **Decision**: The OS will NOT have a dedicated "calendar database" where users manually type events. Instead, the Calendar is a **pure temporal projection** of operational business state:
  * Content planned/scheduled dates &rarr; Content cards
  * Campaign launch dates &rarr; Campaign milestones
  * Scheduled Fathom meetings &rarr; Meeting events
  * Tool renewal dates &rarr; Renewal reminders
  * Invoice due dates &rarr; Billing deadlines
* **Consequence**: Zero duplicate date maintenance. When an entity date changes, the calendar view automatically reflects the change.

---

## ADR-002: Client Credentials Live in an Encrypted Security Vault
* **Status**: ACCEPTED  
* **Context**: Agency operators need access to client logins (LinkedIn, HeyReach, Clay, website CMS). In Notion, these sit in plaintext or external WhatsApp messages. Earlier brainstorming considered dropping passwords from the OS. However, meeting transcripts proved Sudeesh needs centralized client credential access.  
* **Decision**: Build a first-class **Credential Vault** directly inside the OS attached to client profiles, engineered with strict security boundaries:
  * Secrets encrypted at rest on the server layer.
  * Masked by default in the UI (`••••••••`).
  * Explicit, audited reveal and copy actions.
  * Role-based access control (Admin vs. Team Member).
* **Consequence**: Operators don't leave the OS to fetch passwords, while eliminating plaintext security risks.

---

## ADR-003: Client Review Portal is a Standalone, Zero-Login Mobile PWA
* **Status**: ACCEPTED  
* **Context**: Busy founder clients refuse to log into Notion on desktop, causing 1–2 weeks of manual WhatsApp chasing.  
* **Decision**: External clients must NEVER interact with internal operational complexity. The client review experience is a lightweight, mobile-first Progressive Web App (PWA) accessed via a **secure, tokenized URL** sent directly through WhatsApp:
  * Zero passwords, user registrations, or Notion workspaces.
  * Token scopes access strictly to that client's pending review items.
  * 1-click Approve or inline revision comments.
* **Consequence**: Review turnaround drops from days to seconds.

---

## ADR-004: Outreach & Cold Email Stay in External Tools for V1
* **Status**: ACCEPTED  
* **Context**: Atom & Echo currently uses Clay, HeyReach, and Google Sheets for cold email and outbound campaigns.  
* **Decision**: Phase 1 will NOT attempt to rebuild Clay, Smartlead, or a complex sales CRM inside the OS. Sudeesh is downsizing team size and doubling down on founder personal branding. Phase 1 tracks **high-level Campaign entities** (Status, ICP, Channel, Launch Date, external Sheet links), but leaves prospecting mechanics to external tools.
* **Consequence**: Prevents scope bloat in Phase 1 and guarantees rapid delivery.

---

## ADR-005: Core Technology Stack Selection
* **Status**: ACCEPTED  
* **Context**: Small/solo engineering team at BaseWorks delivering high-velocity, reliable custom operating systems.  
* **Decision**: Standardize on a modern, cohesive modular monolith:
  * **Frontend & Application**: Next.js (App Router) + TypeScript.
  * **Styling & Components**: Tailwind CSS + custom BaseWorks dark theme + composable primitives.
  * **Backend & Database**: Supabase (PostgreSQL with Row Level Security, Auth, and Storage).
  * **Background Workflows**: Event-driven durable background jobs (Inngest).
* **Consequence**: Avoids microservices sprawl while providing enterprise scalability.
