# Phase 67 — dependency lockfile repair

## Cause
The previous package-lock.json omitted two required transitive dependencies: iconv-lite@0.6.3 for mysql2@3.14.3 and lru-cache@7.18.3 for named-placeholders. `npm ci` therefore failed with EUSAGE before mysql2 and bcryptjs were installed.

## Changes
Added missing lockfile entries at their nested package locations. Existing UI, authentication logic, React source and database are unchanged.

## Verification
- `npm ci --dry-run --offline --ignore-scripts --no-audit --no-fund`: PASS (lockfile-consistency check, not a real install).
- `node --experimental-strip-types --test tests/*.test.mjs`: 25/25 PASS on Node 22 in the packaging environment.
- Full production build and database-backed endpoints were not verified here.

## Windows verification
1. Back up the existing Next.js project and keep `.env.local`.
2. Replace Next.js project files with this full ZIP.
3. Run `npm ci` and then `npm run build` from E:\\nextjs\\sourceindia-next-new.
4. Verify Seller, Buyer and Admin login still work.

Do not modify the original React project or existing database content.
