# Integration Architecture & Technical Contracts

## Adapter Pattern Requirement
All external third-party services (Fathom, WhatsApp/Twilio, Stripe, Resend) MUST sit behind an abstract internal interface. No domain code or UI component may directly invoke a third-party SDK.

## Event Dispatchers & Idempotency
- All inbound webhooks (e.g. Fathom meeting completed, payment received) must carry an idempotency key.
- Handlers verify digital signatures before dispatching to Inngest durable workflows.
