# BULK131 — Contacts and Front Menu source-confirmed write-contract corrections

## Verified differences and fixes

1. **Front Menu type validation**: original `legacy/sourceindia-express/models/FrontMenu.js` defines `type` as an INTEGER with no Sequelize `isIn: [1,2]` constraint (the `1 = Header, 2 = Footer` is a comment). `src/lib/localBulk128FrontMenu.ts` erroneously accepted only 1 or 2. BULK131 now requires a non-negative safe integer instead. The existing `parent_id` and `position` defaults remain 0.
2. **Contacts notification fallback subject**: original `legacy/sourceindia-express/controllers/contactsController.js` uses `New Contact from ${fname} ${lname}` if template 61 has no subject. `src/lib/localBulk127Contacts.ts` formerly used `New Contact`. BULK131 now uses the original fallback subject. The QA SMTP recipient allowlist and production write guards remain unchanged.

## Verification

- `npm run test:api:bulk130`: 39/39 PASS (mock/source tests)
- `node --test scripts/bulk131-contact-menu-contract.test.mjs`: 4/4 PASS
- `npm run test:api:bulk131`: 43/43 combined PASS
- Neither original Express files nor database records have been modified.
- Actual authenticated MySQL/SMTP write response and side-effect parity is **not verified**. Production write endpoints remain default-denied. A full `npm run build` is not executed in this environment because the complete Next.js dependency tree is not installed; run it on the Windows machine.

## Follow-up plan

Contacts: `POST /v2/api/contacts/`, `PATCH /v2/api/contacts/:id/delete_status`, `DELETE /v2/api/contacts/:id`, `DELETE /v2/api/contacts/delete-selected`.
Front Menu: `POST /v2/api/front_menu/`, `PUT /v2/api/front_menu/:id`, `PATCH /v2/api/front_menu/:id/is_show`, `PATCH /v2/api/front_menu/:id/status`, `DELETE /v2/api/front_menu/:id`.
Review actual Express handler database and email side-effect parity in a separate non-production environment; original schema and data must remain protected.
