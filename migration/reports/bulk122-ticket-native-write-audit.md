# BULK122 Native Ticket Writes — Source/Implementation Audit

Compared with `legacy/sourceindia-express/routes/ticketRoutes.js` and
`legacy/sourceindia-express/controllers/ticketController.js` (original unchanged).

| Original method/path | Native operation | Implementation / limitations |
|---|---|---|
| POST `/v2/api/tickets/` | Admin ticket + initial reply transaction | QA + scoped admin only; no multipart; response shape partially similar |
| POST `/v2/api/tickets/send-otp` | Pending ticket + random 4-digit OTP, template 87 | Needs allowlisted QA SMTP; resend cooldown; original has no safe rate controls |
| POST `/v2/api/tickets/verify-otp` | Single-use verification marker and 5-attempt cap | Native token marker; 10-minute expiry; *not identical* to legacy's loose OTP check |
| POST `/v2/api/tickets/store-ticket` | Finalize verified pending ticket and initial reply | Guest association only; no multipart; native random tracker token |
| POST `/v2/api/tickets/track-ticket` | Lookup ticket with email + ticket number | QA-gated, read-only POST; full response edge cases need QA |
| POST `/v2/api/tickets/store-support-ticket-reply` | Transactional reply + pending->in-progress status | Guest must have ticket token; email templates partially implemented; no multipart |
| PUT `/v2/api/tickets/:id` | Scoped admin ticket edit | No existing attachments; stronger validation; ticket response partial |
| PATCH `/v2/api/tickets/:id/status` | Admin resolve/cancel | User notification optional and allowlisted; admin notification missing |
| DELETE `/v2/api/tickets/:id` | Scoped admin delete with reply cleanup | Rejects attached tickets; different cascading behavior from legacy |

Additional same-origin admin aliases for create/update/status/delete exist at
`/admin/api/local/tickets`, `/admin/api/local/tickets/:id`, and
`/admin/api/local/tickets/:id/status` to handle the `/admin` cookie path.

Verification categories:
- Static route method/path registration: test suite `test:api:bulk122`.
- Mocked contracts/authorization/transaction safety: `test:api:bulk122`.
- Production build / MySQL schema: must run locally; do not infer from syntax tests.
- Actual authorized writes, email delivery, attachment lifecycle, and exact
  Express-vs-Next response parity: **NOT VERIFIED**. Requires disposable QA DB.

Safe-by-default environment configuration is in `.env.example` and README.
