# BULK130 — Contacts and Front Menu write parity audit

Original controller sources examined from the original `sourceindia-main-new` backend archive: `contactsController.js`, `frontMenuController.js`, and Sequelize model definitions. Original source and database unchanged.

## Implemented correction

- Contacts `POST /v2/api/contacts/`: after database commit, when an email template message is empty or NULL, the generated admin/user notification HTML now uses the same fallback text as the original Express controller instead of the literal text `null`/blank. SMTP QA recipient allowlist and security guard remain unchanged.
- Added mock-based tests for Contacts hard delete, bulk soft delete, delete-status update, invalid bulk IDs, and fallback email HTML. These tests never connect to a real DB or SMTP server.

## Method/path coverage reviewed

| Module | Method | Original route | Local status |
|---|---|---|---|
| Contacts | POST | `/v2/api/contacts/` | Native, QA-gated |
| Contacts | PATCH | `/v2/api/contacts/:id/delete_status` | Native, QA-gated |
| Contacts | DELETE | `/v2/api/contacts/:id` | Native, QA-gated |
| Contacts | DELETE | `/v2/api/contacts/delete-selected` | Native, QA-gated |
| Front Menu | POST | `/v2/api/front_menu/` | Native, QA-gated |
| Front Menu | PUT | `/v2/api/front_menu/:id` | Native, QA-gated |
| Front Menu | PATCH | `/v2/api/front_menu/:id/is_show` | Native, QA-gated |
| Front Menu | PATCH | `/v2/api/front_menu/:id/status` | Native, QA-gated |
| Front Menu | DELETE | `/v2/api/front_menu/:id` | Native, QA-gated |

## Still not proven

- Functional write parity requires controlled DB snapshots and server-side state comparisons after the same authorized write against both backends. These tests cannot safely run against the user's existing database and have **not** run here.
- Contacts SMTP template and recipient behavior is mock-tested; actual SMTP sandbox delivery **not** tested.
- Existing production write default-deny remains in place; production write readiness **not verified**.
- Full Next.js `npm run build` requires installed project dependencies and has **not** been run in this environment.

Run `npm run test:api:bulk130`, then `npm run build` on Windows. Preserve `.env.local`, `.git`, and `node_modules` when extracting the ZIP.
