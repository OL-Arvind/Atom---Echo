# Build Plan

## 0 — Foundation
App setup, auth, database, client/engagement model, activity/event foundation, secrets.

## 1 — Content vertical slice
Client → engagement → content → internal review → client review → approval/change → state → calendar projection → activity.

## 2 — Command Center
Derive attention from real state: overdue, waiting on client, today's work, renewals, unbilled expenses.

## 3 — Billing + Tools
Subscription → expense → invoice line → invoice → send → due/overdue.

## 4 — Credential Vault
Secure secret lifecycle, authorization and audit.

## 5 — Meetings
Fathom → meeting → extraction → proposals → confirmation → state/context.

## 6 — Migration + hardening
Migrate agreed records; reconcile; permissions; failure states; audit; backups.

## 7 — Staging with real workflow
Observe actual use and capture friction.

## 8 — Go-live
Final migration, credentials cutover, integrations, operating handoff.