# Bulk109 follow-up: Users list read timeout (2026-11-26)

## Evidence from the user's live run

- `BULK109 AUTH READ RESULTS: PASS=58 FAIL=1 SKIP=0 TOTAL=59`
- `FAIL users:list: HTTP=0 expected=200`
- `SAFE DIAG users:list: reason=REQUEST_TIMEOUT; stage=fetch; elapsedMs=20015`
- Diagnostic `users:count` returned HTTP 200.

This proves the authenticated Users list did not complete within the 20-second client budget; it does **not** prove the database query was the only cause. The previous list SQL joined `users`, `company_info`, `countries`, `states`, and `cities` before applying `LIMIT`. The query plan on the user's real MySQL instance has not been observed.

## Targeted, read-only performance correction

- For `users` list, filtered, or server-side requests **without text search** and sorted only on columns in `users`, the app first selects a validated, bounded page of **user IDs from `users` only**. The SQL keeps existing filters, page and sort direction and a stable ID tie-breaker.
- The app next fetches the existing **explicit safe field projection** (including optional company/location names) for *only those IDs*; it restores the exact initial page order in application memory. It does not fetch or return password, real_password, OTP, or token columns.
- Queries with text search or sorting by joined company/location columns retain the existing single-query logic so their match/sort semantics are unchanged.
- Existing count, summary, detail, Admin authentication, ticket role scope, and query allowlists are unchanged. The existing maximum page size is 100.
- Added `bulk109-users-page-first.test.mjs` with four regression checks, included in `npm run test:api:bulk109` and the combined Windows PowerShell script.
- No database schema changes, indexes, writes, email sends, uploads, physical deletes, or React reference edits.

## Verification status

- Source/contract/mock and prior API regression tests passed on the ZIP author environment (68/68 using Node with TypeScript strip support).
- Actual MySQL performance, Windows production build, and all 59 live Admin read checks must be verified on the user's environment.
- This is a targeted performance fix, **not** a claim of all 516 Express API business-logic parity.

## Windows rerun

Preserve `.env.local` and `.git` when extracting the full ZIP. Restart the Next.js development server after updating files:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
npm run dev
# In another PowerShell terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109-auth.ps1
```

Expected if it works with the local schema/load: `BULK109 AUTH READ RESULTS: PASS=59 FAIL=0 SKIP=0 TOTAL=59`. Report only `FAIL` and `SAFE DIAG` lines if any check is still failing; never share credentials/cookies/database rows.
