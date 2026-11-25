# Bulk87 — API Migration Inventory and Parity Tracker

**Audit date:** 2026-11-25  
**Basis:** original React/Express inventory bundled in the Next.js project + full Bulk86 Next.js ZIP.  
**Type:** source-code audit only. No live database/server test in this batch.

## Verified static counts

- Original Express inventory: **516 registered method/path pairs**, across **48 route files**.
- Local Next.js API: **41 route files**, with **46 exported HTTP handler declarations**.
- Other Next.js routes (`/api/account`, `/api/site-settings`, `/admin/*` data routes, etc.): **24 files** with **27 exported handler declarations**. These are not automatically counted as migrated local backend APIs.
- **Exact remaining legacy-equivalent endpoints: UNKNOWN.** Mapping each legacy endpoint to local methods, access control, response contract and DB effects is necessary before counting completed migrations.

## What these numbers do NOT mean

Do not subtract 46 from 516. The legacy 516 includes router registration, the Next.js 46 counts exported method declarations, and dynamic `[kind]` routes may represent multiple logical endpoint paths. Similar-looking names are not evidence of feature equivalence or security parity. The original inventory is a *static route scan*, not a runtime test.

## Priority follow-up and current blockers

1. **Bulk86 build check:** `npm ci` initially failed with locked `next-swc` binary; subsequent install was running, but final build was not reported in this chat. Verify successful install and `npm run build` before moving on.
2. **Buyer message sending:** SMTP and template readiness preflight returned `true` on the user's local DB, but `sending_enabled=false`; end-to-end send, idempotency and delivery handling remain untested.
3. **Enquiry workflow:** Bulk79 six read endpoints authenticated `200`; Bulk80 four reads `200` and one detail skipped; Bulk81 one detail passed and three skipped; Bulk82 chats skipped for lack of owned data. These are not complete original React/Express parity.
4. **Admin and other modules:** inspect route/controller/auth and UI usage before local migration. Preserve original database schema and protect React source as read-only.

## Legacy route-file inventory

| Original Express router | Registered method/path pairs | Next action |
|---|---:|---|
| `usersRoutes.js` | 50 | Review original controller and find matching local behavior |
| `enquiriesRoutes.js` | 30 | Review original controller and find matching local behavior |
| `sellerRoutes.js` | 25 | Review original controller and find matching local behavior |
| `productsRoutes.js` | 25 | Review original controller and find matching local behavior |
| `categoriesRoutes.js` | 20 | Review original controller and find matching local behavior |
| `itemCategoryRoutes.js` | 18 | Review original controller and find matching local behavior |
| `keywordsRoutes.js` | 17 | Review original controller and find matching local behavior |
| `ticketRoutes.js` | 16 | Review original controller and find matching local behavior |
| `buyerRoutes.js` | 15 | Review original controller and find matching local behavior |
| `subCategoryRoutes.js` | 15 | Review original controller and find matching local behavior |
| `itemSubCategoryRoutes.js` | 15 | Review original controller and find matching local behavior |
| `faqCategoryRoutes.js` | 14 | Review original controller and find matching local behavior |
| `openEnquiriesRoutes.js` | 14 | Review original controller and find matching local behavior |
| `itemsRoutes.js` | 14 | Review original controller and find matching local behavior |
| `applicationRoutes.js` | 12 | Review original controller and find matching local behavior |
| `activityRoutes.js` | 11 | Review original controller and find matching local behavior |
| `coreActivityRoutes.js` | 11 | Review original controller and find matching local behavior |
| `interestSubCategoriesRoutes.js` | 11 | Review original controller and find matching local behavior |
| `faqRoutes.js` | 10 | Review original controller and find matching local behavior |
| `homeBannerRoutes.js` | 10 | Review original controller and find matching local behavior |
| `knowledgeCenterRoutes.js` | 10 | Review original controller and find matching local behavior |
| `membershipPlanRoutes.js` | 10 | Review original controller and find matching local behavior |
| `newsletterRoutes.js` | 10 | Review original controller and find matching local behavior |
| `sellerMailHistoriesRoutes.js` | 10 | Review original controller and find matching local behavior |
| `frontMenuRoutes.js` | 10 | Review original controller and find matching local behavior |
| `ticketCategoryRoutes.js` | 9 | Review original controller and find matching local behavior |
| `subAdminRoutes.js` | 9 | Review original controller and find matching local behavior |
| `testimonialRoutes.js` | 8 | Review original controller and find matching local behavior |
| `rolesRoutes.js` | 8 | Review original controller and find matching local behavior |
| `interestCategoriesRoutes.js` | 8 | Review original controller and find matching local behavior |
| `seoPagesRoutes.js` | 8 | Review original controller and find matching local behavior |
| `emailsRoutes.js` | 8 | Review original controller and find matching local behavior |
| `usersDashboardRoutes.js` | 8 | Review original controller and find matching local behavior |
| `contactsRoutes.js` | 7 | Review original controller and find matching local behavior |
| `locationRoutes.js` | 6 | Review original controller and find matching local behavior |
| `registrationsRoutes.js` | 6 | Review original controller and find matching local behavior |
| `settingRoutes.js` | 5 | Review original controller and find matching local behavior |
| `userActivityRoutes.js` | 4 | Review original controller and find matching local behavior |
| `shortcutRoutes.js` | 4 | Review original controller and find matching local behavior |
| `buyerEnquiryRoutes.js` | 3 | Review original controller and find matching local behavior |
| `fileRoutes.js` | 2 | Review original controller and find matching local behavior |
| `adminAuthRoutes.js` | 2 | Review original controller and find matching local behavior |
| `newsletterHistoriesRoutes.js` | 2 | Review original controller and find matching local behavior |
| `pagesRoutes.js` | 2 | Review original controller and find matching local behavior |
| `adminEnquiriesRoutes.js` | 1 | Review original controller and find matching local behavior |
| `categoryConflictLogsRoutes.js` | 1 | Review original controller and find matching local behavior |
| `membershipPlansRoutes.js` | 1 | Review original controller and find matching local behavior |
| `companiesRoutes.js` | 1 | Review original controller and find matching local behavior |

## Current local Next.js route-handler declarations

| Methods exported | Local path template |
|---|---|
| `POST` | `/api/local/auth/login` |
| `GET` | `/api/local/auth/session` |
| `GET` | `/api/local/catalog/categories` |
| `GET` | `/api/local/catalog/categories/[id]/subcategories` |
| `GET` | `/api/local/catalog/categories/by-id/[id]` |
| `GET` | `/api/local/catalog/categories/count` |
| `GET` | `/api/local/catalog/products` |
| `GET` | `/api/local/catalog/products/[slug]` |
| `GET` | `/api/local/catalog/products/by-id/[id]` |
| `GET` | `/api/local/catalog/products/count` |
| `GET` | `/api/local/catalog/subcategories/by-id/[id]` |
| `GET` | `/api/local/catalog/subcategories/count` |
| `GET` | `/api/local/categories` |
| `GET, PATCH` | `/api/local/companies/me` |
| `GET` | `/api/local/enquiries/[kind]` |
| `GET` | `/api/local/enquiries/[kind]/[id]` |
| `GET` | `/api/local/enquiries/[kind]/count` |
| `GET` | `/api/local/enquiries/buyer-messages/delivery-readiness` |
| `POST` | `/api/local/enquiries/buyer-messages/prepare` |
| `GET` | `/api/local/enquiries/buyer-messages/recipient/[companyId]` |
| `POST` | `/api/local/enquiries/buyer-messages/send` |
| `POST` | `/api/local/enquiries/buyer-messages/validate` |
| `GET` | `/api/local/enquiries/incoming-buyer-messages` |
| `GET` | `/api/local/enquiries/incoming-buyer-messages/[id]` |
| `GET` | `/api/local/enquiries/incoming-buyer-messages/count` |
| `GET` | `/api/local/enquiries/open` |
| `GET` | `/api/local/enquiries/open/[id]` |
| `GET, POST` | `/api/local/enquiries/open/[id]/chats` |
| `GET` | `/api/local/enquiries/open/[id]/chats/[chatId]` |
| `GET` | `/api/local/enquiries/open/[id]/chats/count` |
| `GET` | `/api/local/enquiries/open/count` |
| `GET` | `/api/local/locations/cities` |
| `GET` | `/api/local/locations/cities/by-state` |
| `GET` | `/api/local/locations/countries` |
| `GET` | `/api/local/locations/states` |
| `GET` | `/api/local/locations/states/by-country` |
| `GET` | `/api/local/products` |
| `GET` | `/api/local/products/me` |
| `GET, PATCH, DELETE` | `/api/local/products/me/[id]` |
| `GET` | `/api/local/subcategories` |
| `GET, PATCH` | `/api/local/users/me` |

## Parity verification rule

A legacy endpoint can be marked **IMPLEMENTED_AND_VERIFIED** only after (1) mapping source route and controller, (2) verifying equivalent access/ownership, validation, responses and DB effects, (3) checking dependent frontend usage, and (4) successful tests. The detailed per-endpoint checklist is in `migration/bulk87-api-route-audit.json`; default status intentionally remains `PARITY_NOT_VERIFIED` even where local analogous routes exist.

**No database, frontend, auth, or API behavior changes in this batch.**
