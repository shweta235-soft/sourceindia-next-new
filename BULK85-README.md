# Bulk85 — Buyer message delivery preflight (no writes)

Original Express sends buyer messages by inserting into `buyerenquiry`, then loading email template 67 and dispatching SMTP via `site_settings`. Failure after insert may leave a message saved without email delivery. Bulk85 does NOT implement that unsafe partial-send behavior.

New authenticated endpoints:
- `GET /api/local/enquiries/buyer-messages/delivery-readiness` — checks SMTP settings and template 67 presence, without exposing secrets.
- `POST /api/local/enquiries/buyer-messages/prepare` — validates title/message/recipient and checks mail readiness. This is a **preflight only**, with zero writes.

`sending_enabled` is always `false`. `ready_for_transport_integration` only confirms settings/template existence, NOT SMTP deliverability.

Run `node --test src/lib/localBuyerMessageDeliveryReadiness.test.mjs` and `npm run build`. No npm dependency changes. UI unchanged. Do not use real SMTP credentials in chat.
