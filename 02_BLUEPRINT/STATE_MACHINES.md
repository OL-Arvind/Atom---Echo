# State Machines

## Content
`IDEA → DEVELOPMENT → INTERNAL_REVIEW → CLIENT_REVIEW → APPROVED → SCHEDULED → PUBLISHED`

Exceptions: `NEEDS_CHANGES`, `ON_HOLD`, `REJECTED` where operationally required.

**Approve:** record decision → content APPROVED → activity → calendar projection → next publishing action.

**Changes requested:** record comment → content NEEDS_CHANGES → execution work visible.

## Client Request
`RECEIVED → TRIAGED → ASSIGNED → IN_PROGRESS → WAITING_FOR_CLIENT → COMPLETED`

Exception: `ON_HOLD`.

## Review
`PENDING → APPROVED | CHANGES_REQUESTED`

## Invoice
`DRAFT → SENT → PAID`

Exception: `SENT → OVERDUE → PAID`.

## Tool Subscription
`ACTIVE → RENEWAL_APPROACHING → RENEWED`

Exception: `ACTIVE → CANCELLED`.

## Proposed Action
`PROPOSED → CONFIRMED → APPLIED`

Alternative: `PROPOSED → DISMISSED`.

## Rule
Never use one generic status vocabulary for unrelated workflows.