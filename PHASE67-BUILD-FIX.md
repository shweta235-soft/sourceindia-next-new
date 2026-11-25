# Phase 67 – Build dependency resolution fix

## Root cause
Phase 67 imports `mysql2/promise` in `src/lib/localAccountDatabase.ts` and `bcryptjs` in `src/lib/localPasswordLogin.ts`. Both are declared in `package.json` and `package-lock.json`, but `node_modules` is not shipped with project ZIPs. After replacing project files, existing `node_modules` may be missing these newly added packages.

## Steps on Windows (without manually editing code)
1. Back up the current Next.js project. Extract this entire ZIP to `E:\nextjs\sourceindia-next-new` and retain the existing `.env.local`.
2. In that folder, run `npm ci` (downloads and installs locked dependencies; requires network access).
3. Run `npm run build`.
4. Check existing Seller/Buyer/Admin login behavior. Local API endpoints remain opt-in and are **not connected to production login**.

The `prebuild` script now fails early with explicit installation instructions if `mysql2/promise` or `bcryptjs` cannot resolve. No authentication behavior or database data/schema was changed.

### Note
`npm ci` re-creates `node_modules` using the lockfile; this is expected. Do not share `.env.local` or access tokens.
