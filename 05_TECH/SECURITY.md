# Security Architecture

## Credential vault
Credential secrets are encrypted before persistent storage using an application-controlled encryption design. Database authorization is not a substitute for secret-value encryption.

## Access
Authorization considers identity, role, client/engagement scope, action and sensitivity.

## Reveal/copy
1. verify permission;
2. perform step-up/recent-auth check where appropriate;
3. decrypt server-side;
4. return only required value;
5. audit action without secret value;
6. prevent logging/caching of secret.

## Keys
Encryption keys and provider secrets live in managed runtime secret configuration, never source control or browser bundles.

## Portal
Review tokens must be scoped/revocable and not guessable.

## Backups
Encrypted-secret backups remain sensitive and require access controls.

## Security test
Raw credentials must never appear in UI responses outside authorized reveal, logs, activity, analytics, URLs, errors or source control.