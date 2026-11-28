# BULK132 — Contacts + Front Menu write contract follow-up

## Source evidence
- Original `legacy/sourceindia-express/controllers/frontMenuController.js` enforces `is_show !== 0 && is_show !== 1` and `status !== 0 && status !== 1` as invalid (HTTP 400), so string values `'0'` or `'1'` do not pass.
- Previously native `src/lib/localBulk128FrontMenu.ts` coerced numeric strings through `smallInteger`, erroneously allowing PATCH requests Express rejects.

## Changes
- Scoped **only** to `updateMenuFlag` (PATCH `/v2/api/front_menu/:id/status`, `/v2/api/front_menu/:id/is_show`). Requires native JSON number 0 or 1, preserving original 400 messages.
- Added `scripts/bulk132-front-menu-flag-parity.test.mjs` with original-source assertions, negative JSON / URL-encoded cases, positive numeric JSON transaction cases, and production default-deny check.
- Added `npm run test:api:bulk132` chaining BULK131 regressions and the 5 new tests.
- Contacts implementation and other Front Menu methods are unchanged.

## Validation limitations
- Mocked tests verify exact validation and SQL guard behavior, **not** actual MySQL write response parity.
- Existing SourceIndia database and original React/Express reference remain untouched.
- Full Next.js build and QA database/SMTP side effects remain unverified in this environment. Production writes remain disabled.
