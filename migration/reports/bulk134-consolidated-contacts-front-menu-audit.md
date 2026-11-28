# BULK134 consolidated Contacts + Front Menu write review

## Scope
Contacts four write methods: POST /v2/api/contacts/, PATCH /v2/api/contacts/:id/delete_status, DELETE /v2/api/contacts/:id, DELETE /v2/api/contacts/delete-selected.
Front Menu five writes: POST /v2/api/front_menu/, PUT /v2/api/front_menu/:id, PATCH /v2/api/front_menu/:id/status, PATCH /v2/api/front_menu/:id/is_show, DELETE /v2/api/front_menu/:id.

## Concrete corrections made in BULK134
- Original Contacts controller passes submitted `email` into `Contacts.create` without lowercasing. Native contact creation now preserves submitted address case in DB insert, response and recipient, while QA allowlist match remains case-insensitive.
- Original Front Menu controller passes submitted `name` directly into `FrontMenu.create` and instance update. Native input now preserves user-entered leading/trailing whitespace, while still rejecting empty/whitespace-only names.
- Added two mocked end-to-end handler regressions and four original-vs-native source contract tests.

## Existing safeguards and verified results
- Existing isolated-QA write gates preserved, including production-deny policy and authorizing bearer tokens. No persistent DB or live SMTP tests performed in this build.
- BULK127 Contacts GET: previously reported 5/5 response comparisons matching, not retested in this build.
- BULK128 Front Menu GET: previously reported 5/5, and search: 8/8 matching, not retested in this build.
- BULK134 source/mock test command: `npm run test:api:bulk134`.

## Remaining externally dependent acceptance criteria (NOT VERIFIED)
1. Exact authenticated write request/response parity against original Express on disposable test fixtures.
2. Real SQL side-effects, transaction failures and subsequent reads against an isolated test database.
3. Contacts email templates/from/recipient behavior with a sandbox SMTP sink; production contact delivery uses mailHelper/site settings and is not proven identical to the QA transport.
4. Functional live write enablement. Current production safety policy deliberately denies writes: existing React frontend cannot use these as drop-in production write equivalents yet.

The module is **not certified 1:1 production-ready**. Do not enable QA write flags against the existing application database. Do not run destructive parity tests against real data.

## Next module
BULK135: original `shortcutRoutes.js` mounted at `/v2/api/shortcut`:
- GET `/v2/api/shortcut/shortcut_menus`
- POST `/v2/api/shortcut/shortcut_menus`
- PUT `/v2/api/shortcut/shortcut_menus/:id`
- DELETE `/v2/api/shortcut/shortcut_menus/:id`
