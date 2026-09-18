# Domain Model

## Core entities

**Client** — central customer record; owns engagements, context, tools, credentials, meetings and billing relationships.

**Engagement** — commercial/service relationship with service, dates, recurring price, status and billing configuration.

**Content** — canonical content item with client/engagement, body, format, pillar, lifecycle, planned/actual publish dates, assets and review history.

**Review** — review decision/comment linked to content and reviewer.

**Client Request** — durable client-originated work request with category, owner, priority, state and due date.

**Task** — executable work unit linked to a source entity/event.

**Meeting** — meeting occurrence linked to client/engagement, source and external reference.

**Proposed Action** — AI-extracted action awaiting confirmation.

**Context Item** — persistent client/engagement knowledge with source and authority.

**Decision** — durable business decision, usually sourced from a meeting/action.

**Tool Subscription** — recurring external software associated with a client, with cost, cadence and renewal date.

**Expense** — billable/non-billable client cost, optionally sourced from a subscription and linked to invoice.

**Invoice / Invoice Line** — canonical billing record and its components.

**Credential** — encrypted sensitive access record scoped to client and access policy.

**Activity Event** — immutable operational history of meaningful actions.

## Relationships
```text
Client 1—N Engagement
Engagement 1—N Content
Content 1—N Review
Client 1—N Request
Request 1—N Task
Engagement 1—N Meeting
Meeting 1—N ProposedAction
Meeting 1—N Decision
Client 1—N Context
Client 1—N ToolSubscription
ToolSubscription 1—N Expense
Client 1—N Invoice
Client 1—N Credential
Any important entity 1—N ActivityEvent
```

## Modeling rule
Create an entity only when the business must reason about it independently or it has an independent lifecycle.