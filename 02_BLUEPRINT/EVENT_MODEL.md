# Event Model

Events are meaningful things that happen in the operating system or connected business workflow.

## Content
`content.created`, `content.sent_for_review`, `content.approved`, `content.changes_requested`, `content.scheduled`, `content.published`

## Requests/tasks
`request.received`, `request.assigned`, `request.status_changed`, `request.completed`, `task.created`, `task.completed`, `task.overdue`

## Meetings
`meeting.completed`, `meeting.transcript_available`, `meeting.extraction_completed`, `meeting_action.confirmed`, `meeting_action.dismissed`

## Billing
`invoice.draft_generated`, `invoice.sent`, `invoice.due`, `invoice.overdue`, `payment.recorded`, `expense.created`, `expense.invoiced`

## Tools
`subscription.created`, `subscription.renewal_approaching`, `subscription.renewed`, `subscription.cancelled`

## Credentials
`credential.created`, `credential.updated`, `credential.revealed`, `credential.copied`, `credential.access_revoked`

## Every event should answer
1. What happened?
2. What state changed?
3. What downstream work is required?
4. What notification is needed?
5. What history should be recorded?

## Reliability
Inbound provider events must be idempotent. Retries must not create duplicate tasks, expenses, invoice lines or notifications.