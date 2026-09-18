# Database Schema — Logical Model

This is a logical model, not the final migration.

Core tables:

- `users`, `roles`, `memberships`
- `clients`
- `engagements`
- `content_items`
- `content_reviews`
- `client_requests`
- `tasks`
- `meetings`
- `proposed_actions`
- `context_items`
- `decisions`
- `tool_subscriptions`
- `expenses`
- `invoices`, `invoice_lines`
- `credentials`
- `activity_events`

Important relationships:

```text
Client 1—N Engagement
Engagement 1—N Content
Content 1—N Review
Client 1—N Request
Request 1—N Task
Engagement 1—N Meeting
Meeting 1—N ProposedAction
Client 1—N ToolSubscription
ToolSubscription 1—N Expense
Client 1—N Invoice
Client 1—N Credential
Any important entity 1—N ActivityEvent
```

Core constraints:
- foreign keys;
- unique provider event IDs/idempotency keys;
- lifecycle timestamps;
- client/engagement scoping;
- no plaintext secrets;
- no secrets in metadata/logs.

Do not treat this as permission to implement every table immediately. Build the smallest schema needed by the current vertical slice.