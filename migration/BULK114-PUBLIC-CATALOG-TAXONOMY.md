# Bulk114: consolidated public taxonomy (22 new GET route files)

## Source evidence

Read-only original: `backend/routes/{subCategory,itemCategory,itemSubCategory,items,keywords}Routes.js` and `backend/models/{SubCategories,ItemCategory,ItemSubCategory,Items,ProductKeyword}.js`. Original controller functions include `getSubCategoriesByCategory`, `getItemCategoriesByCategoryAndSubCategory`, `getItemSubCategoriesByCategorySubCategoryItemCategory`, `getItemSubCategoriesByCategorySubCategoryItemCategoryItemSubCategory`, `getKeywordsBySubcategoryId` and their list/detail/count variants.

The local endpoints are NEW Next.js internal contracts, not one-to-one legacy `v2/api` path or response migrations. The public filter `status=1 AND is_delete=0` and an active parent chain prevent leaking inactive/deleted catalog nodes; Express admin list endpoints sometimes expose inactive nodes, so they are **not equivalent**. Original import, export, create/update/delete/status workflows are not implemented here. Existing Admin CRUD routes (where present) remain unchanged.

## Implemented new local GET routes

| Resource | Paths relative to `/api/local/catalog/` |
|---|---|
| Subcategories | `subcategories` (search/filter/pagination) |
| Item categories | `item-categories`, `item-categories/count`, `item-categories/by-id/[id]`, `item-categories/by-category/[categoryId]`, `item-categories/by-category-subcategory/[categoryId]/[subcategoryId]` |
| Item subcategories | `item-subcategories`, `item-subcategories/count`, `item-subcategories/by-id/[id]`, `item-subcategories/by-item-category/[itemCategoryId]`, `item-subcategories/by-hierarchy/[categoryId]/[subcategoryId]/[itemCategoryId]` |
| Items | `items`, `items/count`, `items/by-id/[id]`, `items/by-item-subcategory/[itemSubcategoryId]`, `items/by-hierarchy/[categoryId]/[subcategoryId]/[itemCategoryId]/[itemSubcategoryId]` |
| Product keywords | `product-keywords`, `product-keywords/count`, `product-keywords/by-id/[id]`, `product-keywords/by-item-subcategory/[itemSubcategoryId]` |
| Taxonomy aggregate | `taxonomy/summary`, `taxonomy/search?q=electronic` |

The list endpoints accept only allowed `categoryId`, `subcategoryId`, `itemCategoryId`, `itemSubcategoryId` filters for their family, `page` (default 1, max 1000), `limit` (default 20, max 50), and optional search `q` (3–60 Unicode letters, marks, numbers, basic punctuation). URL route IDs are validated and cannot be overwritten by query params. SQL is parameterized, order is deterministic by ID, and no request can set table/column/order names.

## Local setup and verification

1. Extract the complete ZIP over the Next project after making your own backup. **Preserve `.env.local`, `.git`, `node_modules`.** The original React project must not be modified.
2. `npm run test:api:bulk114` verifies contract and route source behavior without a DB.
3. `npm run build` checks Next16 and TypeScript on your Windows install.
4. Run `npm run dev`, and in a separate PowerShell terminal run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk114.ps1`. This performs 10 source, 6 schema, 14 GET-only HTTP checks. **Do not enable write flags.** No password prompt.
5. If local MySQL has schema differences in `items` or `product_keywords`, the schema preflight prints the exact missing columns; report output so the code can be corrected without changing the DB.

## Tested vs untested

- 10/10 structural/SQL contract test groups passed in the packaging environment. This includes 22 route export checks, limits/validation, SQL-read-only assertions, parameterized hierarchy filters, and parent-visibility predicates.
- Full production build **not verified** here: the model environment's `node_modules` entries contain no actual module files. Live database schema and HTTP tests **not run** here due to lack of the Windows `.env.local`/MySQL service.
- No client UI was switched from live API to these new local paths. Legacy Express response-shape parity, performance on large tables, every error edge case, and full 516-registration migration are still pending.
