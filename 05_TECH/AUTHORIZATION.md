# Authorization Model

## ADMIN
Organization-level operations: clients, engagements, billing, tools, renewals, settings and credential administration subject to policy.

## TEAM
Execution access: assigned clients/work, content, requests/tasks, meetings and relevant context. Restrict owner billing/settings and broad credential access by default.

## CLIENT
Scoped external access: own reviewable content, approve/request changes, relevant request/status information.

Cannot access other clients, internal notes/tasks/financials or broad credentials.

## Credential permissions
Model separately:
- metadata visibility;
- reveal;
- copy;
- edit;
- revoke/delete.

A user who can see a client does not automatically gain credential reveal access.

Enforce client boundaries at the database authorization layer where supported, and validate business permissions in application code too.