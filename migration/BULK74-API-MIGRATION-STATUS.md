# SourceIndia Consolidated API Migration — Bulk 74

## Scope truth

This is a substantive multi-endpoint batch, NOT a completed port of the original backend.
The original Phase 57 inventory contains 516 method/path registrations across route files.
Those registrations are not necessarily unique business endpoints.

## New read-only Next.js local endpoints

- GET /api/local/catalog/products?page=1&limit=20 — public approved products only
- GET /api/local/catalog/products/[slug] — approved public product detail
- GET /api/local/catalog/categories — active categories
- GET /api/local/catalog/categories/[id]/subcategories — active subcategories

Existing local authentication, account, company, seller product APIs remain in place.
No frontend live-API wiring, database schema or data was changed.
No new npm dependencies were added.

## Verification and limits

- 15 local static/contract tests passed for this batch.
- Full Next.js production build not verified here.
- No live MySQL connection used: SQL-to-schema matching and response data require local testing.
- Legacy feature parity (rich products relations, uploads, reviews, approvals, admin controls) is NOT claimed.
- API endpoints that modify data must not be enabled en masse before authorization tests and transaction semantics are checked.

## Remaining route-file inventory (original project)

- usersRoutes.js: 50 registered methods/paths (not migrated by this batch)
- enquiriesRoutes.js: 30 registered methods/paths (not migrated by this batch)
- productsRoutes.js: 25 registered methods/paths (not migrated by this batch)
- sellerRoutes.js: 25 registered methods/paths (not migrated by this batch)
- categoriesRoutes.js: 20 registered methods/paths (not migrated by this batch)
- itemCategoryRoutes.js: 18 registered methods/paths (not migrated by this batch)
- keywordsRoutes.js: 17 registered methods/paths (not migrated by this batch)
- ticketRoutes.js: 16 registered methods/paths (not migrated by this batch)
- buyerRoutes.js: 15 registered methods/paths (not migrated by this batch)
- itemSubCategoryRoutes.js: 15 registered methods/paths (not migrated by this batch)
- subCategoryRoutes.js: 15 registered methods/paths (not migrated by this batch)
- faqCategoryRoutes.js: 14 registered methods/paths (not migrated by this batch)
- itemsRoutes.js: 14 registered methods/paths (not migrated by this batch)
- openEnquiriesRoutes.js: 14 registered methods/paths (not migrated by this batch)
- applicationRoutes.js: 12 registered methods/paths (not migrated by this batch)
- activityRoutes.js: 11 registered methods/paths (not migrated by this batch)
- coreActivityRoutes.js: 11 registered methods/paths (not migrated by this batch)
- interestSubCategoriesRoutes.js: 11 registered methods/paths (not migrated by this batch)
- faqRoutes.js: 10 registered methods/paths (not migrated by this batch)
- frontMenuRoutes.js: 10 registered methods/paths (not migrated by this batch)
- homeBannerRoutes.js: 10 registered methods/paths (not migrated by this batch)
- knowledgeCenterRoutes.js: 10 registered methods/paths (not migrated by this batch)
- membershipPlanRoutes.js: 10 registered methods/paths (not migrated by this batch)
- newsletterRoutes.js: 10 registered methods/paths (not migrated by this batch)
- sellerMailHistoriesRoutes.js: 10 registered methods/paths (not migrated by this batch)
- subAdminRoutes.js: 9 registered methods/paths (not migrated by this batch)
- ticketCategoryRoutes.js: 9 registered methods/paths (not migrated by this batch)
- emailsRoutes.js: 8 registered methods/paths (not migrated by this batch)
- interestCategoriesRoutes.js: 8 registered methods/paths (not migrated by this batch)
- rolesRoutes.js: 8 registered methods/paths (not migrated by this batch)
- seoPagesRoutes.js: 8 registered methods/paths (not migrated by this batch)
- testimonialRoutes.js: 8 registered methods/paths (not migrated by this batch)
- usersDashboardRoutes.js: 8 registered methods/paths (not migrated by this batch)
- contactsRoutes.js: 7 registered methods/paths (not migrated by this batch)
- locationRoutes.js: 6 registered methods/paths (not migrated by this batch)
- registrationsRoutes.js: 6 registered methods/paths (not migrated by this batch)
- settingRoutes.js: 5 registered methods/paths (not migrated by this batch)
- shortcutRoutes.js: 4 registered methods/paths (not migrated by this batch)
- userActivityRoutes.js: 4 registered methods/paths (not migrated by this batch)
- buyerEnquiryRoutes.js: 3 registered methods/paths (not migrated by this batch)
- adminAuthRoutes.js: 2 registered methods/paths (not migrated by this batch)
- fileRoutes.js: 2 registered methods/paths (not migrated by this batch)
- newsletterHistoriesRoutes.js: 2 registered methods/paths (not migrated by this batch)
- pagesRoutes.js: 2 registered methods/paths (not migrated by this batch)
- adminEnquiriesRoutes.js: 1 registered methods/paths (not migrated by this batch)
- categoryConflictLogsRoutes.js: 1 registered methods/paths (not migrated by this batch)
- companiesRoutes.js: 1 registered methods/paths (not migrated by this batch)
- membershipPlansRoutes.js: 1 registered methods/paths (not migrated by this batch)

## Recommended acceptance gates for the complete migration

1. Verify all original Express controllers, middleware and schema against existing Next route coverage.
2. Implement grouped feature modules, not one endpoint per phase.
3. Test permission boundaries, token/session compatibility, file upload, email/OTP, transactions and ownership.
4. Run schema-safe DB integration tests on a controlled database and check response contract parity.
5. Switch frontend API callers only after grouped acceptance tests pass.
6. Run full public, buyer, seller, admin regression tests and production build.
