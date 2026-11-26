# Bulk104 — Complete Legacy Endpoint Traceability (STATIC ONLY)

All **516** legacy registrations have matrix entries.
**119** matching local method/path shape candidates (NOT verified parity).
**25** explicit module mappings without matching method/path.
**372** entries have no explicit route mapping.
**0 endpoints are verified for complete Express behavior parity by this inventory.**

A matching route does not establish equivalent response data, authorization, file handling, emails, pagination or database mutation. All rows in the CSV and JSON retain parity_verified=false.

## Modules

| Legacy route file | Registrations | Static method/path candidates |
|---|---:|---:|
| usersRoutes.js | 50 | 0 |
| enquiriesRoutes.js | 30 | 0 |
| sellerRoutes.js | 25 | 0 |
| productsRoutes.js | 25 | 0 |
| categoriesRoutes.js | 20 | 0 |
| itemCategoryRoutes.js | 18 | 0 |
| keywordsRoutes.js | 17 | 0 |
| ticketRoutes.js | 16 | 0 |
| buyerRoutes.js | 15 | 0 |
| subCategoryRoutes.js | 15 | 0 |
| itemSubCategoryRoutes.js | 15 | 0 |
| faqCategoryRoutes.js | 14 | 5 |
| openEnquiriesRoutes.js | 14 | 0 |
| itemsRoutes.js | 14 | 0 |
| applicationRoutes.js | 12 | 9 |
| activityRoutes.js | 11 | 10 |
| coreActivityRoutes.js | 11 | 10 |
| interestSubCategoriesRoutes.js | 11 | 10 |
| faqRoutes.js | 10 | 5 |
| homeBannerRoutes.js | 10 | 0 |
| knowledgeCenterRoutes.js | 10 | 8 |
| membershipPlanRoutes.js | 10 | 9 |
| newsletterRoutes.js | 10 | 0 |
| sellerMailHistoriesRoutes.js | 10 | 0 |
| frontMenuRoutes.js | 10 | 8 |
| ticketCategoryRoutes.js | 9 | 8 |
| subAdminRoutes.js | 9 | 0 |
| testimonialRoutes.js | 8 | 6 |
| rolesRoutes.js | 8 | 8 |
| interestCategoriesRoutes.js | 8 | 7 |
| seoPagesRoutes.js | 8 | 7 |
| emailsRoutes.js | 8 | 0 |
| usersDashboardRoutes.js | 8 | 0 |
| contactsRoutes.js | 7 | 5 |
| locationRoutes.js | 6 | 0 |
| registrationsRoutes.js | 6 | 0 |
| settingRoutes.js | 5 | 0 |
| userActivityRoutes.js | 4 | 0 |
| shortcutRoutes.js | 4 | 4 |
| buyerEnquiryRoutes.js | 3 | 0 |
| fileRoutes.js | 2 | 0 |
| adminAuthRoutes.js | 2 | 0 |
| newsletterHistoriesRoutes.js | 2 | 0 |
| pagesRoutes.js | 2 | 0 |
| adminEnquiriesRoutes.js | 1 | 0 |
| categoryConflictLogsRoutes.js | 1 | 0 |
| membershipPlansRoutes.js | 1 | 0 |
| companiesRoutes.js | 1 | 0 |

## First 100 registrations requiring follow-up (397 total)

| Method | Legacy endpoint | Status |
|---|---|---|
| GET | `/v2/api/admin/open-enquiries/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/files/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/files/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| POST | `/v2/api/admin/login` | NO_EXPLICIT_ROUTE_MAPPING |
| POST | `/v2/api/admin/change-password` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/activities/:id/delete_status` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/core_activities/:id/delete_status` | NO_MATCHING_LOCAL_METHOD |
| GET | `/v2/api/ticket_categories/server-side` | NO_MATCHING_LOCAL_METHOD |
| GET | `/v2/api/testimonials/server-side` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/testimonials/:id/status` | NO_MATCHING_LOCAL_METHOD |
| GET | `/v2/api/faq_categories/server-side` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/faq_categories/:id/status` | NO_MATCHING_LOCAL_METHOD |
| POST | `/v2/api/faqcategories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/faqcategories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/faqcategories/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/faqcategories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/faqcategories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/faqcategories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/faqcategories/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/faqs/count` | NO_MATCHING_LOCAL_METHOD |
| GET | `/v2/api/faqs/server-side` | NO_MATCHING_LOCAL_METHOD |
| DELETE | `/v2/api/faqs/delete-selected` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/faqs/:id/status` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/faqs/:id/delete_status` | NO_MATCHING_LOCAL_METHOD |
| POST | `/v2/api/home_banners/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/home_banners/count` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/home_banners/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/home_banners/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/home_banners/delete-selected` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/home_banners/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/home_banners/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/home_banners/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/home_banners/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/home_banners/:id/delete_status` | NO_EXPLICIT_ROUTE_MAPPING |
| POST | `/v2/api/sub_admin/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_admin/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_admin/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_admin/count` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/sub_admin/delete-selected` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_admin/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/sub_admin/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/sub_admin/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/sub_admin/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/knowledge_center/server-side` | NO_MATCHING_LOCAL_METHOD |
| PATCH | `/v2/api/knowledge_center/:id/delete_status` | NO_MATCHING_LOCAL_METHOD |
| GET | `/v2/api/location/countries` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/location/states` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/location/cities` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/location/pincode/:pin` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/location/states/:country_id` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/location/cities/:state_id` | NO_EXPLICIT_ROUTE_MAPPING |
| POST | `/v2/api/buyers/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/count` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/filtered` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/get-buyer-sourcing-interests` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/buyers/delete-selected` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/chart` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/buyers/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/buyers/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/buyers/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/buyers/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/buyers/:id/account_status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/buyers/:id/seller_status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/buyers/:id/delete_status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/membership_plan/:id/delete_status` | NO_MATCHING_LOCAL_METHOD |
| POST | `/v2/api/categories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/master` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/count` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/product-categories` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/category-item` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/sub-category-item` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/item-category` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/sub-items` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/items` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/product-bar-graph` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/seller-bar-graph` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/categories/delete-selected` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/categories/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/categories/:id/category_status` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/categories/:id/delete_status` | NO_EXPLICIT_ROUTE_MAPPING |
| POST | `/v2/api/sub_categories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/count` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/server-side` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/sub_categories/delete-selected` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/product-bar-graph` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/seller-bar-graph` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/category/:category` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/category-all/:category` | NO_EXPLICIT_ROUTE_MAPPING |
| GET | `/v2/api/sub_categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PUT | `/v2/api/sub_categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| DELETE | `/v2/api/sub_categories/:id` | NO_EXPLICIT_ROUTE_MAPPING |
| PATCH | `/v2/api/sub_categories/:id/status` | NO_EXPLICIT_ROUTE_MAPPING |

Use the CSV for **all** entries. Review mappings with original controllers before writing route adapters.
