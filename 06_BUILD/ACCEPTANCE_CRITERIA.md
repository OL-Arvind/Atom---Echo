# Acceptance Criteria — Phase 1

## Global
**AC-001:** normal operator actions do not require duplicate bookkeeping.

**AC-002:** important state changes create actor/timestamp activity history.

**AC-003:** client/role boundaries are enforced.

## Content/review
**AC-C01:** client approval records decision and changes content to APPROVED.

**AC-C02:** calendar reflects content dates/state without duplicate calendar data.

**AC-C03:** change request preserves comment and exposes execution work.

## Portal
**AC-P01:** client can review on mobile without internal Notion access.

**AC-P02:** client can approve/request changes with minimal interaction.

**AC-P03:** review access cannot cross client scope.

## Billing/tools
**AC-B01:** eligible client tool expense can automatically become an invoice line.

**AC-B02:** same expense cannot be invoiced twice.

**AC-B03:** invoice supports DRAFT → SENT → PAID / OVERDUE.

**AC-B04:** invoice PDF is generated from canonical invoice data.

## Renewals
**AC-R01:** active subscription produces configured renewal reminder.

## Credentials
**AC-S01:** credentials masked by default.

**AC-S02:** unauthorized reveal/copy denied.

**AC-S03:** reveal/copy audited without secret value.

**AC-S04:** raw secrets never appear in logs/errors/activity.

## Meetings
**AC-M01:** Fathom meeting attaches to correct client/engagement.

**AC-M02:** structured proposed actions can be created.

**AC-M03:** proposals do not mutate canonical state before confirmation.

**AC-M04:** confirmed proposals create/update intended records and activity.

## Command center
**AC-CMD01:** overdue/blocked work surfaces.
**AC-CMD02:** today's content is derived from content records.
**AC-CMD03:** upcoming renewals surface automatically.
**AC-CMD04:** unbilled eligible expenses surface.