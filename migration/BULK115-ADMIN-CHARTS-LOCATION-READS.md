# BULK115 — 40 Admin GET + 6 legacy-location GET routes

## Scope and source

Baseline: `sourceindia-bulk114-consolidated-public-catalog-taxonomy-full-project.zip`. Original Express reference was read-only in `sourceindia-main-new (1).zip`: `backend/routes/{categories,subCategory,itemCategory,itemSubCategory,items,keywords,location,faq,faqCategory,knowledgeCenter,testimonial,seoPages,frontMenu,interestCategories,ticketCategory}Routes.js`, their controllers, and corresponding Sequelize models. **The original React/backend files were not changed. No SQL database schema or records were changed.**

The 46 added route files contain only `GET` and use parameterized SQL and statically constrained table/column names. All 40 Admin routes require the existing signed `/admin` session cookie (`authorizedAdminFaq`). They do not accept a public user JWT as Admin. New Admin APIs use bounded *local* response contracts; do not treat them as verified 1:1 Express responses. Existing Admin, buyer, seller and public APIs were not overwritten or rewired.

### Admin GETs (40 new paths)

- **9 server-side/count paths:** `/admin/api/local/{ticket-categories,testimonials,faqs,knowledge-center,interest-categories,seo-pages,front-menu}/server-side`, plus `/admin/api/local/faqs/categories/server-side` and `/admin/api/local/faqs/count`. Returned JSON is `{data,totalRecords,filteredRecords,page,limit}` (count has `{total}`), **not** the original DataTables response format.
- **11 charts:** `/admin/api/local/{product-categories,product-subcategories,item-categories,item-subcategories,product-keywords,items}/product-bar-graph`, except any family not in the route map; seller graphs for product categories and product subcategories; sourcing-interest graphs for item categories, item subcategories and product keywords. Source-shaped `{labels,datasets}`. Approved/unapproved product counts or distinct seller/buyer user counts are grouped using verified model field mappings. Labels capped at 500; unbounded legacy behavior is deliberately not reproduced.
- **20 catalog/keyword hierarchy lists:** Category family `product-categories`, `category-item`, `sub-category-item`, `item-category`, `sub-items`, `items`; subcategories `category/[category]`, `category-all/[category]`; item categories `getitem`, `by-category-subcategory`, `by-category-subcategory-all`, `getitemtype`; item subcategories `by-category-subcategory-itemcategory`, `...-all`; product keywords `all`, `by-category-subcategory-itemcategory`, `...-all`, `by-subcategory`; items `by-category-subcategory-itemcategory-itemsubcategory`, `...-all`. Returned JSON is `{data,pagination:{page,limit,total}}`. List SQL uses `status=1` for active mode, `is_delete=0` when model supports it, and `all` means include inactive records but exclude deleted ones. Search `q`, `page` and `limit` are validated, max limit=100, max page=1000. The original Express controllers sometimes return Sequelize associations, complete model rows, HTTP 404 on empty results, or different filters: **these local endpoints are not drop-in replacements**.

For the exact 40 Admin paths, see `migration/reports/bulk115-admin-route-map.json`. Keyword-hierarchy routes that select `item_subcategory` are intentionally mapped to that entity because original `productKeywordsController` uses it despite the URL containing `keywords`. `by-subcategory/[id]` queries actual `product_keywords` and supplies the original `is_used` flag.

### Original-path location GETs (6)

New routes are directly on `/v2/api/location/`: `countries`, `states`, `cities`, `states/[country_id]`, `cities/[state_id]`, `pincode/[pin]`.

The plain lists return original-style JSON arrays with model `id` aliases. `states/[country_id]` also computes approved product counts and distinct approved seller-company counts by state; it validates up to 30 distinct filter IDs per filter for category, subcategory, item category and item subcategory. This is similar to original Express aggregation but exact parity with category relationships and all edge cases remains unverified. PIN uses the original third-party postal endpoint with **HTTPS certificate verification enabled**, 7s timeout and strict 6-digit validation; it may return 502 when the external service cannot be reached. No insecure TLS overrides are carried over.

### Test results and limits

- `npm run test:api:bulk115`: **11/11 pass** for route count/GET-only, session guard source, fixed schema/SQL protections, validations, keyword mapping and generated TypeScript syntax in the packaging environment (using global TypeScript).
- `npm run test:api:bulk114`: **10/10 pass** regression.
- **NOT run here:** Next 16 production build (packages/`node_modules` not present in packaging environment); MySQL `INFORMATION_SCHEMA` preflight and live GET HTTP smoke (your Windows `.env.local` and local database service are unavailable here); authenticated Admin response contracts; browser UI parity and full 516 legacy endpoint parity.

### Windows verification

Preserve existing `.env.local`, `.git`, `node_modules`, backups. Extract full ZIP into `E:\nextjs\sourceindia-next-new`. Do not extract into `D:\sourceindia`. If needed use `npm ci` in the Next directory, then:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk115
npm run test:api:bulk114
npm run build
npm run dev
```

Open a separate PowerShell terminal **after `npm run dev` is ready**:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk115.ps1
```

Combined script performs 11 source contract groups, 22 table schema checks (INFORMATION_SCHEMA, read-only), and 10 GET-only HTTP checks. HTTP checks without Admin cookie intentionally expect HTTP 401 for Admin paths; this does **not** verify authenticated Admin data. If any schema/SQL mismatch appears, report the exact FAIL line instead of changing the local DB. The script does not send writes or emails.
