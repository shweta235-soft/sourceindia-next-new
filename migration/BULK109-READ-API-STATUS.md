# Bulk109 — Admin management safe reads, 26 November 2026

## Delivered in this full-project ZIP

**42 new GET route exports** (7 modules × six operations):

| Module | Operations |
|---|---|
| Sellers | list, count (legacy-style summary), server-side, filtered, detail, summary |
| Buyers | list, count (legacy-style summary), server-side, filtered, detail, summary |
| Users | list, count, server-side, filtered, detail, summary |
| Companies | list, count, server-side, filtered, detail, summary |
| Enquiries | list, count, server-side, filtered, detail, summary |
| Tickets | list, count, server-side, filtered, detail (with up to 200 replies), summary |
| Buyer Enquiries | list, count, server-side, filtered, detail, summary |

All route prefixes are `/admin/api/local/{module}`. `GET /admin/api/local/{module}?page=1&limit=10` returns `{items,page,limit}`. `/server-side` and `/filtered` return `{data,totalRecords,filteredRecords,page,limit}`. `/count` and `/summary` return numeric totals; seller/buyer summaries include `statusActive`, `statusInactive`, `notApproved`, `deleted`, and `addedToday` (seller also includes `notCompleted`). `/:id` returns `{item}` (tickets also include `{replies,lastReply}`). Original Express response shape is not claimed identical.

All SQL projections enumerate approved fields explicitly and exclude Users.password, Users.real_password, OTP, email_token, remember_token, Tokens, Ticket OTP/token; Admin authorization uses a signed cookie. Ticket reads additionally resolve the **current** Admin role against `admins`/`roles` and limit tickets to the assigned category, except the original superadmin role (4), or roles configured for all categories. Missing role metadata is denied. Result pages are capped at 100 rows and offsets at 1 million. Invalid pagination, sort, search, category or undocumented resource-specific filters are rejected. MySQL placeholders bind all user values, with escaped LIKE wildcards and approved SQL identifiers.

No new POST/PUT/PATCH/DELETE handlers, emails, uploads or schema changes. The original React and Express project was **inspected read-only**.

## Important functional limitations

- This batch is **NOT a complete migration of all remaining APIs**. Counting *exports* is not proof of parity. More complex original Seller/Buyer category/product associations, Ticket admin permissions beyond the documented role/category check, Enquiry workflow transitions, and original list/response shape are still not fully migrated/verified.
- Seller/Buyer `addedToday` counts use midnight-to-midnight Asia/Kolkata mapped to UTC-string bounds, assuming the DB's DATETIME values are UTC. Verify actual database timestamp semantics before relying on business-day counts.
- No local DB exists inside the ZIP and no live MySQL reads or production Next build were performed by the package author. User must verify in their own Windows environment.
- `GET /admin/api/local/tickets` may return 403 for an Admin whose local role has no authorized ticket category; tests report scope restriction rather than pretending successful ticket data reads.
- All 516 old route registrations remain in the static worklist at `migration/reports/full-api-migration-worklist.csv`. Current method/path candidates are **216**, with **300 without matching method/path shapes**. **0 are marked fully behaviorally equivalent** by the static tooling.

## Verification

Run on Windows with current `.env.local` and existing `npm` dependencies, and Next dev server already started:

```powershell
cd E:\nextjs\sourceindia-next-new
npm run build
npm run dev
# New PowerShell terminal, with dev server running:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk109.ps1
```

The combined script runs pure/source and mock verification, regenerates the complete method/path report, performs a read-only MySQL `INFORMATION_SCHEMA` preflight for the 12 tables referenced by Bulk109, then prompts for an existing Admin login **locally** and requests only signed, paginated GETs, one invalid ID/sort/page each module, and a detail read only if a real row exists. It does **not** execute any business writes or disclose credentials.

If preflight fails, capture only table/column diagnostics, not `.env.local` values or personal data. If authenticated reads fail, capture the HTTP/result summary; returned Admin row data may contain PII and should not be pasted into a public conversation.


## Bulk109 live verification diagnostic patch — 26 November 2026

The user's **BULK109 AUTH READ RESULTS: PASS=56 FAIL=3 SKIP=0 TOTAL=59**
confirms three live failures, but their individual `FAIL ...` lines, HTTP status and
endpoint names were not supplied. **This patch is not a claim that the three
live failures are resolved.** It keeps current business reads unchanged while
making the actual failing endpoint and failure stage visible safely.

- Non-production Admin read `503` responses may include `{diagnostic:{kind,action,stage,code}}`.
  The code is a sanitized DB error *identifier only*: SQL text, field values,
  credentials and returned records are not logged. Production responses omit it.
- `scripts/test-local-bulk109-auth.mjs` prints a `SAFE DIAG` line for each failed
  check, and GET-only count/summary probes if a listing failed. These probes do
  not contribute to the pass/fail total or modify data.
- Ticket role `ticket_category=NULL` is now denied instead of accidentally being
  converted by `Number(null)` to unrestricted category `0`.
- New deterministic mock test reproduces exactly three distinct failures and
  confirms the diagnostic output and absence of credentials.

**After re-running, share only `FAIL` and `SAFE DIAG` lines**, plus the combined
summary. Do not paste database rows, cookies, login credentials, or `.env.local`.
The exact MySQL query failure(s) cannot be corrected without identifying the
actual endpoint(s)/error code(s) from the user's environment.
