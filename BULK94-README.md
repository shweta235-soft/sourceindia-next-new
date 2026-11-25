# Bulk94 – Authenticated Admin Testimonials Tests

Adds `scripts/test-local-admin-testimonials-bulk94.ps1` and its Node.js HTTP client. No APIs, schema, source UI or dependencies changed from Bulk93.

## Run (Windows PowerShell 5.1 / Node 24)

1. Preserve `.env.local`, apply this complete project ZIP, run `npm run build` and restart `npm run dev`.
2. Open another terminal in the Next.js project and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-testimonials-bulk94.ps1
```

Use the same existing Admin credentials that worked for Bulk91. The script captures its isolated Admin cookie and tests login, session validation, listing, count, bad detail ID, invalid filter, logout, and access after logout. **No testimonial PATCH/PUT/POST/DELETE is sent.**

Expected when configured correctly: `BULK94 AUTHENTICATED RESULTS: PASS=8 FAIL=0 SKIPPED=0 TOTAL=8`.

No live tests have run in this packaging environment. Actual authenticated database reads remain pending until user execution. Git push not performed. Original React reference remains read-only.
