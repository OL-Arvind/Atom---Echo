# Atom & Echo OS — BaseEngine Project

Custom Operating System engineered for **Atom & Echo**, deploying the **BaseEngine** productized architecture by BaseWorks.

---

## 1. Documentation Hierarchy & Source of Truth

```
00_PROJECT    → System truth, evidence hierarchy, and architecture decision records (ADRs)
01_DISCOVERY  → Audit of live Notion, Google Sheets, friction points, and user personas
02_BLUEPRINT  → Relational domain model, state machines, event catalog, and security model
03_PHASES     → Phase 1 core deliverables, Phase 2 roadmap, and explicit anti-goals (Do Not Build)
04_UX         → Information architecture, screen wireframes, operator UX, and client mobile PWA
05_TECH       → Modular monolith architecture, authorization model, database schema, and integrations
06_BUILD      → Vertical slice build plan, acceptance criteria gates, current build state, and tasks
07_DECISIONS  → Architecture decision records index
08_REFERENCE  → Meeting transcripts and discovery session records
09_LEGACY     → Historical proposals, charter documents, and early SOW reference files
AGENTS.md     → Mandatory rules, prime directives, and constraints for all AI coding agents
```

---

## 2. Core Architectural Principles

1. **"Manual by Exception"**:
   The user should not be maintaining an operating system. The operating system must maintain itself from the work the user is already doing.
2. **Never Recreate a Notion Clone**:
   No raw tables with 500 rows to manually edit. Atom & Echo OS is an **attention surface** answering *"What needs attention right now, why, and what happens next?"*
3. **Single Source of Truth**:
   The calendar is a temporal projection of operational data (content dates, campaign dates, billing anchors), NOT a database.
4. **Zero-Login Client Review**:
   High-ticket founder clients approve content via tokenized 1-click mobile links in under 3 seconds without logins or passwords.
