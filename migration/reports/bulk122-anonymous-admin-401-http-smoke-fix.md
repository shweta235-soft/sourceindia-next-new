# BULK122 — Anonymous admin HTTP smoke expectation correction

## Reported Windows result

- Original nine `/v2/api/tickets/*` write probes: `403` as expected (9/9 PASS).
- Four `/admin/api/local/tickets/*` write probes: HTTP `401`, but previous smoke script expected `403` (4 false failures).

## Confirmed source behavior

`src/proxy.ts` matches `/admin/:path*` and returns JSON `401` for `/admin/api/local/*` when the signed admin session is absent. These anonymous calls never reach the ticket write handler. `/v2/api/tickets/*` is not matched by the `/admin` middleware, so default-disabled native ticket writes return `403` through `ticketQaGate()`.

Both responses are authorization denials; no database write is permitted. Do not remove the admin authentication guard or expose an admin cookie to other paths merely to get a `403`.

## Change

- `scripts/test-local-bulk122.ps1`: four `/admin/api/local/tickets` expected statuses corrected from `403` to `401`, explanatory output added.
- `scripts/bulk122-anonymous-http-contract.test.mjs`: added source regression to confirm all 13 expected statuses and the existing guard order.
- `package.json`: BULK122 command now runs the new regression.
- No application API handlers, proxy, frontend, database schema/data, or secrets changed.

## Windows verification

Keep `npm run dev` running, then run `npm run test:api:bulk122` and `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk122.ps1`. Expected local smoke: `PASS=13 FAIL=0 TOTAL=13` (not independently verified on Windows). Does **not** establish authenticated admin or write parity.
