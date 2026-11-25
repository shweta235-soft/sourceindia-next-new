# Bulk74 Next.js 16 runtime config fix

The previous compatibility routes re-exported `runtime`. Next.js 16 requires route segment config values to be static, locally declared literals. These two aliases now declare `export const runtime = 'nodejs'` and forward their GET handlers to existing catalog routes.

Changed:
- `src/app/api/local/products/route.ts`
- `src/app/api/local/categories/route.ts`

The routes preserve the existing public catalog response contracts and database logic. `src/app/api/local/subcategories/route.ts` already defined a local literal runtime; no change was needed there.

## Verify locally
1. Preserve `.env.local` and replace project using this ZIP.
2. Run `npm run build` (no new npm dependencies).
3. Run `npm run dev`, then visit `/api/local/products`, `/api/local/categories`, and `/api/local/subcategories?categoryId=<actual id>`.
4. `503` means MySQL configuration/queries require further verification, not a route compilation error. Do not share database credentials.

Only static route-config regression was verified in this delivery; full Next.js build and real database responses were not run in the packaging environment.
