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

---

## ADR-006: Adoption of ClickUp Design System (Light Canvas + Gradient-as-Brand)
* **Status**: ACCEPTED (Human Approved)
* **Context**: User explicitly directed the redesign of the OS to align with ClickUp's productivity design system specification (`clickup.design.md`).
* **Decision**: Replace the dark OLED theme with ClickUp's light-canvas design language:
  * **Canvas & Surface**: `#ffffff` canvas with `#f8f9fa` surface tiers, `#e9ebf0` soft chips, and `#e8e8e8` hairlines.
  * **Graphite Typography**: `#292d34` ink for text and borders, avoiding stark pure black.
  * **Brand Voltage**: Neon Purple (`#7612fa`) contained strictly inside the 263° brand gradient (`#fa12e3` -35% → `#7612fa` 41% → `#12d0fa` 135%) or subtle wordmark/accent highlights.
  * **Primary CTA Inversion**: Inverted to a near-black `#292d34` pill at 20px radius with white text and weight 650.
  * **Typography Scale**: Plus Jakarta Sans for display headlines with negative tracking, Inter for body/chrome, and Sometype Mono for uppercase eyebrows.
---

## ADR-007: Anti-AI-Slop & ADHD-First High-Clarity Design Standards (The "Calm Attention Surface" Doctrine)
* **Status**: ACCEPTED (Human Approved)
* **Context**: Previous iterations suffered from severe "AI slop" hallmarks: regurgitating prompt instructions directly as UI titles/subtitles, wrapping every data point in colored pill/badge confetti, washed-out flat gray contrast, and cognitive overload. For founders and operators with ADHD, this creates sensory fatigue, distraction, and paralysis.
* **Decision**: All operational surfaces must strictly adhere to the "Calm Attention Surface" doctrine:
  1. **Single Dominant Focal Point**: Every screen has exactly one primary focus area (e.g., "Needs Attention"). The operator's eyes should have an effortless, immediate anchor.
  2. **Total Ban on "Pill & Badge Confetti"**: Do NOT wrap passive metadata into rounded colored pills (no `ZERO-LOGIN PWA`, `ZERO LEAKAGE`, `Anchor Day 1`, `ID: a7fcb353...` tags everywhere). Metadata belongs in quiet, secondary tabular text. Colored badges are reserved *exclusively* for genuine operational emergencies/exceptions (e.g. `Emergency Hold`, `Overdue`).
  3. **Zero AI-Prompt-Speak Copywriting**: UI text must be written in crisp, confident human language by a designer, not an LLM explaining a database schema. Ban phrases like *"Exceptions and client bottlenecks requiring human intervention"*, *"Ad-hoc founder requests, emergency revisions, and execution queue tracking"*, *"All automated pipelines operating normally"*. Use concise, human terms: *"Needs Attention"*, *"All caught up"*, *"Hold post for announcement"*.
  4. **No Explanatory Slop or Sidebar Promo Cards**: Internal executive tools do not need marketing promo boxes explaining what a client directory is. Delete explanatory filler.
  5. **Quiet Defaults, Loud Exceptions (Linear / Amie reference)**: Quiet monochrome canvas, crisp typography (Inter / Plus Jakarta Sans), subtle hairlines, and generous breathing room. Color is a high-value currency never wasted on decorative fluff.
* **Consequence**: Delivers a serene, high-velocity operating environment that respects human executive function and provides instant clarity for neurodivergent and neurotypical operators alike.
