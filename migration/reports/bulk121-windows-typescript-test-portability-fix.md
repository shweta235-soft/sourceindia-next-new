# BULK121 — Windows TypeScript Test Portability Fix (27 Nov 2026)

## Reported Windows validation

- `npm run test:api:bulk121`: 16 PASS, 2 FAIL because two mock tests hardcoded a Linux global TypeScript installation at `/opt/nvm/versions/node/v22.16.0/...`.
- `npm run test:api:bulk121:db`: 6/6 PASS, read-only MySQL schema preflight.
- `npm run build`: Next.js 16.4.6 production compilation and TypeScript checks PASS on the user's Windows machine.

## Exact correction

- `scripts/bulk121-ticket-admin-behavior.test.mjs`: use `createRequire(import.meta.url)('typescript')`, resolving the declared local devDependency instead of a Linux absolute path.
- `scripts/bulk121-ticket-write-bridge.test.mjs`: same change.
- `scripts/bulk121-typescript-portability.test.mjs`: regression check verifies both tests resolve TypeScript using its package name and have no hard-coded Linux install location.
- `package.json`: includes the regression check in `test:api:bulk121`.

Neither runtime API handlers nor database, authentication, original React/Express source, or UI was modified by this fix.

## Tested here

- `npm run test:api:bulk121`: **22/22 PASS**.
- Combined BULK114–121 regression tests, including additional date-parity and portability tests: **101/101 PASS**.
- No actual MySQL connection or full production build run here. The user's previously shared local build PASS predates only test-script changes.

## Windows verification

Unzip over `E:\nextjs\sourceindia-next-new` while **preserving `.env.local`, `.git` and `node_modules`**, then run:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk121
npm run test:api:bulk121:db
npm run build
```

The `typescript` package must be installed from the project's dependencies. If missing, run `npm ci` in the Next.js project (don't remove local `.env.local`).

**Caution:** Original ticket write handlers in BULK121 are still behind default-disabled compatibility guards. They are not native write conversions and must not be enabled against a live database.
