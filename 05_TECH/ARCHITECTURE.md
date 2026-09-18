# Technical Architecture

## Posture
Modular monolith first: one coherent application with clear modules. Avoid microservices until there is a demonstrated need.

## Baseline
- Next.js + TypeScript;
- PostgreSQL/Supabase;
- authenticated access + row-level authorization;
- object/file storage;
- durable background jobs for scheduled/retriable work;
- server-side integration layer;
- structured event/activity log.

## Modules
`auth`, `clients`, `engagements`, `content`, `reviews`, `calendar`, `requests`, `tasks`, `meetings`, `context`, `billing`, `tools`, `expenses`, `credentials`, `notifications`, `activity`, `integrations`.

## Flow
UI/webhook → application command → validation → state transition → event/activity → rules → derived updates/jobs/notifications.

Sensitive operations remain server-side. External integrations must be isolated behind adapters.

## Failure rule
External provider failure must not silently corrupt internal state. Preserve internal state, record integration failure, retry safely, surface exceptions.