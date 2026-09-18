# Security Architecture: Atom & Echo OS

The complete cryptographic specification, AES-256-GCM Credential Vault design, and tokenized review security model are documented in [`02_BLUEPRINT/SECURITY_MODEL.md`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/SECURITY_MODEL.md).

---

## 1. Threat Model & Security Boundaries
- **No Plaintext Secrets**: Passwords, API tokens, and session keys are never stored unencrypted in PostgreSQL or exposed in application logs.
- **Role-Based Scoping**: Client reviewers possess ephemeral, tokenized access restricted strictly to their organization's assets.
- **Step-Up Authentication**: Revealing or copying raw credentials in the operator UI triggers an audit log and requires explicit administrative confirmation.
- **HMAC Review Tokens**: Content review URLs are signed with time-bounded, tamper-proof hashes to prevent enumeration attacks.
