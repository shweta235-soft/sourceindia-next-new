# BULK116 — Original-path public Products/Companies GET adapters (27 Nov 2026)

## Sources and scope

- Source reference (read-only): uploaded original `sourceindia-main-new (1).zip`: `backend/routes/productsRoutes.js`, `backend/controllers/productsController.js`, and `backend/models/{Products,CompanyInfo,ProductKeyword,ItemSubCategory,UploadImage,ReviewRating,Users}.js`. No original React/Express source files or data were changed.
- Baseline: BULK115 Windows extraction fix full-project ZIP. All original UI and existing local APIs retained.
- **Eight distinct GET endpoint paths** added in `src/app/v2/api/products/`. These were not present in the BULK115 ZIP. No POST, PUT, PATCH, DELETE, email, OTP, external service call, DB write or schema change added.
- All SQL uses fixed table/column names and parameterized user inputs. List limit capped at 50; page capped at 1000; suggestion candidate scan capped at 180; company enquiry products capped at 200; product detail images capped at 30 and related products/companies at 12. Duplicate, unknown and malformed parameters are rejected. Public API queries **never expose drafts/unapproved/deleted products**, unapproved users or private credentials.

## The eight routes (GET only)

| Original Express endpoint | BULK116 local output | Important difference from Express |
|---|---|---|
| `/v2/api/products/` | `{total,products}` with public approved catalog, basic category/image/company fields and common filters | Express can list drafts/admin records and has additional filters and joins; this public-only adapter deliberately does not |
| `/v2/api/products/all-products?company_id=ID` | `{success,message,data}` list of product ID/title/description | Draft/unapproved products excluded and max 200 titles; original did not filter approvals |
| `/v2/api/products/latest-home` | `{products,refreshed:false,has_more}` with latest six approved products and image/category fields | **Does not rotate products or update `home_settings`**; original latest-home does writes/offset tracking. This is a read-only approximation, not a behaviorally equivalent replacement |
| `/v2/api/products/suggest?query=TERM` | `{success,normalized_query,tokens,data,auto_classification,alternatives}` and optional taxonomy filters | Ranked active product-keyword suggestions; original has weighted, typo-tolerant multi-stage matching; exact score/rank/classification parity not verified |
| `/v2/api/products/filtered` | Limited public-only filtered product list, source-shaped array | Original can query admin fields, date ranges and unapproved products; these are intentionally not supported publicly |
| `/v2/api/products/companies` | `{total,companies}` with safe company metadata, logo and product counts | Company/user/category/interest association fields, full filters, and sort semantics are not 1:1. Unsupported interest filters return 400; buyer account data not exposed |
| `/v2/api/products/companies/[id]` | Source-shaped public company detail, product previews and suggested companies | Original categories and recommendations are more complex; this adapter returns empty category names and different recommendation behavior pending parity work |
| `/v2/api/products/details/[id]` | Product detail with images, average ratings, category names and similar products | Complete association, recommendations and fallback semantics need live DB comparison |

**Warning:** Route/method parity ≠ business/response parity. The BULK116 additions are an incremental read-only compatibility layer. **The complete set of 516 Express registrations remains NOT fully migrated or 1:1 verified.** Other original endpoints including `POST /products/`, `GET /products/count`, `GET /products/server-side`, company review and writes are NOT implemented here. Existing UI continues using the configured `NEXT_PUBLIC_API_BASE_URL`; no frontend switch is made. Do not claim Phase 3 complete.

## Focused verification in packaging environment

- `npm run test:api:bulk116` — **14/14 source, validation and TypeScript syntax checks PASS**.
- BULK114+115+116 source suites combined — **36/36 PASS**.
- New route paths and schema column names compared to original Express route/controller and Sequelize models; no source was modified.
- **Not run in the packaging environment:** `npm run build` (Next.js node_modules missing), live Windows MySQL `INFORMATION_SCHEMA`, live HTTP GET smoke or real Express vs Next sample-row comparisons. No parity claims without those results.

## Windows installation / tests

Back up project first. Extract this **complete project ZIP** into `E:\nextjs\sourceindia-next-new`, **preserving** the current `.env.local`, `.git` and local `node_modules`. Never extract into `D:\sourceindia`. Do not enable Admin writes.

In PowerShell:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk116
npm run test:api:bulk115
npm run test:api:bulk114
npm run build
npm run dev
```

In a **second** PowerShell window after `npm run dev` starts:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk116.ps1
```

The combined PowerShell test runs the 14 source checks, a **read-only schema preflight of 14 tables**, and **14 GET-only local HTTP smoke calls**. HTTP smoke requires an accessible local DB and requests no credentials or destructive actions. Some valid GET endpoints may require existing rows to return nonempty data; empty lists are allowed. For critical frontend go-live, compare each output with the original React/Express endpoint under test fixtures and security review.

If tests fail, send exact `FAIL` output. Do not modify database structure or data simply to make a test pass.
