# Client Experience (Zero-Login Review PWA)

## Target Persona
- High-ticket VC-backed and enterprise founders (e.g. Chetan Ahuja, Florian, Series A/B executives).

## Core UX Rules
1. **Zero Login / Zero Friction**:
   - No passwords. No email magic links. No app store downloads.
   - Access is granted via an ephemeral, tamper-proof HMAC-signed URL token sent via WhatsApp or email.
2. **Sub-1-Second Load Time**:
   - Lightweight, mobile-first responsive PWA.
   - Loads in under 1,000ms even on constrained mobile connections.
3. **1-Tap Decisions**:
   - Large touch targets for "Approve" (green) and "Request Changes" (orange/red).
   - Pre-selected feedback chips ("Too salesy", "Make punchier", "Fix hook", "Incorrect numbers") so founders can give actionable feedback in 3 seconds without typing long paragraphs.
