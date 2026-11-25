# SourceIndia Bulk90 — Admin FAQ CRUD / category safeguards

Built on the corrected Bulk89 full project. Original Express `faqController.js`, `faqCategoryController.js` and Sequelize models inspected read-only.

## Additions

- `POST /admin/api/local/faqs` — Create FAQ (strict title, description, category ID, numeric status 0/1). Returns 201, requires an existing FAQ category.
- `PUT /admin/api/local/faqs/{id}` — Edit FAQ, exact validated fields.
- `DELETE /admin/api/local/faqs/{id}` — Soft-delete FAQ through `is_delete=1`, never destructive SQL deletion.
- `POST /admin/api/local/faqs/categories` — Create FAQ category.
- `PUT /admin/api/local/faqs/categories/{id}` — Edit FAQ category.
- `DELETE /admin/api/local/faqs/categories/{id}` — Returns 409 for authenticated admin because `faqcategories` has no `is_delete` field; no destructive deletion is permitted.

All mutation operations require the existing **signed Admin session**, same-origin request (except blocked category deletion), and `LOCAL_ADMIN_FAQ_WRITES_ENABLED=true`; default is disabled. No admin UI or existing database/schema changes are made. Do not enable the flag until authenticated admin write flows have been reviewed and backups made.

All endpoints use parameterized SQL and bound input lengths. This does **not** establish 100% parity with the original Express backend, including rich HTML handling, global uniqueness constraints, or administrative audit logs.

## Testing

With Node.js 24 in `E:\nextjs\sourceindia-next-new`:

```powershell
node --test src/lib/localAdminFaqWrite.test.mjs src/lib/localAdminFaq.test.mjs src/lib/localAdminFaqProxy.test.mjs
npm run build
npm run dev
```

In a separate PowerShell terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk90.ps1
```

Expected: `BULK90 SAFE TEST RESULTS: PASS=6 TOTAL=6`.

No new dependencies. Source tests passed 15/15 in packaging environment with Node 22 `--experimental-strip-types`. Actual production build / Windows HTTP runtime remain unverified.
