# SourceIndia Bulk76 – Seller Product Management (isolated local APIs)

Base: Bulk75 full project. No existing UI or live API calls replaced. No new npm dependencies, DB schema changes or migrations.

## New local endpoints (require locally issued JWT, not legacy live login token)

- `GET /api/local/products/me/{id}`: own seller product (read-only).
- `PATCH /api/local/products/me/{id}`: own product basic text/quantity fields only. JSON whitelist: `title`, `code`, `article_number`, `short_description`, `description`, `quantity`. It does **not** change slug, category, approval/status, attachments, keyword associations or image references.
- `DELETE /api/local/products/me/{id}`: sets `products.is_delete=1` only for the signed-in seller's product. **Changes database data**; do not test on valuable records. No physical deletion or schema changes.

All methods require `Authorization: Bearer <locally-issued JWT>`, a valid active seller account and a product belonging to the user's linked company. 401 invalid login, 403 non-seller, 404 not owned/missing, 400 invalid ID or update fields, 503 DB error.

## Verification

`node --experimental-strip-types --test src/lib/localSellerProductManagement.test.mjs` – 6 tests passing with Node 22 (Node 24 supports TS stripping). This is a contract/SQL test, not a live DB integration test.

`npm run build` requires installed node_modules in the user's project and must be run before deployment. Run `npm run dev` for manual testing. Avoid write/delete tests on production database.

## Still missing

Legacy create/update APIs carry additional associations, slug generation, image uploads, status/approval logic, notifications, and admin workflows. These are NOT implemented by this isolated set. Existing frontend remains on live API. Full DB/auth integration and complete legacy parity are pending.
