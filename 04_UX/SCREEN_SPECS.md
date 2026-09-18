# Screen Specifications & Wireframe Definitions: Atom & Echo OS

This document provides detailed wireframes, layout grids, component breakdowns, data requirements, and interaction rules for the 5 core user interfaces of the Atom & Echo Operating System.

---

## Screen 1: The Unified Command Center (`/command-center`)

### 1.1 Wireframe Layout
```text
+----------------------------------------------------------------------------------------------------+
|  ATOM & ECHO OS          [ Cmd+K Quick Search ]                     (Bell: 3)  [ Sudeesh (Admin) v]|
+----------------------------------------------------------------------------------------------------+
| [Sidebar]     | COMMAND CENTER                                           [ + New Content ] [ + Request ] |
|               |                                                                                     |
| Command Ctr   |  +----------------+  +----------------+  +----------------+  +----------------+    |
| Clients       |  | ACTIVE CLIENTS |  | POSTS IN REVIEW|  | SCHEDULED POSTS|  | UNBILLED TOOLS |    |
| Content Studio|  |      14        |  |       7        |  |  18 this week  |  |   Rs. 32,400   |    |
| Master Cal    |  +----------------+  +----------------+  +----------------+  +----------------+    |
| Operations    |                                                                                     |
| Billing       |  URGENT TRIAGE QUEUE (Requires Sudeesh Attention)                                   |
| Settings      |  +--------------------------------------------------------------------------------+ |
|               |  | [!] CRITICAL: Emergency hold requested by FinTech Corp (John Doe) [View Ticket]| |
|               |  | [W] WARNING: 3 posts waiting in Client Review > 72 hrs (SaaS Scale) [WhatsApp] | |
|               |  | [W] WARNING: Clay Pro subscription renews in 3 days (Unallocated)   [Review]   | |
|               |  +--------------------------------------------------------------------------------+ |
|               |                                                                                     |
|               |  TODAY'S OPERATIONAL PIPELINE                 | QUICK REVIEWS PENDING MY APPROVAL   |
|               |  - [ ] Review hook for Rohit's Tuesday post   | [ Post #104 - FinTech Corp        ] |
|               |  - [ ] Confirm draft invoice #AE-0042         | [ Post #105 - Logistics Co        ] |
|               |  - [ ] Onboard new client: Priya (DeepTech)   | [ Post #106 - CyberSecurity Ltd   ] |
+---------------+-----------------------------------------------+-------------------------------------+
```

### 1.2 Data Requirements & Interaction Rules
* **KPI Header Cards**: Real-time counts of active clients, posts in review, weekly scheduled slots, and accrued unbilled tool expenses.
* **Urgent Triage Feed**: Algorithmic queue that checks for stalled reviews, emergency holds, and approaching tool renewals.
* **Quick Review Drawer**: Clicking any post in the "Pending My Approval" list immediately slides open the editor drawer for 1-click internal sign-off.

---

## Screen 2: Client 360 Workspace (`/clients/[id]`)

### 2.1 Wireframe Layout
```text
+----------------------------------------------------------------------------------------------------+
| < Back to Clients   |  FINTECH CORP  [ Active Retainer ]  [ Rs. 1,50,000/mo ]   [ WhatsApp Founder ]|
+----------------------------------------------------------------------------------------------------+
| [ Tab 1: Content Pipeline ] [ Tab 2: Context Vault ] [ Tab 3: Credential Vault ] [ Tab 4: Billing ] |
+----------------------------------------------------------------------------------------------------+
| TAB 2 ACTIVE: FOUNDER INTELLIGENCE & CONTEXT VAULT                                                  |
|                                                                                                     |
|  +-- POSITIONING & ICP --------------------------+  +-- TONE & TABOO TOKENS ----------------------+ |
|  | Target: Series A/B CTOs building Fintech APIS |  | Archetype: Contrarian Technical Builder     | |
|  | Core Prop: Eliminate banking integration lag  |  | Cadence: Short hooks (<10 words), no fluff  | |
|  | Contrarian: "Monoliths win over microservices"|  | Taboo: synergy, delve, leverage, game-changer| |
|  +-----------------------------------------------+  +---------------------------------------------+ |
|                                                                                                     |
|  +-- VERIFIED PROOF POINTS (Verified Numbers) ---+  +-- NARRATIVE STORY VAULT --------------------+ |
|  | - ARR: $12.4M ARR (Q3 2026 Audit)             |  | - [Story] The 2 AM database migration outage| |
|  | - Customers: 140 Enterprise banks             |  | - [Origin] Quitting Google to build in a van| |
|  | - Headcount: 85 engineers                     |  | - [Framework] The 3-Tier Liquidity Rule     | |
|  +-----------------------------------------------+  +---------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### 2.2 Tab 3 Layout: Encrypted Credential Vault
```text
+-- CREDENTIAL VAULT (AES-256 Encrypted) -----------------------------------------------------------+
| Platform          | Username / Email      | Password               | 2FA / Notes    | Actions     |
|-------------------+-----------------------+------------------------+----------------+-------------|
| LinkedIn Personal | john@fintechcorp.io   | [ ••••••••••••••• ]    | SMS to Sudeesh | [Reveal][Cp]|
| HeyReach Seat #4  | john.sender@fintech.io| [ ••••••••••••••• ]    | Authy Vault    | [Reveal][Cp]|
| Webflow Admin     | team@fintechcorp.io   | [ ••••••••••••••• ]    | None           | [Reveal][Cp]|
+---------------------------------------------------------------------------------------------------+
```
* **Reveal Action**: Clicking `[Reveal]` unmasks password for 30 seconds with an active timer; writes to `credential_audit_logs`.
* **Copy Action**: Directly writes secret to system clipboard; logs compliance audit entry.

---

## Screen 3: Content Production Studio & Editor (`/content/[id]`)

### 3.1 Wireframe Layout
```text
+----------------------------------------------------------------------------------------------------+
| < Back to Pipeline | Client: FinTech Corp | Status: [ Internal Review v ]     [ Send to Client PWA]|
+----------------------------------------------------------------------------------------------------+
|  POST EDITOR (Markdown Canvas)                   |  LINKEDIN PREVIEW & CONTEXT DRAWER              |
|                                                  |                                                 |
|  Title: The 2 AM Database Migration Disaster     |  +-- LIVE LINKEDIN MOBILE SIMULATOR -----------+|
|  Pillar: [ Engineering Truths v ]                |  | [Avatar] John Doe * Founder at FinTech Corp ||
|                                                  |  | 2 hrs * Edited * (Globe)                    ||
|  Most CTOs think microservices scale best.       |  |                                             ||
|  They are wrong.                                 |  | Most CTOs think microservices scale best.   ||
|                                                  |  | They are wrong.                             ||
|  In 2024, our database crashed at 2 AM.          |  | ...see more                                 ||
|  We lost 4 enterprise banks in 20 minutes.       |  +---------------------------------------------+|
|                                                  |                                                 |
|  Here is what we rebuilt:                        |  +-- TABOO WORDS LINTER -----------------------+|
|  1. Replaced 14 microservices with one monolith  |  | [OK] 0 Taboo words detected                 ||
|  2. Enforced the 3-Tier Liquidity Rule           |  +---------------------------------------------+|
|                                                  |                                                 |
|  [ Word Count: 184 words ]                       |  +-- CLIENT CONTEXT DRAWER --------------------+|
|  [ Assigned Writer: Nikhil ]                     |  | [Search Stories: "database", "seed", ...]   ||
|                                                  |  | > Insert: Verified Metric: $12.4M ARR       ||
|                                                  |  | > Insert: Framework: 3-Tier Liquidity Rule  ||
+--------------------------------------------------+-------------------------------------------------+
```

### 3.2 Editor Interactions
* **Taboo Word Scanner**: If writer types *"We leveraged this synergy to become a game-changer"*, words are immediately highlighted in red pills with suggestions to replace or delete.
* **Context Insertion**: Clicking `[Insert]` on any story or proof point directly appends the verified fact into the editor text area.

---

## Screen 4: Master Temporal Operational Calendar (`/calendar`)

### 4.1 Wireframe Layout
```text
+----------------------------------------------------------------------------------------------------+
| MASTER OPERATIONAL CALENDAR       [ < Previous ] [ September 2026 ] [ Next > ]   [ Filters v ]     |
+----------------------------------------------------------------------------------------------------+
| Filter by Client: [ All Clients v ]   View: [ Month ] [ Week ] [ Agenda ]                          |
+----------------------------------------------------------------------------------------------------+
| MONDAY 21          | TUESDAY 22         | WEDNESDAY 23       | THURSDAY 24        | FRIDAY 25     |
|--------------------+--------------------+--------------------+--------------------+---------------|
| [Post] John Doe    | [Post] Priya       | [Post] John Doe    | [Post] Rohit       | [Post] Priya  |
| "The 2 AM Disaster"| "Seed Round Pivot" | "Why Monoliths Win"| "Hiring Engineers" | "Weekly Wrap" |
| 10:00 AM (LinkedIn)| 09:30 AM (LinkedIn)| 10:00 AM (LinkedIn)| 11:00 AM (LinkedIn)| 04:00 PM      |
|                    |                    |                    |                    |               |
|                    | [Outbound Launch]  |                    | [Tool Renewal]     | [Billing Draft|
|                    | FinTech Campaign 2 |                    | Clay Pro ($149)    | FinTech Corp  |
+--------------------+--------------------+--------------------+--------------------+---------------+
```
* **Operational Projection**: Clicking any card opens the corresponding entity drawer (Content, Campaign, Tool, or Invoice).
* **Zero Manual Scheduling**: Post cards only appear on the calendar once their status is `Approved` or `Scheduled` with a locked timestamp.

---

## Screen 5: Client Review Mobile PWA (`/review?token=...`)

### 5.1 Mobile Wireframe Layout (Zero-Login Experience)
```text
+------------------------------------+
|  ATOM & ECHO       [ Client Portal ]
|  FinTech Corp - Weekly Content Batch
+------------------------------------+
|                                    
|  POST 1 OF 3 FOR NEXT WEEK         
|                                    
|  +-- LINKEDIN CARD PREVIEW -------+
|  | [Photo] John Doe               |
|  | Founder & CEO at FinTech Corp  |
|  | Just now * (Globe)             |
|  |                                |
|  | Most CTOs think microservices   |
|  | scale best. They are wrong.    |
|  |                                |
|  | In 2024, our database crashed  |
|  | at 2 AM. We lost 4 enterprise  |
|  | banks in 20 minutes.           |
|  |                                |
|  | Here is what we rebuilt...     |
|  +--------------------------------+
|                                    
|  Scheduled: Tue, Sep 22 at 10:00 AM
|                                    
|  +--------------------------------+
|  | [  APPROVE POST (1-TAP)  ]    |  <- Prominent green button
|  +--------------------------------+
|  | [ Request Edits / Changes ]    |  <- Secondary neutral button
|  +--------------------------------+
|                                    
+------------------------------------+
```

### 5.2 Revision Drawer (When "Request Edits" is Tapped)
```text
+-- REVISION REQUEST ---------------+
| Quick Tone Tags:                   |
| [ Too casual ]  [ Weaken claim ]   |
| [ Change hook ] [ Update metric ]  |
|                                    |
| Your notes:                        |
| [ Change 2024 to 2025 and make    |
|   the hook 2 lines shorter.      ] |
|                                    |
| [ Submit Feedback ]  [ Cancel ]    |
+------------------------------------+
```
* **Immediate Confirmation**: Tapping **"Approve Post"** produces a brief haptic/animated green checkmark: *"Approved! Scheduled for Tuesday, Sep 22."* The next post in the queue slides in automatically.
