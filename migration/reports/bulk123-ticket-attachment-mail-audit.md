# BULK123 — Ticket attachments and email QA implementation audit

This work builds on BULK122; legacy React/Express source is an unchanged reference. **Not full Express functional parity.**

## Changed original write method+paths (6)
- POST `/v2/api/tickets/`: private QA file attached to ticket and initial reply.
- POST `/v2/api/tickets/store-ticket`: private QA file; sends user+admin template pair `110/111` only with notification flag + recipients allowlisted.
- POST `/v2/api/tickets/store-support-ticket-reply`: private QA reply file, with template pair `114/115` (admin reply) or `113/112` (guest reply).
- PUT `/v2/api/tickets/:id`: private QA replacement; refuses unsafe deletion of legacy files and preserves files still referenced by replies.
- PATCH `/v2/api/tickets/:id/status`: notification templates `117/116` (resolved) or `118/119` (cancelled).
- DELETE `/v2/api/tickets/:id`: transactionally removes records, cleans up newly managed QA files after commit; refuses untracked legacy filename cleanup.

## Added private QA download paths (2)
- GET `/v2/api/tickets/attachments/:id/:filename`: requires a valid ticket tracker `Authorization: Bearer <token>` header or suitable admin cookie.
- GET `/admin/api/local/tickets/attachments/:id/:filename`: same response; admin cookie Path=/admin is available.
- Both return `403` unless the ticket's isolated QA write gate is configured. Tickets and replies are verified in DB before serving bytes. No files are exposed under `public/` or legacy `/upload`.

## File security
- Supported: PDF, JPEG, PNG, CSV, TXT, XLS, XLSX. SVG and executable file types are denied. 5 MiB limit and basic magic-header/MIME verification. This is NOT anti-malware scanning.
- Random, private file names `b123_...`; storage `.qa-private-ticket-files/` is gitignored and not included in ZIP. DB transaction failure attempts file cleanup. Filesystem cleanup after successful DB commit is **not** transactionally atomic; backup/reconciliation is needed for production.
- Guest HTML links still require a Bearer authorization header; standard `<a>` navigation alone will not authenticate a guest download. Frontend download integration is pending.

## Email guardrails
- Original template IDs are mapped exactly, but SMTP delivery is disabled by default and **requires** `SOURCEINDIA_TICKET_QA_NOTIFICATIONS_ENABLED=1` and QA SMTP+allowlisted recipients. The admin address comes from `SOURCEINDIA_TICKET_QA_ADMIN_EMAIL` (preferred) or original site settings, but must be in the allowlist. No production/non-local DB writes are allowed.
- Template variable replacement is escaped and messages are not wrapped in original shared email header/footer. Production email rendering, CC/BCC, webhooks, upload URLs, public response serialization and end-to-end side-effect parity are NOT VERIFIED.

## Test status
- Source/mock test suite `npm run test:api:bulk123` tests file validation, data-store mock, rollback cleanup, QA mail pair IDs, default-deny controls and transport alias existence.
- Additional tests from prior BULK114–122 are run separately; see delivery notes.
- Real DB writes, SMTP, actual uploaded-file download and browser/frontend flow **not run**; require a disposable isolated QA DB and QA mail sink.
- Full Next.js production build cannot be verified in this container without complete dependency installation. Run `npm run build` in user's Windows project.
