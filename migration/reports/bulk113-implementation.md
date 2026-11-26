# Bulk113 — Actual implementation: legacy file metadata GET routes

Implemented **two** read-only Next.js endpoints using the original Express `fileController` and `UploadImage` model contract:

- `GET /api/local/files` → ordered file metadata array (legacy `/v2/api/files/`)
- `GET /api/local/files/:id` → one file metadata object or HTTP 404 (legacy `/v2/api/files/:id`)

Database `upload_images` primary key is `upload_image_id`, returned as `id`, matching the original Sequelize model. The SQL explicitly selects `uuid`, `file`, `created_at`, `updated_at` and uses bound ID parameters. No filesystem access, upload, deletion, or database write occurs. Both routes return HTTP 503 if local DB is unavailable. Existing routes remain unchanged.

## Verification

`node --test scripts/bulk113-files.test.mjs` → 8/8 PASS (source-contract checks). No live database or Next production build run in this environment; verify on user's configured local MySQL and Next install. Existing 516-route inventory is not a parity certification.
