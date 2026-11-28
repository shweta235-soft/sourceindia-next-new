# BULK116: Legacy Products API trailing-slash HTTP 308 fix (27 November 2026)

## Reported failure and root cause

On Windows, the `test-local-bulk116.ps1` source tests and MySQL INFORMATION_SCHEMA
checks passed. The live local GET smoke checks reported `PASS=12 FAIL=2 TOTAL=14`.
Both failures used the exact legacy path `/v2/api/products/` (trailing slash):

- `GET /v2/api/products/?limit=2&is_front=1` => 308 instead of 200.
- `GET /v2/api/products/?is_approve=0` => 308 instead of 400.

By default, Next.js permanently redirects trailing-slash URLs to their
non-trailing-slash counterpart. The endpoint itself was not shown failing.

## Fix

- `next.config.ts`: set `skipTrailingSlashRedirect: true` to disable the
  framework-generated 308 redirect so the legacy URL reaches its local
  GET handler directly and returns the appropriate JSON status.
- `scripts/test-local-bulk116-http.mjs`: keep `redirect: 'manual'` for honest
  parity testing; also assert the non-trailing-slash URL works. Smoke suite now
  has **16** GET checks.
- `scripts/bulk116-contracts.test.mjs`: add a regression assertion covering
  this Next.js setting and the exact original URL path.

The configuration is project-wide, affecting automatic trailing-slash
canonicalization across Next.js routes. It does not modify existing handler
business logic, page files, database schema/data, the original React/Express
source, or any local secrets. Original Express response-body parity remains
unverified and is not claimed by this fix.

## Windows verification

1. Extract the full project archive into `E:\nextjs\sourceindia-next-new`,
   preserving `.git`, `.env.local`, and `node_modules`.
2. **Restart** the development server after changing `next.config.ts`:
   stop the currently running `npm run dev` with Ctrl+C, then run `npm run dev`.
3. In a separate PowerShell terminal within the project folder, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk116.ps1
   ```

4. Expected HTTP summary: `BULK116 LOCAL HTTP RESULTS: PASS=16 FAIL=0 TOTAL=16`,
   provided the previously passing DB-dependent checks remain healthy.
5. Stop dev with Ctrl+C and run `npm run build` for production verification.

## Verification at packaging time

The source regression suite is run without connecting to the user's local
Windows/MySQL environment. The live DB HTTP and production build must be
confirmed on the user's machine.
