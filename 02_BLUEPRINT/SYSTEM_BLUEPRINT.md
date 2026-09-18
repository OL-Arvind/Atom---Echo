# System Blueprint

## Core primitives
1. Entities
2. Relationships
3. State
4. Events
5. Rules
6. Context
7. Permissions
8. Activity

## Operating graph
```text
CLIENT
 ├─ ENGAGEMENT
 │   ├─ CONTENT → REVIEW → APPROVAL
 │   ├─ REQUEST → TASK
 │   └─ MEETING → DECISION / CONTEXT
 ├─ TOOL → SUBSCRIPTION → EXPENSE → INVOICE
 ├─ CREDENTIAL
 └─ ACTIVITY

All dated records → CALENDAR PROJECTION → COMMAND CENTER
```

## Core behaviour
A meaningful action updates its canonical state and triggers related bookkeeping.

Example: client approval → review decision → content APPROVED → activity → calendar projection → next publishing action.

## System of record vs system of action
Records hold canonical data. Command center/review/action surfaces help people act on that data.

## Automation ladder
Manual → Assisted → Proposed → Confirmed → Automatic.
Phase 1 should mostly operate in Assisted/Proposed/Confirmed, with Automatic reserved for low-risk bookkeeping/reminders.