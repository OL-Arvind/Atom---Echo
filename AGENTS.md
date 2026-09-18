# Atom & Echo OS — AI Agent Instructions

## Mission
Build a custom operating system around how Atom & Echo actually operates. Do not build a Notion clone, generic agency SaaS, isolated CRUD modules, or another maintenance burden.

## Mandatory reading
Before coding, read:
1. 00_PROJECT/SOURCE_OF_TRUTH.md
2. 00_PROJECT/PROJECT_OVERVIEW.md
3. 00_PROJECT/DECISIONS.md
4. relevant 02_BLUEPRINT documents
5. relevant 04_UX documents
6. relevant 05_TECH documents
7. 06_BUILD/CURRENT_STATE.md
8. 06_BUILD/ACCEPTANCE_CRITERIA.md

## Product laws

### Manual by exception
Prefer meaningful action → event → derived state → automation → next action.

### One source of truth
Do not duplicate operational state. Calendar is a projection of dated records, not a second content database.

### Action over storage
The command center answers “what needs attention now?” Every actionable item should have a next action.

### Context compounds
Meetings, decisions, client preferences, approved/rejected work and history become reusable context.

### Separate experiences
Internal operator UI and external client UI are different surfaces.

### Integrate before rebuilding
Keep external systems that already do their job; build the operational layer around them.

### Security is architectural
Credentials, tokens and API keys are sensitive. Never store plaintext secrets, put secrets in source control, expose provider keys to the browser, or log secret values.

## Requirement discipline
Label reasoning:
- FACT — directly supported by evidence
- DECISION — approved system decision
- PROPOSAL — BaseWorks recommendation
- ASSUMPTION — temporary working assumption
- UNKNOWN — evidence insufficient

Never silently convert assumptions into requirements.

## Before implementing a feature
Answer:
1. What real workflow is this?
2. Which entity owns the state?
3. What event starts/changes it?
4. What state transition occurs?
5. What should happen automatically?
6. What remains manual?
7. What history is logged?
8. What is the next action?
9. Which existing decision constrains it?

If the docs do not answer these, flag the ambiguity instead of inventing behaviour.

## Scope protection
Check 03_PHASES/PHASE_1.md and DO_NOT_BUILD.md before adding functionality. Do not pull Phase 2 ideas into V1 because they sound useful.

## Build discipline
- Work in vertical slices.
- Keep domain logic separate from UI.
- Keep provider integrations behind adapters.
- Use migrations for schema changes.
- Test state transitions and automation.
- Do not add dependencies without reason.
- Do not refactor unrelated code.
- Avoid microservices unless demonstrated necessary.

## Context maintenance
After meaningful work update CURRENT_STATE.md. If a durable product/architecture decision changes, update 00_PROJECT/DECISIONS.md or create an ADR.

The repository must remain understandable to a new agent with no chat history.