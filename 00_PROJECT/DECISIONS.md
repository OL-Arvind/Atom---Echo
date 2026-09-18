# Decisions

Durable decisions. Do not reopen these without evidence.

## D001 — OS, not Notion clone
Confirmed. Model the agency's operation instead of reproducing Notion pages/databases.

## D002 — Manual by exception
Confirmed. Meaningful user action should cause the system to derive related bookkeeping.

## D003 — Calendar is a projection
Confirmed. Calendar views derive from dated operational records; they are not a second content source of truth.

## D004 — Separate client experience
Confirmed. External clients use a lightweight surface rather than the internal OS.

## D005 — Credential vault lives in OS
Confirmed. Centralized credential management is an explicit requirement.

## D006 — Credentials are sensitive secrets
Confirmed. Encrypt, authorize, mask, audit reveal/copy, and never log secret values.

## D007 — Meeting notes become operational context
Confirmed. Fathom is an event/context source, not merely an archive.

## D008 — Meeting changes are proposed first
Confirmed for Phase 1. Extracted dates/tasks/content ideas/decisions require confirmation before changing canonical state.

## D009 — Tool costs flow into billing
Confirmed. Eligible client tool costs become expense records and invoice lines at actual cost.

## D010 — Direct social publishing deferred
Confirmed for Phase 1. Final LinkedIn/X publishing control remains with Atom & Echo.

## D011 — Full outreach CRM deferred
Confirmed. Do not recreate Clay/Smartlead.

## D012 — Modular monolith first
Internal technical proposal. Avoid premature microservices.

## D013 — Activity history is first-class
Important state changes should be auditable and explainable.

## D014 — Sensitive external/financial mutations require authorization
Do not silently send messages, change credentials, or make financial changes.

## D015 — Phase 1 is operationally complete, not feature-complete
Depth in core workflows beats breadth.