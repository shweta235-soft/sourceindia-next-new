# BULK135 — Shortcut Menus

Source comparison: `legacy/sourceindia-express/routes/shortcutRoutes.js`, `controllers/shortcutController.js`, `models/Shortcut.js`. Original mount: `/v2/api/shortcut`.

| Method | Route | Native implementation | Verification |
|---|---|---|---|
| GET | `/v2/api/shortcut/shortcut_menus` | `listShortcuts` | Source check passes; real MySQL comparison pending |
| POST | `/v2/api/shortcut/shortcut_menus` | `createShortcut` | QA-gated; real write parity pending |
| PUT | `/v2/api/shortcut/shortcut_menus/:id` | `updateShortcut` | QA-gated; real write parity pending |
| DELETE | `/v2/api/shortcut/shortcut_menus/:id` | `deleteShortcut` | QA-gated soft-delete; real write parity pending |

Preserved: `shortcut_id AS id`, `uuid`, `is_delete=0` listing, `name/link` search, status query, primary-key ascending order, success/error response messages, no physical deletion. `created_at` and `updated_at` converted to UTC ISO to approximate Sequelize output; validate using supplied parity comparator.

Production writes are deliberately gated. **Do not change existing DB_NAME or enable QA write flags on a real shared database.** Original Express source is preserved read-only. Neither authenticated SMTP operations nor actual DB writes were performed. Static/source tests do **not** prove live parity.

Validation: `npm run test:api:bulk135`; `npm run build`; with dev server running, `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk135.ps1` and `npm run test:api:bulk135:parity`.

## BULK135 read-parity diagnostic follow-up (2026-11-28)

Windows comparison reported `MATCH=1 DIFF=3 ERROR=0`, for normal list and `status=1`/`status=0` queries. The no-match search case returned MATCH. The original comparator logged only root JSON types; this is insufficient to establish the cause of differences. The revised comparator prints the first 12 differing JSON paths and, where date fields differ, an aggregate date offset in minutes, **without printing response bodies or user data**. No native response, SQL, database or frontend changes were made in this diagnostic-only update. Re-run `npm run test:api:bulk135:parity` with `npm run dev` running, and use the reported `fields=` to implement an evidence-based fix. Do not mark BULK135 GET parity verified until it yields `MATCH=4 DIFF=0 ERROR=0`.
