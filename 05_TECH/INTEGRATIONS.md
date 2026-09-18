# Integration Engineering Rules

## Adapter boundary
Providers must sit behind internal adapters. Domain logic must not depend directly on provider SDK details.

## Webhooks
Verify authenticity; persist provider reference; record type/received time; use idempotency; process asynchronously where appropriate; retry safely; record failure.

## Fathom
receive → normalize → associate client/engagement → extract → persist proposed actions → confirmation → apply.

## WhatsApp
V1 notification/review-link delivery behind adapter.

## Email
Invoice dispatch and selected notifications. Internal invoice state remains canonical.

## Notion / Sheets
Migration/reference only as active workflows move into OS.

## LinkedIn / X
Manual final publishing control in V1.

## Rule
An integration failure should not undo a valid internal business state change unless the operation itself is transactional and explicitly designed that way.