# Bulk74 query parameter fix

The three API routes now execute once database credentials are configured. Product listing and the subcategory compatibility route formerly rejected tracking query parameters automatically added to links (e.g. `utm_source=chatgpt.com`).

Changes:
- `src/lib/localCatalog.ts` accepts only known standard `utm_*` attribution keys in product listing without loosening `page` or `limit` validation.
- `src/app/api/local/subcategories/route.ts` accepts the same attribution keys while still requiring exactly one valid `categoryId`.
- No schema/data changes and no new dependencies. Original catalog routes, Admin/Seller/Buyer UI remain unchanged.

Verification: static contract and parser tests. The project needs local `npm run build` and live DB API checks in the Windows environment.

API test URLs (type them directly into address bar):
- http://localhost:3000/api/local/products
- http://localhost:3000/api/local/categories
- http://localhost:3000/api/local/subcategories?categoryId=1

Remember: subcategory ID 1 is only an example; use a real category ID from the categories response.
