# Bulk86 — Buyer Message Send (explicit opt-in)

## New local API
`POST /api/local/enquiries/buyer-messages/send` (Node.js runtime).

Requires `Authorization: Bearer <local JWT>` and JSON:
```json
{"company_id":123,"title":"Inquiry","message":"Please contact me","request_id":"acb766df-6bc1-4f91-8284-3a257b52a72b"}
```
`request_id` must be a NEW UUID (version 1–8, standard variant) for each distinct user action; repeat the same UUID for network retries. **Never** issue a different UUID to retry a failed email for a message already saved.

## Security, data, and delivery
- **Default OFF**. Set `LOCAL_BUYER_MESSAGE_SEND_ENABLED=true` in `.env.local` **only after** deliberate readiness checks and test environment email handling are verified. When disabled valid requests return HTTP 503 and do **not** write.
- Account is derived from JWT; request cannot set sender ID. Receiver is looked up from current active sellers. Own-company sending blocked.
- Complete valid body required, max 8 KiB JSON. UUID de-duplicated via unique `buyerenquiry.uuid` using sender-bound digest; no database schema changes.
- SMTP settings loaded from `site_settings`, template 67 from `emails`. StartTLS required on non-465 ports; SMTP TLS certificate checks are not disabled. Template substitutions escape untrusted HTML.
- Successful SMTP response returns `201 {saved:true,delivery_status:'sent'}`. If DB insert succeeds but SMTP fails, return `202 {saved:true,delivery_status:'failed'}` — **do not pretend** email succeeded; identical request IDs will not resend. A production outbox/retry queue requires a separate migration and is NOT included.
- `200 {saved:true,already_exists:true,delivery_status:'not_retried'}` means duplicate request skipped; NOT confirmation of email delivery. `503` indicates unavailable config or DB before write, except unexpected DB errors.
- Does not modify UI or call route from public pages automatically. Original backend mailHelper adds header/footer and uses looser TLS; that exact markup is not yet migrated. This phase sends template 67 HTML body only. Do not declare end-to-end email or React parity without tests.

## New dependency
`nodemailer@7.0.9` added to package.json and package-lock.json using the pinned original backend lock entry.
**For this batch only** run `npm ci` from the target project directory, then `node --test src/lib/localBuyerMessageSend.test.mjs` and `npm run build`.
Keep the existing `.env.local` when extracting.

## Testing status
Source tests 16/16 PASS (Bulk84–86 selected), JS/TS transpilation syntax checked; ZIP integrity checked. Production build, local DB insert, email delivery, and SMTP TLS are **not verified** in this sandbox. Leave feature disabled until a controlled test and safety review.
