# BULK116 TypeScript build fix — 27 November 2026

## User-reported build failure

`npm run build` failed in `src/lib/localBulk116Products.ts` with 12 `TS2339` property-access errors for `id`, `title`, `category_name`, `sub_category_name`, `company_name`, `code`, `article_number`, `is_gold`, `is_featured`, `is_recommended`, `best_product`, and `created_at`, plus `TS2345` for an incompatible `.sort()` comparator.

## Fix

- Added explicit `PublicProduct` type (`Record<string, unknown>` plus required normalized public fields) to the return of `normalizeProduct`. Destructuring a MySQL `RowDataPacket` removes its index signature from the inferred spread result, even though SQL returns the selected columns. The return assertion does not alter the JSON output.
- Preserved `title` as an explicit property on suggestion rows, and removed an overconstrained manual comparator signature so TypeScript infers the actual mapped suggestion shape. Ranking order remains unchanged.
- No changes to route paths, HTTP methods, DB schema/data, SQL, React source, or existing frontend.

## Verification

- `npm run test:api:bulk116`: 15/15 passed, including a static regression check for the type shape.
- `tsc --noEmit` for the actual repaired `localBulk116Products.ts` with isolated declarations for external modules: PASS. This is a **targeted module type check, not a full Next.js build**.
- Full `npm run build`, live MySQL and live HTTP parity **not verified in the artifact environment**; dependencies were unavailable.

## Windows check

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
```

Stop `npm run dev` before building. To test HTTP endpoints afterward, start `npm run dev` in one terminal and run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk116.ps1` in another.

## Installation warning

This is a complete project ZIP with flat root (`package.json` at its root). Preserve your own `.env.local`, `.git`, and `node_modules` when extracting. The original React project is read-only.
