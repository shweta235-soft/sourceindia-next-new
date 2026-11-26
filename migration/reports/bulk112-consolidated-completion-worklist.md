# Bulk112 — Consolidated legacy API completion worklist

**This is an audit deliverable, not an implementation of all missing APIs.** Static matches do not establish behavior parity. No DB writes were made.

## Coverage snapshot
- Legacy registrations: **516**
- Source route modules: **48**
- Mapping status counts: **{'NO_EXPLICIT_ROUTE_MAPPING': 121, 'STATIC_ROUTE_SHAPE_CANDIDATE': 235, 'NO_MATCHING_LOCAL_METHOD': 160}**
- Functional parity: **not verified**

## Module-by-module work queue

| Original Express module | Total | No explicit mapping | Other mappings |
|---|---:|---:|---:|
| `usersRoutes.js` | 50 | 25 | 25 |
| `productsRoutes.js` | 25 | 25 | 0 |
| `itemsRoutes.js` | 14 | 14 | 0 |
| `openEnquiriesRoutes.js` | 14 | 14 | 0 |
| `sellerMailHistoriesRoutes.js` | 10 | 10 | 0 |
| `subAdminRoutes.js` | 9 | 9 | 0 |
| `faqCategoryRoutes.js` | 14 | 7 | 7 |
| `locationRoutes.js` | 6 | 6 | 0 |
| `settingRoutes.js` | 5 | 5 | 0 |
| `adminAuthRoutes.js` | 2 | 2 | 0 |
| `fileRoutes.js` | 2 | 2 | 0 |
| `adminEnquiriesRoutes.js` | 1 | 1 | 0 |
| `membershipPlansRoutes.js` | 1 | 1 | 0 |
| `enquiriesRoutes.js` | 30 | 0 | 30 |
| `sellerRoutes.js` | 25 | 0 | 25 |
| `categoriesRoutes.js` | 20 | 0 | 20 |
| `itemCategoryRoutes.js` | 18 | 0 | 18 |
| `keywordsRoutes.js` | 17 | 0 | 17 |
| `ticketRoutes.js` | 16 | 0 | 16 |
| `buyerRoutes.js` | 15 | 0 | 15 |
| `itemSubCategoryRoutes.js` | 15 | 0 | 15 |
| `subCategoryRoutes.js` | 15 | 0 | 15 |
| `applicationRoutes.js` | 12 | 0 | 12 |
| `activityRoutes.js` | 11 | 0 | 11 |
| `coreActivityRoutes.js` | 11 | 0 | 11 |
| `interestSubCategoriesRoutes.js` | 11 | 0 | 11 |
| `faqRoutes.js` | 10 | 0 | 10 |
| `frontMenuRoutes.js` | 10 | 0 | 10 |
| `homeBannerRoutes.js` | 10 | 0 | 10 |
| `knowledgeCenterRoutes.js` | 10 | 0 | 10 |
| `membershipPlanRoutes.js` | 10 | 0 | 10 |
| `newsletterRoutes.js` | 10 | 0 | 10 |
| `ticketCategoryRoutes.js` | 9 | 0 | 9 |
| `emailsRoutes.js` | 8 | 0 | 8 |
| `interestCategoriesRoutes.js` | 8 | 0 | 8 |
| `rolesRoutes.js` | 8 | 0 | 8 |
| `seoPagesRoutes.js` | 8 | 0 | 8 |
| `testimonialRoutes.js` | 8 | 0 | 8 |
| `usersDashboardRoutes.js` | 8 | 0 | 8 |
| `contactsRoutes.js` | 7 | 0 | 7 |
| `registrationsRoutes.js` | 6 | 0 | 6 |
| `shortcutRoutes.js` | 4 | 0 | 4 |
| `userActivityRoutes.js` | 4 | 0 | 4 |
| `buyerEnquiryRoutes.js` | 3 | 0 | 3 |
| `newsletterHistoriesRoutes.js` | 2 | 0 | 2 |
| `pagesRoutes.js` | 2 | 0 | 2 |
| `categoryConflictLogsRoutes.js` | 1 | 0 | 1 |
| `companiesRoutes.js` | 1 | 0 | 1 |

## Verification required per endpoint

1. Confirm exact Express path and method, including aliases and dynamic segments.
2. Inspect controller and middleware for authentication, input validation and side effects.
3. Confirm Next route behavior, database model, response shape and pagination.
4. Test GET with safe local fixtures; test writes only with explicit approval and rollback strategy.
5. Mark parity verified only with contract tests and evidence.

## Full endpoint list

| # | Method | Express path | Source module | Mapping status | Candidate |
|---:|---|---|---|---|---|
| 1 | GET | `/v2/api/admin/open-enquiries/:id` | `adminEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 2 | GET | `/v2/api/files/` | `fileRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 3 | GET | `/v2/api/files/:id` | `fileRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 4 | POST | `/v2/api/admin/login` | `adminAuthRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 5 | POST | `/v2/api/admin/change-password` | `adminAuthRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 6 | POST | `/v2/api/activities/` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities` |
| 7 | GET | `/v2/api/activities/count` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/count` |
| 8 | GET | `/v2/api/activities/` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities` |
| 9 | GET | `/v2/api/activities/server-side` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/server-side` |
| 10 | DELETE | `/v2/api/activities/delete-selected` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/delete-selected` |
| 11 | GET | `/v2/api/activities/coreactivity/:coreactivity` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/coreactivity/:coreactivity` |
| 12 | GET | `/v2/api/activities/:id` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/:id` |
| 13 | PUT | `/v2/api/activities/:id` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/:id` |
| 14 | DELETE | `/v2/api/activities/:id` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/:id` |
| 15 | PATCH | `/v2/api/activities/:id/status` | `activityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/activities/:id/status` |
| 16 | PATCH | `/v2/api/activities/:id/delete_status` | `activityRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/activities/:id/delete-status` |
| 17 | POST | `/v2/api/core_activities/` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities` |
| 18 | GET | `/v2/api/core_activities/count` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/count` |
| 19 | GET | `/v2/api/core_activities/` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities` |
| 20 | GET | `/v2/api/core_activities/server-side` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/server-side` |
| 21 | DELETE | `/v2/api/core_activities/delete-selected` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/delete-selected` |
| 22 | GET | `/v2/api/core_activities/colors` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/colors` |
| 23 | GET | `/v2/api/core_activities/:id` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/:id` |
| 24 | PUT | `/v2/api/core_activities/:id` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/:id` |
| 25 | DELETE | `/v2/api/core_activities/:id` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/:id` |
| 26 | PATCH | `/v2/api/core_activities/:id/status` | `coreActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/core-activities/:id/status` |
| 27 | PATCH | `/v2/api/core_activities/:id/delete_status` | `coreActivityRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/core-activities/:id/delete-status` |
| 28 | POST | `/v2/api/ticket_categories/` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories` |
| 29 | GET | `/v2/api/ticket_categories/count` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/count` |
| 30 | GET | `/v2/api/ticket_categories/` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories` |
| 31 | GET | `/v2/api/ticket_categories/server-side` | `ticketCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/ticket-categories/server-side` |
| 32 | DELETE | `/v2/api/ticket_categories/delete-selected` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/delete-selected` |
| 33 | GET | `/v2/api/ticket_categories/:id` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/:id` |
| 34 | PUT | `/v2/api/ticket_categories/:id` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/:id` |
| 35 | DELETE | `/v2/api/ticket_categories/:id` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/:id` |
| 36 | PATCH | `/v2/api/ticket_categories/:id/status` | `ticketCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/ticket-categories/:id/status` |
| 37 | POST | `/v2/api/testimonials/` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials` |
| 38 | GET | `/v2/api/testimonials/` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials` |
| 39 | GET | `/v2/api/testimonials/server-side` | `testimonialRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/testimonials/server-side` |
| 40 | GET | `/v2/api/testimonials/count` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials/count` |
| 41 | GET | `/v2/api/testimonials/:id` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials/:id` |
| 42 | PUT | `/v2/api/testimonials/:id` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials/:id` |
| 43 | DELETE | `/v2/api/testimonials/:id` | `testimonialRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/testimonials/:id` |
| 44 | PATCH | `/v2/api/testimonials/:id/status` | `testimonialRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/testimonials/:id/status` |
| 45 | POST | `/v2/api/faq_categories/` | `faqCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/categories` |
| 46 | GET | `/v2/api/faq_categories/` | `faqCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/categories` |
| 47 | GET | `/v2/api/faq_categories/server-side` | `faqCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/categories/server-side` |
| 48 | GET | `/v2/api/faq_categories/:id` | `faqCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/categories/:id` |
| 49 | PUT | `/v2/api/faq_categories/:id` | `faqCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/categories/:id` |
| 50 | DELETE | `/v2/api/faq_categories/:id` | `faqCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/categories/:id` |
| 51 | PATCH | `/v2/api/faq_categories/:id/status` | `faqCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/categories/:id/status` |
| 52 | POST | `/v2/api/faqcategories/` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 53 | GET | `/v2/api/faqcategories/` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 54 | GET | `/v2/api/faqcategories/server-side` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 55 | GET | `/v2/api/faqcategories/:id` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 56 | PUT | `/v2/api/faqcategories/:id` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 57 | DELETE | `/v2/api/faqcategories/:id` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 58 | PATCH | `/v2/api/faqcategories/:id/status` | `faqCategoryRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 59 | POST | `/v2/api/faqs/` | `faqRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs` |
| 60 | GET | `/v2/api/faqs/count` | `faqRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/count` |
| 61 | GET | `/v2/api/faqs/` | `faqRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs` |
| 62 | GET | `/v2/api/faqs/server-side` | `faqRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/server-side` |
| 63 | DELETE | `/v2/api/faqs/delete-selected` | `faqRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/delete-selected` |
| 64 | GET | `/v2/api/faqs/:id` | `faqRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/:id` |
| 65 | PUT | `/v2/api/faqs/:id` | `faqRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/:id` |
| 66 | DELETE | `/v2/api/faqs/:id` | `faqRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/faqs/:id` |
| 67 | PATCH | `/v2/api/faqs/:id/status` | `faqRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/:id/status` |
| 68 | PATCH | `/v2/api/faqs/:id/delete_status` | `faqRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/faqs/:id/delete-status` |
| 69 | POST | `/v2/api/home_banners/` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners` |
| 70 | GET | `/v2/api/home_banners/count` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/count` |
| 71 | GET | `/v2/api/home_banners/` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners` |
| 72 | GET | `/v2/api/home_banners/server-side` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/server-side` |
| 73 | DELETE | `/v2/api/home_banners/delete-selected` | `homeBannerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/home-banners/delete-selected` |
| 74 | GET | `/v2/api/home_banners/:id` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/:id` |
| 75 | PUT | `/v2/api/home_banners/:id` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/:id` |
| 76 | DELETE | `/v2/api/home_banners/:id` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/:id` |
| 77 | PATCH | `/v2/api/home_banners/:id/status` | `homeBannerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/home-banners/:id/status` |
| 78 | PATCH | `/v2/api/home_banners/:id/delete_status` | `homeBannerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/home-banners/:id/delete-status` |
| 79 | POST | `/v2/api/roles/` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles` |
| 80 | GET | `/v2/api/roles/` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles` |
| 81 | GET | `/v2/api/roles/server-side` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/server-side` |
| 82 | DELETE | `/v2/api/roles/delete-selected` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/delete-selected` |
| 83 | GET | `/v2/api/roles/:id` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/:id` |
| 84 | PUT | `/v2/api/roles/:id` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/:id` |
| 85 | DELETE | `/v2/api/roles/:id` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/:id` |
| 86 | PATCH | `/v2/api/roles/:id/status` | `rolesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/roles/:id/status` |
| 87 | POST | `/v2/api/sub_admin/` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 88 | GET | `/v2/api/sub_admin/` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 89 | GET | `/v2/api/sub_admin/server-side` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 90 | GET | `/v2/api/sub_admin/count` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 91 | DELETE | `/v2/api/sub_admin/delete-selected` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 92 | GET | `/v2/api/sub_admin/:id` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 93 | PUT | `/v2/api/sub_admin/:id` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 94 | DELETE | `/v2/api/sub_admin/:id` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 95 | PATCH | `/v2/api/sub_admin/:id/status` | `subAdminRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 96 | POST | `/v2/api/knowledge_center/` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center` |
| 97 | GET | `/v2/api/knowledge_center/count` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/count` |
| 98 | GET | `/v2/api/knowledge_center/` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center` |
| 99 | GET | `/v2/api/knowledge_center/server-side` | `knowledgeCenterRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/knowledge-center/server-side` |
| 100 | DELETE | `/v2/api/knowledge_center/delete-selected` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/delete-selected` |
| 101 | GET | `/v2/api/knowledge_center/:id` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/:id` |
| 102 | PUT | `/v2/api/knowledge_center/:id` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/:id` |
| 103 | DELETE | `/v2/api/knowledge_center/:id` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/:id` |
| 104 | PATCH | `/v2/api/knowledge_center/:id/status` | `knowledgeCenterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/knowledge-center/:id/status` |
| 105 | PATCH | `/v2/api/knowledge_center/:id/delete_status` | `knowledgeCenterRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/knowledge-center/:id/delete-status` |
| 106 | GET | `/v2/api/location/countries` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 107 | GET | `/v2/api/location/states` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 108 | GET | `/v2/api/location/cities` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 109 | GET | `/v2/api/location/pincode/:pin` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 110 | GET | `/v2/api/location/states/:country_id` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 111 | GET | `/v2/api/location/cities/:state_id` | `locationRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 112 | POST | `/v2/api/buyers/` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers` |
| 113 | GET | `/v2/api/buyers/count` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/count` |
| 114 | GET | `/v2/api/buyers/` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers` |
| 115 | GET | `/v2/api/buyers/server-side` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/server-side` |
| 116 | GET | `/v2/api/buyers/filtered` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/filtered` |
| 117 | GET | `/v2/api/buyers/get-buyer-sourcing-interests` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/get-buyer-sourcing-interests` |
| 118 | DELETE | `/v2/api/buyers/delete-selected` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/delete-selected` |
| 119 | GET | `/v2/api/buyers/chart` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/chart` |
| 120 | GET | `/v2/api/buyers/:id` | `buyerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/buyers/:id` |
| 121 | PUT | `/v2/api/buyers/:id` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id` |
| 122 | DELETE | `/v2/api/buyers/:id` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id` |
| 123 | PATCH | `/v2/api/buyers/:id/status` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id/status` |
| 124 | PATCH | `/v2/api/buyers/:id/account_status` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id/account_status` |
| 125 | PATCH | `/v2/api/buyers/:id/seller_status` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id/seller_status` |
| 126 | PATCH | `/v2/api/buyers/:id/delete_status` | `buyerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyers/:id/delete-status` |
| 127 | POST | `/v2/api/membership_plan/` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans` |
| 128 | GET | `/v2/api/membership_plan/count` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/count` |
| 129 | GET | `/v2/api/membership_plan/` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans` |
| 130 | GET | `/v2/api/membership_plan/server-side` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/server-side` |
| 131 | DELETE | `/v2/api/membership_plan/delete-selected` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/delete-selected` |
| 132 | GET | `/v2/api/membership_plan/:id` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/:id` |
| 133 | PUT | `/v2/api/membership_plan/:id` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/:id` |
| 134 | DELETE | `/v2/api/membership_plan/:id` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/:id` |
| 135 | PATCH | `/v2/api/membership_plan/:id/status` | `membershipPlanRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/membership-plans/:id/status` |
| 136 | PATCH | `/v2/api/membership_plan/:id/delete_status` | `membershipPlanRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/membership-plans/:id/delete-status` |
| 137 | POST | `/v2/api/categories/` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories` |
| 138 | GET | `/v2/api/categories/master` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/master` |
| 139 | GET | `/v2/api/categories/count` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories/count` |
| 140 | GET | `/v2/api/categories/` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories` |
| 141 | GET | `/v2/api/categories/product-categories` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/product-categories` |
| 142 | GET | `/v2/api/categories/category-item` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/category-item` |
| 143 | GET | `/v2/api/categories/sub-category-item` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/sub-category-item` |
| 144 | GET | `/v2/api/categories/item-category` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/item-category` |
| 145 | GET | `/v2/api/categories/sub-items` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/sub-items` |
| 146 | GET | `/v2/api/categories/items` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/items` |
| 147 | GET | `/v2/api/categories/server-side` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories/server-side` |
| 148 | GET | `/v2/api/categories/product-bar-graph` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/product-bar-graph` |
| 149 | GET | `/v2/api/categories/seller-bar-graph` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/seller-bar-graph` |
| 150 | DELETE | `/v2/api/categories/delete-selected` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/delete-selected` |
| 151 | GET | `/v2/api/categories/:id` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories/:id` |
| 152 | PUT | `/v2/api/categories/:id` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories/:id` |
| 153 | DELETE | `/v2/api/categories/:id` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/:id` |
| 154 | PATCH | `/v2/api/categories/:id/status` | `categoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-categories/:id/status` |
| 155 | PATCH | `/v2/api/categories/:id/category_status` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/:id/category-status` |
| 156 | PATCH | `/v2/api/categories/:id/delete_status` | `categoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-categories/:id/delete-status` |
| 157 | POST | `/v2/api/sub_categories/` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories` |
| 158 | GET | `/v2/api/sub_categories/count` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories/count` |
| 159 | GET | `/v2/api/sub_categories/` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories` |
| 160 | GET | `/v2/api/sub_categories/server-side` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories/server-side` |
| 161 | DELETE | `/v2/api/sub_categories/delete-selected` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/delete-selected` |
| 162 | GET | `/v2/api/sub_categories/product-bar-graph` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/product-bar-graph` |
| 163 | GET | `/v2/api/sub_categories/seller-bar-graph` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/seller-bar-graph` |
| 164 | GET | `/v2/api/sub_categories/category/:category` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/category/:category` |
| 165 | GET | `/v2/api/sub_categories/category-all/:category` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/category-all/:category` |
| 166 | GET | `/v2/api/sub_categories/:id` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories/:id` |
| 167 | PUT | `/v2/api/sub_categories/:id` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories/:id` |
| 168 | DELETE | `/v2/api/sub_categories/:id` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/:id` |
| 169 | PATCH | `/v2/api/sub_categories/:id/status` | `subCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-subcategories/:id/status` |
| 170 | PATCH | `/v2/api/sub_categories/:id/delete_status` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/:id/delete-status` |
| 171 | POST | `/v2/api/sub_categories/categories` | `subCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-subcategories/categories` |
| 172 | POST | `/v2/api/interest_categories/` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories` |
| 173 | GET | `/v2/api/interest_categories/count` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories/count` |
| 174 | GET | `/v2/api/interest_categories/` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories` |
| 175 | GET | `/v2/api/interest_categories/server-side` | `interestCategoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/interest-categories/server-side` |
| 176 | GET | `/v2/api/interest_categories/:id` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories/:id` |
| 177 | PUT | `/v2/api/interest_categories/:id` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories/:id` |
| 178 | DELETE | `/v2/api/interest_categories/:id` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories/:id` |
| 179 | PATCH | `/v2/api/interest_categories/:id/status` | `interestCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-categories/:id/status` |
| 180 | POST | `/v2/api/interest_sub_categories/` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories` |
| 181 | GET | `/v2/api/interest_sub_categories/count` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/count` |
| 182 | GET | `/v2/api/interest_sub_categories/` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories` |
| 183 | GET | `/v2/api/interest_sub_categories/count_relation` | `interestSubCategoriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/interest-subcategories/count-relation` |
| 184 | GET | `/v2/api/interest_sub_categories/server-side` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/server-side` |
| 185 | DELETE | `/v2/api/interest_sub_categories/delete-selected` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/delete-selected` |
| 186 | GET | `/v2/api/interest_sub_categories/category/:interest_category_id` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/category/:interest_category_id` |
| 187 | GET | `/v2/api/interest_sub_categories/:id` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/:id` |
| 188 | PUT | `/v2/api/interest_sub_categories/:id` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/:id` |
| 189 | DELETE | `/v2/api/interest_sub_categories/:id` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/:id` |
| 190 | PATCH | `/v2/api/interest_sub_categories/:id/status` | `interestSubCategoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/interest-subcategories/:id/status` |
| 191 | POST | `/v2/api/tickets/` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets` |
| 192 | POST | `/v2/api/tickets/send-otp` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/send-otp` |
| 193 | POST | `/v2/api/tickets/verify-otp` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/verify-otp` |
| 194 | POST | `/v2/api/tickets/store-ticket` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/store-ticket` |
| 195 | POST | `/v2/api/tickets/track-ticket` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/track-ticket` |
| 196 | GET | `/v2/api/tickets/support-ticket/track/:number` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/support-ticket/track/:number` |
| 197 | POST | `/v2/api/tickets/store-support-ticket-reply` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/store-support-ticket-reply` |
| 198 | GET | `/v2/api/tickets/count` | `ticketRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/tickets/count` |
| 199 | GET | `/v2/api/tickets/` | `ticketRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/tickets` |
| 200 | GET | `/v2/api/tickets/server-side` | `ticketRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/tickets/server-side` |
| 201 | GET | `/v2/api/tickets/:ticket_id/next` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/:ticket_id/next` |
| 202 | GET | `/v2/api/tickets/id/:id/next` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/id/:id/next` |
| 203 | GET | `/v2/api/tickets/:id` | `ticketRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/tickets/:id` |
| 204 | PUT | `/v2/api/tickets/:id` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/:id` |
| 205 | DELETE | `/v2/api/tickets/:id` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/:id` |
| 206 | PATCH | `/v2/api/tickets/:id/status` | `ticketRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/tickets/:id/status` |
| 207 | POST | `/v2/api/sellers/messages` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/messages` |
| 208 | POST | `/v2/api/sellers/` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers` |
| 209 | GET | `/v2/api/sellers/count` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/count` |
| 210 | GET | `/v2/api/sellers/get-email-template` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/get-email-template` |
| 211 | POST | `/v2/api/sellers/send-mail` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/send-mail` |
| 212 | GET | `/v2/api/sellers/sendmail-cron` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/sendmail-cron` |
| 213 | GET | `/v2/api/sellers/` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers` |
| 214 | GET | `/v2/api/sellers/server-side` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/server-side` |
| 215 | GET | `/v2/api/sellers/filtered` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/filtered` |
| 216 | DELETE | `/v2/api/sellers/delete-selected` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/delete-selected` |
| 217 | GET | `/v2/api/sellers/designations` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/designations` |
| 218 | GET | `/v2/api/sellers/nature_business` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/nature_business` |
| 219 | GET | `/v2/api/sellers/with-messages` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/with-messages` |
| 220 | GET | `/v2/api/sellers/seller-categories` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/seller-categories` |
| 221 | GET | `/v2/api/sellers/seller-subcategories` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/seller-subcategories` |
| 222 | GET | `/v2/api/sellers/seller-subcategories-by-user` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/seller-subcategories-by-user` |
| 223 | GET | `/v2/api/sellers/trends` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/trends` |
| 224 | GET | `/v2/api/sellers/chart` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/chart` |
| 225 | GET | `/v2/api/sellers/seller-message/:user_id` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/seller-message/:user_id` |
| 226 | GET | `/v2/api/sellers/:id` | `sellerRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/sellers/:id` |
| 227 | PUT | `/v2/api/sellers/:id` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/:id` |
| 228 | DELETE | `/v2/api/sellers/:id` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/:id` |
| 229 | PATCH | `/v2/api/sellers/:id/status` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/:id/status` |
| 230 | PATCH | `/v2/api/sellers/:id/account_status` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/:id/account_status` |
| 231 | PATCH | `/v2/api/sellers/:id/delete_status` | `sellerRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/sellers/:id/delete-status` |
| 232 | POST | `/v2/api/applications/` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications` |
| 233 | GET | `/v2/api/applications/` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications` |
| 234 | GET | `/v2/api/applications/server-side` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/server-side` |
| 235 | GET | `/v2/api/applications/count` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/count` |
| 236 | DELETE | `/v2/api/applications/delete-selected` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/delete-selected` |
| 237 | DELETE | `/v2/api/applications/count` | `applicationRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/applications/count` |
| 238 | GET | `/v2/api/applications/:id` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/:id` |
| 239 | PUT | `/v2/api/applications/:id` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/:id` |
| 240 | DELETE | `/v2/api/applications/:id` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/:id` |
| 241 | PATCH | `/v2/api/applications/:id/status` | `applicationRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/applications/:id/status` |
| 242 | PATCH | `/v2/api/applications/:id/category_status` | `applicationRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/applications/:id/category-status` |
| 243 | PATCH | `/v2/api/applications/:id/delete_status` | `applicationRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/applications/:id/delete-status` |
| 244 | GET | `/v2/api/products/all-products` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 245 | GET | `/v2/api/products/suggest` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 246 | GET | `/v2/api/products/suggested-item-subcategories` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 247 | GET | `/v2/api/products/latest-home` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 248 | POST | `/v2/api/products/` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 249 | GET | `/v2/api/products/count` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 250 | GET | `/v2/api/products/` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 251 | GET | `/v2/api/products/server-side` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 252 | DELETE | `/v2/api/products/delete-selected` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 253 | GET | `/v2/api/products/companies` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 254 | GET | `/v2/api/products/companies_filtered` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 255 | GET | `/v2/api/products/filtered` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 256 | POST | `/v2/api/products/company-review` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 257 | GET | `/v2/api/products/companies/:id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 258 | GET | `/v2/api/products/details/:id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 259 | GET | `/v2/api/products/item-hierarchy/:type/:item_id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 260 | GET | `/v2/api/products/product-keyword-update` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 261 | GET | `/v2/api/products/:id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 262 | PUT | `/v2/api/products/:id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 263 | DELETE | `/v2/api/products/:id` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 264 | PATCH | `/v2/api/products/:id/status` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 265 | PATCH | `/v2/api/products/:id/account_status` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 266 | PATCH | `/v2/api/products/:id/delete_status` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 267 | POST | `/v2/api/products/:id/images` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 268 | DELETE | `/v2/api/products/:id/images/:imageId` | `productsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 269 | GET | `/v2/api/settings/site` | `settingRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 270 | GET | `/v2/api/settings/front-site` | `settingRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 271 | PUT | `/v2/api/settings/site` | `settingRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 272 | GET | `/v2/api/settings/home` | `settingRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 273 | PUT | `/v2/api/settings/home` | `settingRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 274 | POST | `/v2/api/newsletters/` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars` |
| 275 | GET | `/v2/api/newsletters/count` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/count` |
| 276 | GET | `/v2/api/newsletters/` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars` |
| 277 | GET | `/v2/api/newsletters/server-side` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/server-side` |
| 278 | GET | `/v2/api/newsletters/user_type` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/user_type` |
| 279 | GET | `/v2/api/newsletters/:id` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/:id` |
| 280 | PUT | `/v2/api/newsletters/:id` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/:id` |
| 281 | DELETE | `/v2/api/newsletters/:id` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/:id` |
| 282 | POST | `/v2/api/newsletters/:id/images` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/:id/images` |
| 283 | DELETE | `/v2/api/newsletters/:id/images/:imageId` | `newsletterRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-circulars/:id/images/:imageId` |
| 284 | GET | `/v2/api/enquiries/count` | `enquiriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/enquiries/count` |
| 285 | GET | `/v2/api/enquiries/lead-count` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/lead-count` |
| 286 | GET | `/v2/api/enquiries/user-count` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/user-count` |
| 287 | GET | `/v2/api/enquiries/` | `enquiriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/enquiries` |
| 288 | GET | `/v2/api/enquiries/server-side` | `enquiriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/enquiries/server-side` |
| 289 | GET | `/v2/api/enquiries/filtered` | `enquiriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/enquiries/filtered` |
| 290 | GET | `/v2/api/enquiries/by-user` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/by-user` |
| 291 | GET | `/v2/api/enquiries/by-enquiry` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/by-enquiry` |
| 292 | POST | `/v2/api/enquiries/prove-enquiry` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/prove-enquiry` |
| 293 | GET | `/v2/api/enquiries/awarded` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/awarded` |
| 294 | GET | `/v2/api/enquiries/accept` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/accept` |
| 295 | GET | `/v2/api/enquiries/messages` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/messages` |
| 296 | GET | `/v2/api/enquiries/all-leads` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/all-leads` |
| 297 | POST | `/v2/api/enquiries/send-message` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/send-message` |
| 298 | GET | `/v2/api/enquiries/shortlisted` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/shortlisted` |
| 299 | GET | `/v2/api/enquiries/chart` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/chart` |
| 300 | DELETE | `/v2/api/enquiries/delete-selected` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/delete-selected` |
| 301 | GET | `/v2/api/enquiries/:enquiry_number` | `enquiriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/enquiries/:enquiry_number` |
| 302 | GET | `/v2/api/enquiries/:enquiry_number/next` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/:enquiry_number/next` |
| 303 | GET | `/v2/api/enquiries/:enquiry_number/previous` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/:enquiry_number/previous` |
| 304 | DELETE | `/v2/api/enquiries/:id` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/:id` |
| 305 | PATCH | `/v2/api/enquiries/:id/delete_status` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/:id/delete-status` |
| 306 | PATCH | `/v2/api/enquiries/:id/account_status` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/:id/account_status` |
| 307 | POST | `/v2/api/enquiries/verify` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/verify` |
| 308 | POST | `/v2/api/enquiries/resend-otp` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/resend-otp` |
| 309 | POST | `/v2/api/enquiries/submit-otp` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/submit-otp` |
| 310 | POST | `/v2/api/enquiries/store` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/store` |
| 311 | POST | `/v2/api/enquiries/submit-enquiry` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/submit-enquiry` |
| 312 | POST | `/v2/api/enquiries/user-submit-enquiry` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/user-submit-enquiry` |
| 313 | POST | `/v2/api/enquiries/send-message-connect` | `enquiriesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/enquiries/send-message-connect` |
| 314 | GET | `/v2/api/open_enquiries/` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 315 | GET | `/v2/api/open_enquiries/count/:userId` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 316 | GET | `/v2/api/open_enquiries/front-enquiry` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 317 | GET | `/v2/api/open_enquiries/user-openenquiry` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 318 | GET | `/v2/api/open_enquiries/messages` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 319 | GET | `/v2/api/open_enquiries/openenquiry-entry` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 320 | POST | `/v2/api/open_enquiries/cheak-chats` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 321 | GET | `/v2/api/open_enquiries/server-side` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 322 | GET | `/v2/api/open_enquiries/count` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 323 | GET | `/v2/api/open_enquiries/:id` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 324 | DELETE | `/v2/api/open_enquiries/:id` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 325 | PATCH | `/v2/api/open_enquiries/:id/home_status` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 326 | PATCH | `/v2/api/open_enquiries/:id/delete_status` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 327 | POST | `/v2/api/open_enquiries/send-message` | `openEnquiriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 328 | POST | `/v2/api/seo_pages/` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages` |
| 329 | GET | `/v2/api/seo_pages/` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages` |
| 330 | GET | `/v2/api/seo_pages/server-side` | `seoPagesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/seo-pages/server-side` |
| 331 | GET | `/v2/api/seo_pages/count` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages/count` |
| 332 | GET | `/v2/api/seo_pages/slug/:slug` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages/slug/:slug` |
| 333 | GET | `/v2/api/seo_pages/:id` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages/:id` |
| 334 | PUT | `/v2/api/seo_pages/:id` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages/:id` |
| 335 | DELETE | `/v2/api/seo_pages/:id` | `seoPagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/seo-pages/:id` |
| 336 | GET | `/v2/api/user_activity/count` | `userActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/user-activity/count` |
| 337 | GET | `/v2/api/user_activity/` | `userActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/user-activity` |
| 338 | GET | `/v2/api/user_activity/server-side` | `userActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/user-activity/server-side` |
| 339 | GET | `/v2/api/user_activity/user_id/:user_id` | `userActivityRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/user-activity/user_id/:user_id` |
| 340 | GET | `/v2/api/category_conflict_logs/server-side` | `categoryConflictLogsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/category-conflict-logs/server-side` |
| 341 | GET | `/v2/api/seller_mail_histories/` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 342 | GET | `/v2/api/seller_mail_histories/server-side` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 343 | GET | `/v2/api/seller_mail_histories/details/:mailCode` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 344 | GET | `/v2/api/seller_mail_histories/track-open/:token` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 345 | POST | `/v2/api/seller_mail_histories/bulk-resend-failed/:mailCode` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 346 | POST | `/v2/api/seller_mail_histories/:id/resend` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 347 | DELETE | `/v2/api/seller_mail_histories/delete-selected` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 348 | DELETE | `/v2/api/seller_mail_histories/:id` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 349 | PATCH | `/v2/api/seller_mail_histories/:id/status` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 350 | PATCH | `/v2/api/seller_mail_histories/:id/delete_status` | `sellerMailHistoriesRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 351 | POST | `/v2/api/contacts/` | `contactsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/contacts` |
| 352 | DELETE | `/v2/api/contacts/delete-selected` | `contactsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/contacts/delete-selected` |
| 353 | GET | `/v2/api/contacts/count` | `contactsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/contacts/count` |
| 354 | GET | `/v2/api/contacts/` | `contactsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/contacts` |
| 355 | GET | `/v2/api/contacts/server-side` | `contactsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/contacts/server-side` |
| 356 | DELETE | `/v2/api/contacts/:id` | `contactsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/contacts/:id` |
| 357 | PATCH | `/v2/api/contacts/:id/delete_status` | `contactsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/contacts/:id/delete-status` |
| 358 | POST | `/v2/api/emails/` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates` |
| 359 | POST | `/v2/api/emails/clone` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/clone` |
| 360 | GET | `/v2/api/emails/count` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/count` |
| 361 | GET | `/v2/api/emails/` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates` |
| 362 | GET | `/v2/api/emails/server-side` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/server-side` |
| 363 | GET | `/v2/api/emails/:id` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/:id` |
| 364 | PUT | `/v2/api/emails/:id` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/:id` |
| 365 | DELETE | `/v2/api/emails/:id` | `emailsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/email-templates/:id` |
| 366 | GET | `/v2/api/newsletter_histories/count` | `newsletterHistoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-histories/count` |
| 367 | GET | `/v2/api/newsletter_histories/server-side` | `newsletterHistoriesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/newsletter-histories/server-side` |
| 368 | GET | `/v2/api/users/all` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/all` |
| 369 | GET | `/v2/api/users/server-side` | `usersRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/users/server-side` |
| 370 | GET | `/v2/api/users/all_users` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/all_users` |
| 371 | GET | `/v2/api/users/count` | `usersRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/users/count` |
| 372 | POST | `/v2/api/users/send-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/send-otp` |
| 373 | POST | `/v2/api/users/verify-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/verify-otp` |
| 374 | POST | `/v2/api/users/login` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/login` |
| 375 | POST | `/v2/api/users/send-login-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/send-login-otp` |
| 376 | POST | `/v2/api/users/verify-login-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/verify-login-otp` |
| 377 | POST | `/v2/api/users/register` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/register` |
| 378 | POST | `/v2/api/users/change-password` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/change-password` |
| 379 | POST | `/v2/api/users/impersonate-login` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/impersonate-login` |
| 380 | GET | `/v2/api/users/profile` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/profile` |
| 381 | POST | `/v2/api/users/update-profile` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/update-profile` |
| 382 | GET | `/v2/api/users/countries` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/countries` |
| 383 | GET | `/v2/api/users/states` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/states` |
| 384 | GET | `/v2/api/users/cities` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/cities` |
| 385 | POST | `/v2/api/users/forgot-password` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/forgot-password` |
| 386 | PATCH | `/v2/api/users/:id/status` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/:id/status` |
| 387 | GET | `/v2/api/users/insert-from-company` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/insert-from-company` |
| 388 | GET | `/v2/api/users/product-category` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/product-category` |
| 389 | GET | `/v2/api/users/product-category/:userId` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/product-category/:userId` |
| 390 | POST | `/v2/api/users/verify-forgot-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/verify-forgot-otp` |
| 391 | POST | `/v2/api/users/reset-password` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/reset-password` |
| 392 | POST | `/v2/api/users/resend-otp` | `usersRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/users/resend-otp` |
| 393 | GET | `/v2/api/signup/all` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 394 | GET | `/v2/api/signup/server-side` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 395 | GET | `/v2/api/signup/all_users` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 396 | GET | `/v2/api/signup/count` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 397 | POST | `/v2/api/signup/send-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 398 | POST | `/v2/api/signup/verify-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 399 | POST | `/v2/api/signup/login` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 400 | POST | `/v2/api/signup/send-login-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 401 | POST | `/v2/api/signup/verify-login-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 402 | POST | `/v2/api/signup/register` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 403 | POST | `/v2/api/signup/change-password` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 404 | POST | `/v2/api/signup/impersonate-login` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 405 | GET | `/v2/api/signup/profile` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 406 | POST | `/v2/api/signup/update-profile` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 407 | GET | `/v2/api/signup/countries` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 408 | GET | `/v2/api/signup/states` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 409 | GET | `/v2/api/signup/cities` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 410 | POST | `/v2/api/signup/forgot-password` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 411 | PATCH | `/v2/api/signup/:id/status` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 412 | GET | `/v2/api/signup/insert-from-company` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 413 | GET | `/v2/api/signup/product-category` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 414 | GET | `/v2/api/signup/product-category/:userId` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 415 | POST | `/v2/api/signup/verify-forgot-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 416 | POST | `/v2/api/signup/reset-password` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 417 | POST | `/v2/api/signup/resend-otp` | `usersRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 418 | GET | `/v2/api/dashboard/buyer-interest` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/buyer-interest` |
| 419 | POST | `/v2/api/dashboard/store-buyer-interest` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/store-buyer-interest` |
| 420 | GET | `/v2/api/dashboard/get-buyer-interest` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/get-buyer-interest` |
| 421 | GET | `/v2/api/dashboard/get-itemtype` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/get-itemtype` |
| 422 | GET | `/v2/api/dashboard/get-item-subcategory` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/get-item-subcategory` |
| 423 | GET | `/v2/api/dashboard/get-products` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/get-products` |
| 424 | GET | `/v2/api/dashboard/get-seller-company` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/get-seller-company` |
| 425 | POST | `/v2/api/dashboard/store-item-subcategory` | `usersDashboardRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/api/local/dashboard/store-item-subcategory` |
| 426 | DELETE | `/v2/api/registrations/delete-selected` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations/delete-selected` |
| 427 | GET | `/v2/api/registrations/count` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations/count` |
| 428 | GET | `/v2/api/registrations/` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations` |
| 429 | GET | `/v2/api/registrations/server-side` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations/server-side` |
| 430 | DELETE | `/v2/api/registrations/:id` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations/:id` |
| 431 | PATCH | `/v2/api/registrations/:id/delete_status` | `registrationsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/registrations/:id/delete-status` |
| 432 | POST | `/v2/api/item_category/` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories` |
| 433 | GET | `/v2/api/item_category/count` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories/count` |
| 434 | GET | `/v2/api/item_category/` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories` |
| 435 | GET | `/v2/api/item_category/getitem` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/getitem` |
| 436 | GET | `/v2/api/item_category/server-side` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories/server-side` |
| 437 | GET | `/v2/api/item_category/product-bar-graph` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/product-bar-graph` |
| 438 | GET | `/v2/api/item_category/sourcing-interest-bar-graph` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/sourcing-interest-bar-graph` |
| 439 | DELETE | `/v2/api/item_category/delete-selected` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/delete-selected` |
| 440 | GET | `/v2/api/item_category/by-category-subcategory/:category_id/:subcategory_id` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/by-category-subcategory/:category_id/:subcategory_id` |
| 441 | GET | `/v2/api/item_category/by-category-subcategory-all/:category_id/:subcategory_id` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/by-category-subcategory-all/:category_id/:subcategory_id` |
| 442 | GET | `/v2/api/item_category/getitemtype/:category_id` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/getitemtype/:category_id` |
| 443 | POST | `/v2/api/item_category/by-selected-category-subcategory` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/by-selected-category-subcategory` |
| 444 | POST | `/v2/api/item_category/:id/import-subcategories-keywords` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/:id/import-subcategories-keywords` |
| 445 | GET | `/v2/api/item_category/:id` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories/:id` |
| 446 | PUT | `/v2/api/item_category/:id` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories/:id` |
| 447 | DELETE | `/v2/api/item_category/:id` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/:id` |
| 448 | PATCH | `/v2/api/item_category/:id/status` | `itemCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-categories/:id/status` |
| 449 | PATCH | `/v2/api/item_category/:id/delete_status` | `itemCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-categories/:id/delete-status` |
| 450 | POST | `/v2/api/item_sub_category/` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories` |
| 451 | GET | `/v2/api/item_sub_category/count` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories/count` |
| 452 | GET | `/v2/api/item_sub_category/` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories` |
| 453 | GET | `/v2/api/item_sub_category/server-side` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories/server-side` |
| 454 | GET | `/v2/api/item_sub_category/product-bar-graph` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/product-bar-graph` |
| 455 | GET | `/v2/api/item_sub_category/sourcing-interest-bar-graph` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/sourcing-interest-bar-graph` |
| 456 | DELETE | `/v2/api/item_sub_category/delete-selected` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/delete-selected` |
| 457 | GET | `/v2/api/item_sub_category/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id` |
| 458 | GET | `/v2/api/item_sub_category/by-category-subcategory-itemcategory-all/:category_id/:subcategory_id/:item_category_id` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/by-category-subcategory-itemcategory-all/:category_id/:subcategory_id/:item_category_id` |
| 459 | POST | `/v2/api/item_sub_category/by-selected-category-subcategory-itemcategory` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/by-selected-category-subcategory-itemcategory` |
| 460 | GET | `/v2/api/item_sub_category/:id` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories/:id` |
| 461 | PUT | `/v2/api/item_sub_category/:id` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories/:id` |
| 462 | DELETE | `/v2/api/item_sub_category/:id` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/:id` |
| 463 | PATCH | `/v2/api/item_sub_category/:id/status` | `itemSubCategoryRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/item-subcategories/:id/status` |
| 464 | PATCH | `/v2/api/item_sub_category/:id/delete_status` | `itemSubCategoryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/item-subcategories/:id/delete-status` |
| 465 | POST | `/v2/api/keywords/` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords` |
| 466 | POST | `/v2/api/keywords/import` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/import` |
| 467 | GET | `/v2/api/keywords/count` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords/count` |
| 468 | GET | `/v2/api/keywords/all` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/all` |
| 469 | GET | `/v2/api/keywords/` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords` |
| 470 | GET | `/v2/api/keywords/server-side` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords/server-side` |
| 471 | GET | `/v2/api/keywords/product-bar-graph` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/product-bar-graph` |
| 472 | GET | `/v2/api/keywords/sourcing-interest-bar-graph` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/sourcing-interest-bar-graph` |
| 473 | DELETE | `/v2/api/keywords/delete-selected` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/delete-selected` |
| 474 | GET | `/v2/api/keywords/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/by-category-subcategory-itemcategory/:category_id/:subcategory_id/:item_category_id` |
| 475 | GET | `/v2/api/keywords/by-category-subcategory-itemcategory-all/:category_id/:subcategory_id/:item_category_id` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/by-category-subcategory-itemcategory-all/:category_id/:subcategory_id/:item_category_id` |
| 476 | POST | `/v2/api/keywords/by-selected-category-subcategory-itemcategory` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/by-selected-category-subcategory-itemcategory` |
| 477 | GET | `/v2/api/keywords/by-subcategory/:id` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/by-subcategory/:id` |
| 478 | GET | `/v2/api/keywords/:id` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords/:id` |
| 479 | PUT | `/v2/api/keywords/:id` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords/:id` |
| 480 | DELETE | `/v2/api/keywords/:id` | `keywordsRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/product-keywords/:id` |
| 481 | PATCH | `/v2/api/keywords/:id/status` | `keywordsRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/product-keywords/:id/status` |
| 482 | POST | `/v2/api/items/` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 483 | GET | `/v2/api/items/` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 484 | GET | `/v2/api/items/server-side` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 485 | GET | `/v2/api/items/product-bar-graph` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 486 | GET | `/v2/api/items/count` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 487 | DELETE | `/v2/api/items/delete-selected` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 488 | GET | `/v2/api/items/by-category-subcategory-itemcategory-itemsubcategory/:category_id/:subcategory_id/:item_category_id/:item_sub_category_id` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 489 | GET | `/v2/api/items/by-category-subcategory-itemcategory-itemsubcategory-all/:category_id/:subcategory_id/:item_category_id/:item_sub_category_id` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 490 | POST | `/v2/api/items/by-selected-category-subcategory-itemcategory-itemsubcategory` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 491 | GET | `/v2/api/items/:id` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 492 | PUT | `/v2/api/items/:id` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 493 | DELETE | `/v2/api/items/:id` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 494 | PATCH | `/v2/api/items/:id/status` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 495 | PATCH | `/v2/api/items/:id/delete_status` | `itemsRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 496 | GET | `/v2/api/shortcut/shortcut_menus` | `shortcutRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/shortcut-menus` |
| 497 | POST | `/v2/api/shortcut/shortcut_menus` | `shortcutRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/shortcut-menus` |
| 498 | PUT | `/v2/api/shortcut/shortcut_menus/:id` | `shortcutRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/shortcut-menus/:id` |
| 499 | DELETE | `/v2/api/shortcut/shortcut_menus/:id` | `shortcutRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/shortcut-menus/:id` |
| 500 | GET | `/v2/api/pages/:id` | `pagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/static-pages/:id` |
| 501 | PUT | `/v2/api/pages/:id` | `pagesRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/static-pages/:id` |
| 502 | POST | `/v2/api/front_menu/` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu` |
| 503 | POST | `/v2/api/front_menu/main-search` | `frontMenuRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/front-menu/main-search` |
| 504 | GET | `/v2/api/front_menu/` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu` |
| 505 | GET | `/v2/api/front_menu/server-side` | `frontMenuRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/front-menu/server-side` |
| 506 | GET | `/v2/api/front_menu/count` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/count` |
| 507 | GET | `/v2/api/front_menu/:id` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/:id` |
| 508 | PUT | `/v2/api/front_menu/:id` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/:id` |
| 509 | PATCH | `/v2/api/front_menu/:id/is_show` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/:id/is_show` |
| 510 | DELETE | `/v2/api/front_menu/:id` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/:id` |
| 511 | PATCH | `/v2/api/front_menu/:id/status` | `frontMenuRoutes.js` | STATIC_ROUTE_SHAPE_CANDIDATE | `/admin/api/local/front-menu/:id/status` |
| 512 | GET | `/v2/api/membership_plans/` | `membershipPlansRoutes.js` | NO_EXPLICIT_ROUTE_MAPPING | `—` |
| 513 | GET | `/v2/api/buyerenquiry/admin-list` | `buyerEnquiryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyer-enquiries/admin-list` |
| 514 | GET | `/v2/api/buyerenquiry/admin` | `buyerEnquiryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyer-enquiries/admin` |
| 515 | GET | `/v2/api/buyerenquiry/user` | `buyerEnquiryRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/buyer-enquiries/user` |
| 516 | GET | `/v2/api/companies/all` | `companiesRoutes.js` | NO_MATCHING_LOCAL_METHOD | `/admin/api/local/companies/all` |
