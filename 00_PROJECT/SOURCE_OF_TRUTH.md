# Source of Truth & Evidence Hierarchy

**Repository**: Atom & Echo Custom Operating System  
**Product Line**: BaseWorks BaseEngine  

---

## 1. The Strict Evidence Hierarchy

When building or updating the Atom & Echo OS, all agents, engineers, and LLMs MUST resolve questions, requirements, and ambiguities using this explicit hierarchy:

```
┌───┐
│ 1 │  LIVE OPERATIONAL SYSTEMS & NOTION DATA
└───┘  (Actual schemas, live client records, existing tool billing, tags, published posts)
  │
┌───┐
│ 2 │  RAW MEETING RECORDINGS & TRANSCRIPTS
└───┘  (08_REFERENCE/meeting_transcript_1.md and meeting_transcript_2.md)
  │
┌───┐
│ 3 │  APPROVED PHASE 1 BLUEPRINT
└───┘  (Atom_Echo_Phase_1_Blueprint.md / .pdf)
  │
┌───┐
│ 4 │  CANONICAL SYSTEM BLUEPRINTS & DOMAIN MODELS
└───┘  (02_BLUEPRINT/ directory: DOMAIN_MODEL.md, STATE_MACHINES.md, EVENT_MODEL.md)
  │
┌───┐
│ 5 │  ARCHITECTURE DECISION RECORDS (ADRs)
└───┘  (00_PROJECT/DECISIONS.md)
  │
┌───┐
│ 6 │  EXISTING ACTIVE APPLICATION CODE
└───┘  (Tested code in src/ with passing tests)
  │
┌───┐
│ 7 │  LEGACY PROPOSALS, CHARTERS & SOWs (LOW AUTHORITY)
└───┘  (09_LEGACY/ directory: Debtworks SOW, early Charter drafts)
  │
┌───┐
│ 8 │  AI-GENERATED SUMMARIES OR SPECULATIVE ASSUMPTIONS (ZERO AUTHORITY)
└───┘  (Unverified assumptions not backed by Levels 1–4)
```

---

## 2. Specific Authority Assessments of Existing Repository Artifacts

| Document / Asset | Location | Status | Authority Level | Permitted Usage |
|---|---|---|---|---|
| **Live Notion Workspace** | Notion Admin Access | Active Source | **Highest (Level 1)** | Source for client data, content pillars, tool costs, tags. |
| **Meeting Transcripts 1 & 2** | `08_REFERENCE/` | Active Source | **High (Level 2)** | Proof of real user pain, founder preferences, verbal agreements. |
| **Atom Echo Phase 1 Blueprint** | Root (`.md` and `.pdf`) | Approved Baseline | **High (Level 3)** | Definitive scope, commercial terms, guarantees, and milestones. |
| **Domain & System Blueprints** | `02_BLUEPRINT/` | Canonical Design | **High (Level 4)** | Exact specifications for entities, states, events, and automations. |
| **PROJECT_CONTEXT.md** | `09_LEGACY/` | Legacy Background | **Low (Level 7)** | Strategic overview only; do not cite for software feature scope. |
| **Debtworks-Proposal-SOW.md** | `09_LEGACY/` | Historical Template | **Low (Level 7)** | Historical debt-advisory SOW; completely superseded. |
| **Atom Echo BaseEngine Charter** | `09_LEGACY/` | Superseded Draft | **Low (Level 7)** | Replaced by the Phase 1 Blueprint. |

---

## 3. Conflict Resolution Rules

1. **If Notion/Transcripts conflict with legacy SOWs**: Follow Notion and the Transcripts. The SOW was written before the full operational discovery.
2. **If an AI agent is unsure about a requirement**: Never invent a feature. Consult `02_BLUEPRINT/DOMAIN_MODEL.md` or flag the specific ambiguity to the human architect.
3. **If a user request contradicts an established ADR**: Refer to `00_PROJECT/DECISIONS.md`. If the decision is intentionally being overturned, record a new ADR before modifying code.
