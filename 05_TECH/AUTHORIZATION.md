# Authorization Model & Role-Based Access Control

## Roles Hierarchy
1. **ADMIN (Sudeesh)**:
   - Full system access.
   - Client financial terms, retainer amounts, tool expense approvals, and billing management.
   - Master credential vault disclosure and audit logs.
2. **OPERATOR (Nikhil / Execution Team)**:
   - Content authoring, editing, and scheduling.
   - Client context viewing and asset management.
   - Restricted from viewing global agency margins and raw root passwords unless explicitly delegated.
3. **CLIENT (External Founder)**:
   - Scoped strictly to their own organization.
   - Accessible only through signed, single-use or time-bounded tokens for review.
   - Zero access to internal notes, tasks, costs, or other clients' workspaces.
