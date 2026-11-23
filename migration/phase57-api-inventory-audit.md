# Phase 57 — SourceIndia API Inventory & Authentication Audit

**Baseline:** full Next.js Phase 56 *TypeScript Fix v2* ZIP (user reported build passing), and original `sourceindia-main-new` React/Express ZIP. **Audit date:** 23 November 2026.

## Scope and important distinction

This is a **source-code inventory**, not an API migration and not a live/API/database test. No code, API, database schema, or data has been changed in this phase. Original React/Express archive was read-only. All Phase 56 project files are retained in the deliverable ZIP.

## Inventory snapshot

- Original Express backend: **48 route files**.
- Static scan found **516 Express method/path registrations** across mounted routers (**{'GET': 270, 'POST': 93, 'DELETE': 62, 'PUT': 33, 'PATCH': 58}**). Alias mount registrations are counted separately. Complex/dynamic routing may require manual inspection; do not treat this as an exhaustive executable-route total.
- Next.js project: **22 `route.ts` files** and **25 exported HTTP method handlers** by static scan (**{'GET': 19, 'POST': 5, 'DELETE': 1}**).
- A Next.js route that forwards requests to an existing live Express API is a **proxy/integration handler**, not proof that the equivalent API and business logic have been migrated to Next.js/locally connected MySQL.
- Inventory CSVs contain exact source paths for verification.

## Authentication & authorization findings

1. Original `backend/routes/usersRoutes.js` exposes `POST /v2/api/users/login`, `POST /v2/api/users/send-login-otp`, `POST /v2/api/users/verify-login-otp`, `GET /v2/api/users/profile` (with `authMiddleware`), and `POST /v2/api/users/change-password` (with `authMiddleware`). `usersRoutes` is also mounted under `/v2/api/signup`.
2. Existing Next.js `src/app/api/admin-session/route.ts` issues a signed, HttpOnly admin cookie **after calling the configured upstream `/admin/login`**; this is an authentication integration, **not** a replacement for the original admin user/password verifier.
3. Existing Next.js `src/app/api/account/products/route.ts` and `src/app/api/account/enquiries/route.ts` check the provided Bearer token by calling upstream `signup/profile`, then use upstream product/enquiry APIs. Their ownership checks are useful but currently depend on live API responses.
4. Original Express `POST /v2/api/users/impersonate-login` exists. Do **not** enable Next.js impersonation from a UI-only placeholder. Before migration, establish authorization, token audience/scope, expiry, audit logs, and explicit privileged-user checks.
5. A source scan alone cannot establish that every original Express endpoint has an authorization middleware. Review method-specific middleware in the legacy router/controller and add negative access tests before exposure.
6. Preserve existing DB schema and records; do not copy `.env` secrets, disable authorization, or expose password columns in API responses.

## Proposed API migration order (Part 2)

| Batch | Scope | Acceptance criteria |
|---|---|---|
| 58 | Auth and API contracts | Map login/OTP/session/profile endpoints, cookie/token storage and error contracts; build tests before implementing mutations |
| 59 | Reference/public data | Settings, categories, subcategories, items, locations, company/product public reads; cache behavior and response parity |
| 60 | Buyer/seller accounts | Profile, company, registration, OTP, role/access rules; matching UI/error handling |
| 61 | Enquiry/product workflows | Seller product CRUD, buyer enquiry creation, message send, approvals, ownership and idempotency |
| 62 | Support system | Create ticket OTP, ticket retrieval, replies, file uploads and limits |
| 63+ | Admin modules | Roles, sub-admin, settings, catalog, reports, mail and audit logs with secure access and integration tests |

**Recommended next implementation step:** Phase 58 — detailed authentication API contract and authorization tests, *not* immediate deletion or replacement of the upstream APIs. Before any database-writing implementation, confirm DB configuration safely in the target environment and verify data integrity controls.

## Known limitations

- Count is a regex-based static inventory; computed routes, nested routers, or `.route(...).get(...)` calls may not be counted.
- Original API middleware behavior and controllers need route-by-route review before claiming feature parity.
- No live API calls, browser checks, `npm run build`, or database connections ran as part of this inventory. The user's earlier Phase 56 build pass remains the latest build verification.
- Next.js user login and other public APIs may be called directly from frontend components and therefore won't appear in the Next.js Route Handlers count. This inventory is not a count of all runtime network requests.
