# BULK129 — Contacts + Front Menu native write audit

## Original Express write signatures (9)
Contacts: `POST /v2/api/contacts/`, `PATCH /v2/api/contacts/:id/delete_status`, `DELETE /v2/api/contacts/:id`, `DELETE /v2/api/contacts/delete-selected`.
Front Menu: `POST /v2/api/front_menu/`, `PUT /v2/api/front_menu/:id`, `PATCH /v2/api/front_menu/:id/is_show`, `PATCH /v2/api/front_menu/:id/status`, `DELETE /v2/api/front_menu/:id`.

## Verified in this batch
- Compared original `contactsController.js` and `frontMenuController.js` to native handlers.
- Corrected contact create order: DB commit now precedes sending QA SMTP messages, mirroring original Express `Contacts.create()` followed by `sendMail()` calls. Previously SMTP ran inside an uncommitted DB transaction; a second-mail failure rolled back the saved contact after the first mail had already been delivered.
- On DB insert failure, rollback occurs and no email is attempted. On SMTP failure following a successful commit, the contact remains recorded and an HTTP 500 error is returned (as original Express does).
- Tested guarded native Front Menu create/update/status/is_show/delete with a fake transaction-capable DB, including SQL rollback and missing-row cases.
- Tested QA write gates block production and missing bearer token before DB access.
- Existing BULK128 read/search and BULK127 source regression tests passed, 30/30 total.

## NOT verified; do not present as full write parity
- No live QA MariaDB write requests or SMTP sends were performed; mocked transactions are not MySQL/SMTP integration tests.
- Contact SMTP template rendering, mail helper headers, and delivery semantics are not proven identical to legacy Express.
- Front Menu missing/partial input, null handling, FK constraints, auto-generated timestamps and error structures have not undergone real DB differential testing.
- Backend writes remain disabled by default and in production. Tests do NOT change live data.
- Full `next build` not run in this container (project `node_modules` not installed); local Windows build required.
- GET and search comparisons were confirmed by the user's previous BULK128 output (5/5 GET and 8/8 search). These are not newly rerun here.

## Commands
`npm run test:api:bulk129`
`npm run build`
For GET/search regression with `npm run dev` running: `npm run test:api:bulk128:parity` and `npm run test:api:bulk128:search-parity`.

## Follow-up QA gate
For actual write parity, provision **disposable** MariaDB schema/data copies and SMTP sandbox with explicit recipient allowlist. Compare original Express vs Next.js on fixture writes, preserving status codes, JSON, side effects and rollback behavior. Do not enable writes in an existing production/user DB.
