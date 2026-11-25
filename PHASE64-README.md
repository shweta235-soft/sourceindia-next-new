# Phase 64 — Public detail login return redirect

Base: Phase 63 full project ZIP.

## Fix
- `src/lib/accountLoginRedirect.ts` now recognizes the `redirect` query parameter used by ProductReviewModal and CompanyDetailPage after login.
- Only product and company detail slug paths are accepted: `/products/<slug>` and `/companies/<slug>` (ASCII letters, numbers, underscore, hyphen).
- `returnTo` remains limited to known account routes and takes priority. Invalid destinations fall back to `/dashboard`.
- No API, authentication token, UI, or database schema changes.

## Checks
- `node --experimental-strip-types --test tests/*.test.mjs` => 15 tests passing in this environment (Node 22).
- Production Next.js build not run here. On the user's Windows Node 24 project, run `npm run build`.

## Browser tests
1. Seller and Buyer login normally => `/dashboard`.
2. Logged-out product detail -> submit Product Review -> log in -> return to same product URL.
3. Logged-out company detail -> Connect -> log in -> return to same company URL.
4. Refresh and logout remain functional.
5. `http://localhost:3000/login?redirect=https%3A%2F%2Fevil.example` => dashboard after login, never external.

Apply the complete ZIP over the existing project after backup; retain your local `.env.local`.
