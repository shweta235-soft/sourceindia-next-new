# BULK120 — Tickets native GET routes (security-conscious partial conversion)

Source of truth: `legacy/sourceindia-express/routes/ticketRoutes.js`, `controllers/ticketController.js`, `models/Tickets.js`, `models/TicketReply.js`.

7 GET method/path registrations have dedicated Next route handlers:

| Route | Native handler status | Important behavior difference |
| --- | --- | --- |
| GET /v2/api/tickets/ | Implemented | Admin session required, and sensitive `otp` / `token` omitted. Original allowed unauthenticated access. |
| GET /v2/api/tickets/count | Implemented | Original `{total}` shape, live DB parity pending. |
| GET /v2/api/tickets/server-side | Authorization gated, returns 501 for signed-in admins | Original supports role/category filters; **not yet native functional parity**. |
| GET /v2/api/tickets/:id | Implemented | Admin session required; tracker token and OTP omitted; verify associated TicketCategory/replies. |
| GET /v2/api/tickets/:ticket_id/next | Authorization gated, returns 501 for signed-in admins | Original returns tracking token, role authorization unresolved. |
| GET /v2/api/tickets/id/:id/next | Authorization gated, returns 501 for signed-in admins | Original filters by admin role/category. |
| GET /v2/api/tickets/support-ticket/track/:number | Implemented | Requires token, constant-time check, no token in response, 302 redirect for absent/invalid token. Live parity pending. |

**Not complete functional parity.** A dedicated route does not prove that the original method's logic, permissions, serialization, or side effects have been fully migrated. Do not mark 7/7 as production ready. Legacy write methods remain under compatibility bridge restrictions.

Tests: `npm run test:api:bulk120`; `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk120.ps1` while `npm run dev` is running. The PowerShell test is an unauthenticated safety smoke test only, not authenticated or Express differential parity.

**Next batch — BULK121: Ticket mutations**, after isolated test DB and mail/upload safeties are confirmed: POST `/v2/api/tickets/`, `/send-otp`, `/verify-otp`, `/store-ticket`, `/track-ticket`, `/store-support-ticket-reply`; PUT `/v2/api/tickets/:id`; PATCH `/v2/api/tickets/:id/status`; DELETE `/v2/api/tickets/:id`. Also complete role-scoped BULK120 GETs.
