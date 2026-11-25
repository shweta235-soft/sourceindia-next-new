# SourceIndia Bulk75 – Catalog detail and count API batch

Built on the Bulk74 tracking-params fix. Added six read-only MySQL-backed APIs based on original Products, Categories, and SubCategories Sequelize models:

| Endpoint | Function |
| --- | --- |
| `GET /api/local/catalog/products/by-id/123` | Public approved product by numeric product ID |
| `GET /api/local/catalog/categories/by-id/1` | Active category by ID |
| `GET /api/local/catalog/subcategories/by-id/1` | Active subcategory with active parent |
| `GET /api/local/catalog/products/count` | Number of approved, active, nondeleted products |
| `GET /api/local/catalog/categories/count` | Number of active, nondeleted categories |
| `GET /api/local/catalog/subcategories/count` | Number of active, nondeleted subcategories with active parents |

Existing slug detail, listing and nested subcategory routes remain intact. No database schema or frontend/live API changes. No new npm dependencies. No write operations.

## Local tests

`node --experimental-strip-types --test src/lib/localCatalogBulk75.test.mjs` (Node 22) or `node --test src/lib/localCatalogBulk75.test.mjs` (Node 24)

Run `npm run build` after extracting the full project; then start `npm run dev` and check the count URLs first. Test detail URLs with real IDs retrieved from existing listing responses. A 404 for an inactive/nonexistent record is expected. Database tests and full build must be checked on the user's local database.

This is a *consolidated catalog batch*, not a claim that all original Express APIs have migrated. Original write routes, upload workflows and frontend cutover remain pending.
