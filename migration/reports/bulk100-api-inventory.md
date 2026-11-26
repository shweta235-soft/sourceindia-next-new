# Bulk100 — API Migration Inventory

Generated: 2026-11-26T11:02:58.529Z

**Legacy registrations:** 516 in 48 route files.
**Next.js handlers:** 342 route files, 432 HTTP method exports.
**Local handlers:** 318 route files, 405 method exports.

**Migration parity: NOT_VERIFIED.**

This is a static inventory, NOT verified legacy-to-local parity. Some legacy registrations are aliases. A Next.js route may be a proxy, and dynamic paths may represent multiple logical operations.

## Largest legacy modules

| Express route source | Registrations |
|---|---:|
| usersRoutes.js | 50 |
| enquiriesRoutes.js | 30 |
| productsRoutes.js | 25 |
| sellerRoutes.js | 25 |
| categoriesRoutes.js | 20 |
| itemCategoryRoutes.js | 18 |
| keywordsRoutes.js | 17 |
| ticketRoutes.js | 16 |
| buyerRoutes.js | 15 |
| itemSubCategoryRoutes.js | 15 |
| subCategoryRoutes.js | 15 |
| faqCategoryRoutes.js | 14 |
| itemsRoutes.js | 14 |
| openEnquiriesRoutes.js | 14 |
| applicationRoutes.js | 12 |
| activityRoutes.js | 11 |
| coreActivityRoutes.js | 11 |
| interestSubCategoriesRoutes.js | 11 |
| faqRoutes.js | 10 |
| frontMenuRoutes.js | 10 |
| homeBannerRoutes.js | 10 |
| knowledgeCenterRoutes.js | 10 |
| membershipPlanRoutes.js | 10 |
| newsletterRoutes.js | 10 |
| sellerMailHistoriesRoutes.js | 10 |

## Potential duplicate normalized legacy method/path keys (0)


## Duplicate Next.js method declarations (0)

None found by static scanner.

## Next actions

1. Map each legacy method/path to implementation files and business behavior (not inferred solely from path names).
2. Identify APIs still calling the live backend and write tests for equivalent local responses.
3. Migrate dependent business modules with role/ownership checks and an isolated test database.
4. Mark parity complete only after automated and runtime comparison.
