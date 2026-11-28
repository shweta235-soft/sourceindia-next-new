# BULK121 — Tickets role-scoped reads + nine original write-method registrations

Date: 27 November 2026.

## Source and scope

Source: `legacy/sourceindia-express/routes/ticketRoutes.js` and `controllers/ticketController.js`. SourceIndia original React files remain strictly read-only; these files are copies in the Next.js project.

### Existing seven GET endpoints, improved in BULK121

- `GET /v2/api/tickets/` — role-scoped listing rather than all-admin unrestricted listing; still returns 401 without session.
- `GET /v2/api/tickets/count` — unchanged public count.
- `GET /v2/api/tickets/server-side` — query builders and authenticated role-scoped grid (previously 501 to authenticated sessions).
- `GET /v2/api/tickets/:id` — category-scoped detail and related-ticket lookup.
- `GET /v2/api/tickets/:ticket_id/next` — role-scoped prior ticket ID lookup; sensitive token is available ONLY to authorized admin sessions.
- `GET /v2/api/tickets/id/:id/next` — role-scoped prior ticket ID lookup.
- `GET /v2/api/tickets/support-ticket/track/:number` — unchanged tracker-token validation.

**Important auth limitation:** Existing `si_admin_session` cookie is Path=/admin; a normal browser request to `/v2/api/tickets/...` does **not** include this cookie. An admin-accessible alias is provided as `GET /admin/api/local/tickets/legacy-grid` (cookies sent to `/admin`). The original Express JWT `Authorization: Bearer` middleware is a different auth scheme. The new grid is not claimed wire- or auth-parity equivalent to original Express. All authenticated access must be verified on the user's configured environment before production adoption.

### Nine original ticket mutation method/path registrations now recognized by Next.js

- `POST /v2/api/tickets/`
- `POST /v2/api/tickets/send-otp`
- `POST /v2/api/tickets/verify-otp`
- `POST /v2/api/tickets/store-ticket`
- `POST /v2/api/tickets/track-ticket`
- `POST /v2/api/tickets/store-support-ticket-reply`
- `PUT /v2/api/tickets/:id`
- `PATCH /v2/api/tickets/:id/status`
- `DELETE /v2/api/tickets/:id`

These are **explicit Next.js method exports**, NOT native implementations of original mutation business logic. If and only if a strictly isolated nonproduction QA database is configured and both `SOURCEINDIA_TICKET_LEGACY_WRITES_ENABLED=1` and `SOURCEINDIA_LEGACY_COMPAT_WRITES=1`, the guarded method dispatches to the original Express controllers running inside the BULK117 compatibility app. Production always refuses these ticket writes, even with flags. Default behavior is HTTP 403, before reading request body, accessing DB, sending mail, uploading files or writing records.

**Never enable either flag on a live database or ordinary developer/production environment.** The original controllers can send emails, delete ticket attachments, write tickets and replies, and mutate OTP state. No write integration tests were run. The bridge is **not** a substitute for native Next.js conversion.

## Implemented safety measures

- Reads resolve a signed admin session, a current active admins row, a current active nondeleted role, and per-role ticket category. Role `4` has unrestricted category visibility (original controller super-admin behavior); role category `0` means all; missing category means denied.
- Ticket listing/detail/related-tickets/previous-ticket navigation apply category restrictions. Tracker tokens remain excluded from ordinary list and detail response.
- Admin grid uses whitelisted sorting, bounded pagination, escaped LIKE terms and bound SQL parameters. Filters include `search`, `title`, `status`, `priority`, `category` (superadmin), and legacy date range options. Date range behavior needs live parity verification because legacy Sequelize converts Date values using its server timezone.
- Grid returns `{data,totalRecords,filteredRecords}` as in the original Express controller; this has been mocked but not compared against the same MySQL rows.

## Verification performed in this container

- BULK121 source/handler mock tests: **21/21 PASS** (`npm run test:api:bulk121`).
- BULK114–121 combined source/bridge regressions: **94/94 PASS** (`node --experimental-strip-types --test ...`).
- Targeted strict TypeScript checking of changed service files with matched stub module declarations: **PASS**. This is **not** an `npm run build` result.
- ZIP archive integrity checked separately; no live MySQL or HTTP parity was run in this container.

## Safe Windows commands

```powershell
npm run test:api:bulk121
npm run test:api:bulk121:db
npm run build
npm run dev
# In another terminal with dev running
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk121.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk120.ps1
```

The HTTP script only issues GET requests without admin credentials and expects 401; it never sends a mutation. The DB preflight only reads INFORMATION_SCHEMA; no data is read or written. For authenticated QA, open `/admin/api/local/tickets/legacy-grid?page=1&limit=2` after signing into the Next.js Admin UI with a valid admin session. Its contents must be compared with original Express before declaring parity.

## Still incomplete

- Full `npm run build` on the Windows environment.
- Live MySQL preflight and authenticated admin role/category behavior.
- Original bearer JWT vs Next admin cookie interoperability for `/v2/api/tickets/*`.
- Native conversion + correct email, file upload, OTP, replies, status updates and deletion for nine ticket mutations.
- Express-vs-Next body parity for any sensitive ticket endpoint.
- Remaining Express registrations outside Tickets module.
