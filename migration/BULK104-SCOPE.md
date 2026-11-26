# Bulk104 scope and limitations

## Complete source audit inventory, NOT complete migration

- The CSV in `migration/phase57-express-endpoints.csv` contains **516 original Express HTTP registrations**.
- Run `npm run api:inventory` and `npm run api:matrix` to generate full static reports under `migration/reports/`.
- Each of the 516 routes appears in `bulk104-endpoint-matrix.csv` and `.json` with one of these statuses:
  - `STATIC_ROUTE_SHAPE_CANDIDATE`: compatible Next method and URL-shape found, **not business parity verified**.
  - `NO_MATCHING_LOCAL_METHOD`: module has a proposed explicit target, but no compatible method+path exists.
  - `NO_EXPLICIT_ROUTE_MAPPING`: original module requires detailed manual/API mapping.
- **Every row has `parity_verified=false`.** Original headers, permissions, response formats and business logic are not inferred to match.

## Bulk104 changes: broad Admin CRUD surface

The following eight model-backed Admin modules have new and/or extended endpoints under `/admin/api/local/`:

| Resource | list | count | server-side | detail | create | edit | status | delete | bulk-delete |
|---|---|---|---|---|---|---|---|---|---|
| Roles | yes | yes* | yes | yes | yes** | yes** | yes** | soft** | soft** |
| Activities | yes | yes | yes | yes | yes** | yes** | yes** | soft** | soft** |
| Core Activities | yes | yes | yes | yes | yes** | yes** | yes** | soft** | soft** |
| Applications | yes | yes | yes | yes | yes** | yes** | yes** | soft** | soft** |
| Membership Plans | yes | yes | yes | yes | yes** | yes** | yes** | soft** | soft** |
| Interest Subcategories | existing | existing | yes | existing | yes** | yes** | yes** | blocked 409** | blocked 409** |
| Shortcut Menus | existing | existing | yes | existing | yes** | yes** | yes** | soft** | soft** |
| Contacts | yes | yes | yes | yes | no (email side effects) | no | no | soft** | soft** |

`*` No `/count` endpoint exists in Express Roles, but added for consistent local admin listing.
`**` Mutations default disabled. Every mutation requires signed Admin cookie, same-origin, `LOCAL_ADMIN_BULK104_WRITES_ENABLED=true`, and input validation before database access. **Do not enable against production data until tested in an isolated DB.**

Also added protected `GET /admin/api/local/core-activities/colors` and `GET /admin/api/local/activities/coreactivity/[id]`.

**Semantic differences from Express:** Deletion only soft-deletes supported models; hard-delete is deliberately omitted. Contact creation is omitted because original sends SMTP emails. General `server-side` pagination/filter response is a preliminary contract (date filters, joins and special report columns are not yet mapped). No file upload, email send, side effects, restore flows, or frontend API rewiring was added. No source React files, database schema or data were changed.

## Run on Windows in your existing Next.js folder

```powershell
npm run test:api:bulk104
npm run test:api:foundation
npm run api:inventory
npm run api:matrix
npm run build
# Start npm run dev; in a second PowerShell terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk104.ps1
```

This anonymous security test expects JSON `401` on every protected API; it does **not** establish authenticated or DB parity. Do not assume 516 legacy registrations minus 204 local method exports equals a true count of remaining APIs. The URL structures differ, some paths are aliases and dynamic routes can handle multiple business cases.
