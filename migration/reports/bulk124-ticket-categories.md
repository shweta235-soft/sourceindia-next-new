# BULK124 — Ticket Categories native Next.js API conversion

Original React/Express **read-only reference**: `legacy/sourceindia-express/routes/ticketCategoryRoutes.js`, `controllers/ticketCategoryController.js`, `models/TicketCategory.js`. The 9 method/path registrations were verified against that source.

| Method | Exact original URI | Next.js handler | Notes |
|---|---|---|---|
| GET | `/v2/api/ticket_categories/` | `getCategories` | ASC id; includes original virtual `getStatus` |
| GET | `/v2/api/ticket_categories/count` | `getCategoryCount` | `{total}` |
| GET | `/v2/api/ticket_categories/server-side` | `getCategoryGrid` | `{data,totalRecords,filteredRecords}`; bounded page/limit |
| GET | `/v2/api/ticket_categories/:id` | `getCategoryDetail` | 404 message preserved |
| POST | `/v2/api/ticket_categories/` | `createCategory` | **Disabled by default**, isolated QA only |
| PUT | `/v2/api/ticket_categories/:id` | `updateCategory` | **Disabled by default**, isolated QA only |
| PATCH | `/v2/api/ticket_categories/:id/status` | `statusCategory` | **Disabled by default**, isolated QA only |
| DELETE | `/v2/api/ticket_categories/:id` | `deleteCategory` | **Disabled by default**, isolated QA only |
| DELETE | `/v2/api/ticket_categories/delete-selected` | `deleteCategories` | **Disabled by default**, isolated QA only |

All nine routes are implemented in native Next.js TypeScript and call MySQL directly rather than through the legacy Express compatibility bridge. Original controller response labels, table/PK mapping and list/count/grid structure were used as the implementation baseline. **This does NOT establish all nine endpoints are 1:1 functionally verified.** The original Express controller has no per-route auth on writes; the native QA layer intentionally adds a stronger write gate and conservative request validation. Full write parity, particularly failure semantics and DB side effects, is unverified.

Safety: Production writes denied unconditionally. Non-production writes require `SOURCEINDIA_TICKET_CATEGORY_WRITES_ENABLED=1`, database on localhost, exact isolated DB name `SOURCEINDIA_TICKET_CATEGORY_QA_DB_NAME` containing `qa`, `test`, or `sandbox`, and a separate random bearer secret `SOURCEINDIA_TICKET_CATEGORY_QA_TOKEN` (at least 32 characters). **Do not set these on a live or production DB.** No destructive write tests were run.

Verification performed in the packaging environment: 11 BULK124 structural/mock tests PASS; 36 prior BULK123 tests PASS; TypeScript syntax/transpile check PASS. The container does not have installed Next.js project dependencies and no real MySQL server; full production build, DB schema preflight, HTTP behavior, Express differential response comparison and authorized-write QA testing must run on the user's Windows environment. Do not interpret success on read-only/default-deny HTTP tests as write parity.

Windows commands:

```powershell
npm run test:api:bulk124
npm run test:api:bulk124:db
npm run build
npm run dev
# In a second PowerShell terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk124.ps1
npm run test:api:bulk124:parity
```

Read-only Express differential test compares a fixed 4 GET cases and adds an existing `:id` if there is a row. It prints only statuses, structural field paths and MATCH/DIFF counts — not data values. Dates, query semantics and SQL results must be reconciled based on any observed DIFF.

Next proposed BULK125: `knowledgeCenterRoutes.js` / `knowledgeCenterController.js`; inspect `GET/POST /v2/api/knowledge_center/`, `GET /count`, `GET /server-side`, `GET/PUT/DELETE /:id`, `DELETE /delete-selected`, `PATCH /:id/status` and `PATCH /:id/delete_status` against confirmed mount spelling before implementation.
