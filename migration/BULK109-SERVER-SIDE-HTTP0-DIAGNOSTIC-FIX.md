# Bulk109 follow-up: server-side HTTP=0 diagnostics and read-only COUNT efficiency

## Observed real-world result

The signed-Admin read harness reported `PASS=56 FAIL=3 TOTAL=59`; the first failure was:

```
FAIL sellers:server-side: HTTP=0 expected=200
SAFE DIAG sellers:server-side: reason=HTTP_STATUS; stage=not-returned
```

This output **does not establish** that the server returned an HTTP 0 response; HTTP 0 was a catch-all value in the client for a request failure **or** a response-body/JSON parsing error. Actual live causes of all 3 failures remain unverified until a fresh run.

## Changes in this follow-up

- `scripts/test-local-bulk109-auth.mjs`: distinguish `REQUEST_TIMEOUT`, safe connection errors, `NON_JSON_RESPONSE`, `JSON_PARSE_ERROR`, `RESPONSE_TOO_LARGE`, and `RESPONSE_SHAPE`; retain actual HTTP status when already received. Include elapsed milliseconds without printing headers, credentials, cookies, SQL, DB rows, request body, or server trace.
- `src/lib/localBulk109Admin.ts`: the `server-side` response now uses a direct base-table `COUNT(*)` rather than counting over the joined listing projection; when there are no extra filters, the filtered count reuses that value. Search filters that reference joined columns still use the original joins. Other non-seller/buyer count requests without joined search now use direct base-table counts.
- Server-side GET-only timeout increased to 60 seconds; ordinary requests remain at 20 seconds. Performance should still be investigated if this timeout is reached.
- Regression tests verify unchanged mock signed-Admin behavior, diagnostic accuracy for malformed JSON, bounded query validation, and absence of write operations.

## Safety and verification

- No React reference files modified.
- No database schema, migrations, data writes, deletions, email sends, or uploads.
- Existing Next.js page/UI route files preserved.
- The update does **not** claim the 3 live failures are fixed until rerun against the user's MySQL setup.

## Rerun on Windows

After extracting the **entire** ZIP into `E:\nextjs\sourceindia-next-new` while preserving `.env.local` and `.git`:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
npm run dev
```

In a separate PowerShell terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109-auth.ps1
```

Report the `FAIL` and `SAFE DIAG` lines, or the combined result if all checks pass. Do **not** share credentials or cookies. If a `READ_FAILURE` code is returned with a 503, preserve the stage and SQL error code but do not share query strings or private database rows.
