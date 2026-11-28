# BULK127/128 completion follow-up — 2026-11-28

## Evidence and implementation

- `src/app/v2/api/front_menu/route.ts` and `count/route.ts`: remove erroneous request argument when invoking zero-argument GET handlers. This resolves the two reported TS2554 failures.
- `src/lib/localBulk128FrontMenu.ts`: `POST /v2/api/front_menu/main-search` now performs native MySQL-backed Product, Seller and Buyer search instead of returning the intentional 501 placeholder. Product ranking logic is extracted into a database-independent native port of the original `utils/productSuggest.js`, implemented in `src/lib/localBulk128Weighted.mjs`; keyword candidates come from `product_keywords`, approved products and approved users. Seller suggestions include companies, categories and subcategories; buyer suggestions include companies, consistent with the original active return statement.
- The Front Menu create/update/delete operations remain native and isolated-QA-only. Legacy parent handling is mirrored in QA; do not enable them on a real database.
- `src/lib/localBulk126ApplicationFiles.ts`: add explicit Turbopack file-tracing ignore hint for dynamically configured QA storage roots. Check the full Windows build output to confirm the warning disappears.
- BULK127 Contacts has existing native create/delete/soft-delete handlers and admin/user SMTP templates 61/59, but the email-enabled write flow remains QA-only and its actual side effects have not been parity-tested against Express.

## Local tests completed here

- `npm run test:api:bulk128`: 12/12 PASS (source, cross-platform wrapper, weighted ranking, QA guards, trace hint).
- Existing BULK125–127 source/mock regression subset: 31/31 PASS.
- Syntax: checked changed TypeScript files; `node --check` on native weighted ranking and search comparison script PASS.

## Not verified and limitations

- Full `npm run build` requires Next.js and all dependencies; not run in this environment. User's previous build reported two TS2554 failures and Turbopack tracing warnings.
- Original-vs-native Front Menu search real MySQL response parity is **not yet proven**. Run the new read-only `npm run test:api:bulk128:search-parity` to compare eight POST search requests. Do not interpret route existence or mock tests as 1:1 parity.
- Front Menu and Contacts POST/PUT/PATCH/DELETE write parity, emails, transaction side effects, live UI integration and 516-total route native migration remain unverified. Do not test writes on the original database.
- React source archive remains unchanged, as does the database.
