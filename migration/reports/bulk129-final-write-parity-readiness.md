# BULK129 — Contacts & Front Menu write contract correction / isolated-QA readiness

## Ground truth and results
- Original Express source inspected read-only: `legacy/sourceindia-express/controllers/{contactsController,frontMenuController}.js` and corresponding Sequelize models.
- 9 previously implemented native Next.js mutation route exports remain present.
- Contacts: previous batch corrected save-before-email ordering; SMTP and DB write side effects are still **not** validated against an isolated live Express QA instance.
- Front Menu: source differences corrected in this follow-up: `parent_id` / `position` default to 0 on create, omitted fields are preserved on PUT, JSON and `application/x-www-form-urlencoded` numeric fields accepted. Duplicate form keys are denied for safety.
- Source/mock regression test: `npm run test:api:bulk129` — 34 / 34 PASS in packaging environment.
- `npm run test:api:bulk129:qa-readiness` checks QA token, local DB name, SMTP allowlist and `INFORMATION_SCHEMA` before any real write tests. The readiness check itself is read-only and never sends email.
- Typescript syntax checks pass for changed module; full Next.js production build not executed in this environment (node_modules unavailable).

## Deliberate safety boundaries
- Production and ordinary development DB writes remain disabled; explicit QA flags, isolated QA DB name, localhost DB host, and long Bearer token required.
- SMTP requires explicit allowlist and QA sender/admin addresses. A QA SMTP sink is preferable to real mail delivery.
- Original Express may accept malformed or unsafe inputs that this implementation rejects; this is an intentional validation difference, so **full byte-for-byte write parity cannot be claimed**.
- Real MariaDB write/read-back, rollback, SMTP delivery, side-effect and delete parity against the legacy controller are **not verified**. There is no truthful 9/9 real write-parity PASS result.
- Never copy production records into a write-enabled QA instance without a sanitization plan. Do not enable write flags on a live DB.

## Windows validation
```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk129
npm run build
npm run test:api:bulk129:qa-readiness
```

Expected readiness result on a normal local environment with no isolated QA fixture is `NOT READY`; this is a safe precondition finding, not a failed application build. Do not turn on QA flags merely to force a green status. Before any live write comparisons, use an independent disposable MariaDB schema, outbound email sink, and fixture-only data.

## 9 outstanding full write-parity paths
- `POST /v2/api/contacts/`
- `PATCH /v2/api/contacts/:id/delete_status`
- `DELETE /v2/api/contacts/:id`
- `DELETE /v2/api/contacts/delete-selected`
- `POST /v2/api/front_menu/`
- `PUT /v2/api/front_menu/:id`
- `PATCH /v2/api/front_menu/:id/is_show`
- `PATCH /v2/api/front_menu/:id/status`
- `DELETE /v2/api/front_menu/:id`
