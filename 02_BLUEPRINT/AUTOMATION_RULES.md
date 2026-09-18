# Automation Rules Engine: Trigger → Condition → Action Matrix

This document defines the deterministic rules governing the Atom & Echo Operating System. Every automation follows an explicit **Trigger &rarr; Condition &rarr; Action** structure to guarantee predictability and prevent unintentional state mutations.

---

## 1. Governing Rules Philosophy

1. **Deterministic, Never Guessed**: Automations are pure functions of state changes or scheduled cron schedules. No vague heuristic guesses.
2. **Manual by Exception**: System automates the mechanical pipeline (generating tokens, linking expenses, calculating dates, sending warnings). Humans retain control over creative sign-offs and client relationships.
3. **Idempotent Execution**: Every background job can be retried safely without duplicating records or sending multiple customer messages.

---

## 2. Complete Automation Matrix

| Rule ID | Domain Area | Trigger Event | Guardrail Condition | Executed Action |
| :--- | :--- | :--- | :--- | :--- |
| **AUT-01** | Content Pipeline | `content_items.status` &rarr; `client_review` | Post has passed internal review AND 0 taboo words | 1. Generate SHA-256 signed `review_token`<br/>2. Set 7-day expiration<br/>3. Format WhatsApp magic link for 1-click dispatch |
| **AUT-02** | Content Pipeline | Client clicks 'Approve' in PWA | Valid, unexpired token | 1. Set `status = 'approved'`<br/>2. Find next open slot on client cadence<br/>3. Set `scheduled_publish_date`<br/>4. Update `status = 'scheduled'`<br/>5. Alert writer via webhook |
| **AUT-03** | Content Pipeline | Client submits inline feedback | Feedback text length > 3 characters | 1. Set `status = 'draft'`<br/>2. Insert feedback rows into `content_feedback`<br/>3. Surface urgent rework task in writer's queue |
| **AUT-04** | SLA / Monitoring | Daily Cron at 09:00 AM | `status == 'client_review'` AND `updated_at < now() - interval '48 hours'` | 1. Inject 'Stalled Review' warning card into Command Center<br/>2. Generate pre-filled WhatsApp gentle reminder message |
| **AUT-05** | SLA / Monitoring | Daily Cron at 09:00 AM | `status == 'internal_review'` AND `updated_at < now() - interval '24 hours'` | 1. Inject 'Internal Review Pending' alert into Sudeesh's triage feed |
| **AUT-06** | Operations / Triage | Client request filed with `emergency_hold` | Request status is `submitted` | 1. Execute SQL: `UPDATE content_items SET status = 'paused' WHERE client_id = $1 AND status = 'scheduled'`<br/>2. Push urgent SMS/Slack banner to team |
| **AUT-07** | Financials | Daily Cron (`0 0 * * *`) | Current date is 7 days before client's `billing_anchor_day` | 1. Query all `tool_expenses` where `status = 'unbilled'`<br/>2. Create draft `invoices` row (Retainer + itemized tools)<br/>3. Update expenses to `drafted_in_invoice`<br/>4. Add 'Review Draft Invoice' task for Sudeesh |
| **AUT-08** | Financials | Daily Cron at 08:00 AM | `tool_subscriptions.next_renewal_date <= current_date + 5` | 1. Check if tool is allocated to an active client<br/>2. If orphan/unused, trigger 'Unused Tool Renews Soon' alert |
| **AUT-09** | Financials | Daily Cron at 00:01 AM | `invoices.status == 'sent'` AND `current_date > due_date` | 1. Set `invoices.status = 'overdue'`<br/>2. Display red overdue badge in Command Center |
| **AUT-10** | Security / Vault | User clicks 'Unmask' or 'Copy' in Vault | User authenticated | 1. Log immutable entry in `credential_audit_logs`<br/>2. If time > 22:00 or < 06:00, send security audit ping to Sudeesh |
| **AUT-11** | Security / Vault | Daily Cron at 02:00 AM | `review_tokens.expires_at < now()` AND `revoked == false` | 1. Set `review_tokens.revoked = true` |
| **AUT-12** | Client Context | Writer opens content draft editor | Client context exists | 1. Scan draft body against `client_contexts.taboo_words`<br/>2. If match found, show real-time inline warning pills |

---

## 3. Automation Implementation Rules & Error Recovery

1. **Dead Letter Queue (DLQ)**:
   * Any Inngest event failure after 3 automatic retries is pushed to a system DLQ and surfaced in the Command Center settings page.
2. **Circuit Breakers for WhatsApp**:
   * Outbound WhatsApp notifications are throttled to a maximum of 1 reminder per client per 24-hour window to prevent spamming executive founders.
3. **Audit Immutability**:
   * Automations never mutate `credential_audit_logs` or `audit_logs`. These tables are append-only.
