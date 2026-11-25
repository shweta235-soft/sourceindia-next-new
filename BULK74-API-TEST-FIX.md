# Bulk74 API URL compatibility and verification

The previous test instructions used URL paths that were not present in the archive, causing 404 responses. This update adds safe compatibility routes while preserving canonical APIs:

| Purpose | Canonical route | Compatibility route |
|---|---|---|
| Product list | GET `/api/local/catalog/products` | GET `/api/local/products` |
| Category list | GET `/api/local/catalog/categories` | GET `/api/local/categories` |
| Subcategory list | GET `/api/local/catalog/categories/1/subcategories` | GET `/api/local/subcategories?categoryId=1` |
| Product detail | GET `/api/local/catalog/products/EXISTING-SLUG` | no alias |

Subcategories require a real category ID from the category list. Calling `/api/local/subcategories` **without** `categoryId` returns HTTP 400 by design, not a database failure.

## Checking responses

1. Preserve your existing `.env.local` and run `npm run build` (no new packages required).
2. Run `npm run dev` and open the canonical product and category URLs above.
3. If JSON returns HTTP **503** and `Local database not configured`, configure `DB_HOST`, `DB_USER`, `DB_PASSWORD` (can be blank when applicable), and `DB_NAME` in `.env.local`, then restart Next.js. This is a server setting and should not be pasted into chat.
4. If JSON returns HTTP **503** and `temporarily unavailable`, inspect the server terminal for a connection/schema issue. The API intentionally does not reveal SQL errors to browsers. Verify configured DB credentials and schema on your machine; no database writes are performed by these GET routes.
5. If HTTP **200**, inspect `products`, `categories`, or `subcategories` JSON. An empty array is permitted.
6. If HTTP **404**, verify that the new project ZIP is applied and the server was restarted.

These are local APIs, *not* the existing live-API-backed frontend. Passing UI regression testing does not verify that local DB access works. No current local DB connection is available in this environment to verify response data. Do not share credentials or tokens.
