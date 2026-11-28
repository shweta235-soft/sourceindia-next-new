# BULK120 Windows PowerShell 302 smoke-test fix — 2026-11-27

## Observed failure

The user reported six passing HTTP tests, then the last test `GET /v2/api/tickets/support-ticket/track/test-bulk120` threw `Operation is not valid due to the current state of the object.` in Windows PowerShell. The status expected by the script was HTTP 302, and `Invoke-WebRequest -MaximumRedirection 0` can throw in Windows PowerShell 5.1 when detecting an HTTP redirect.

## Correction

For only the expected-redirect test, `scripts/test-local-bulk120.ps1` uses .NET `HttpClient` with `AllowAutoRedirect=false`. The remaining six tests continue using their previous request logic. Test still compares **actual status == 302**; it does not suppress nonmatching HTTP responses or treat network failure as PASS. Resources are disposed at script end.

Added `scripts/bulk120-redirect-http-regression.test.mjs` to `npm run test:api:bulk120`. No ticket handler code, API response logic, authentication, DB, frontend, or Express source was modified.

## Validation

BULK120 source/regression tests: 6/6 PASS. BULK119 regression tests: 19/19 PASS. The updated PowerShell integration test **cannot be run on this Linux artifact environment** and requires Windows `npm run dev` plus the PowerShell command below. No build or database parity claim follows from these checks.

```powershell
npm run test:api:bulk120
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk120.ps1
```

Expected target: `BULK120 LOCAL HTTP RESULTS: PASS=7 FAIL=0 TOTAL=7`.
