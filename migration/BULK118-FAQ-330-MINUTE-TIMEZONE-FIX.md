# BULK118 — FAQ `updated_at` session-timezone compatibility fix (27 November 2026)

## Evidence

The last user-run real MySQL differential comparison showed `MATCH=13 DIFF=5 ERROR=0 TOTAL=18`, and every mismatch was only the FAQ `updated_at` field. For `/v2/api/faqcategories/` and `/server-side`, the safe diagnostic reported `delta-minutes:330` (the Next.js timestamp was 5 hours 30 minutes later than Express). The companion `created_at` fields already matched.

## Implementation

- Adjust only FAQ `updated_at` in the SQL projection to undo the current **MySQL session timezone offset**: `DATE_ADD(f.updated_at, INTERVAL TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) SECOND)`. This is a read-only expression evaluated by MySQL. If MySQL is already in UTC, the offset is zero. No hardcoded India offset is introduced.
- Leave FAQ `created_at`, all other response fields, other native APIs, original Express and the database untouched.
- Keep prior zero/incomplete-date-to-JSON-null handling.
- Apply the projection consistently to FAQ list, detail and server-side grid; both `/faq_categories` and `/faqcategories` aliases share the handlers.
- Extend field-only, no-data differential diagnostics to both FAQ URL aliases.

This is a data-driven candidate correction for the user's observed 330-minute drift. A live database test is still required to establish actual parity. This is not evidence that every timestamp in the application should be shifted.

## Verification performed in package environment

- BULK114–118 combined source/bridge regression tests: **60/60 PASS** (including new timezone SQL guards). The original backend's pre-existing dependency tree was used for bridge-only tests, and is **not** bundled in the project.
- Parity script JavaScript syntax check: PASS.
- No mutation statements introduced; zero files changed under the original React/Express reference project.
- Full Next.js production build and local MySQL response comparison: **NOT RUN** here; user's environment required.

## Windows verification

Keep `.env.local`, `.git` and `node_modules` from the existing project and extract this complete-project ZIP to `E:\nextjs\sourceindia-next-new`.

```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk118:correction
npm run build
```

Then start `npm run dev`, leave it running, and in a second terminal run:

```powershell
npm run test:api:bulk118:parity
```

**Goal**: `MATCH=18 DIFF=0 ERROR=0 TOTAL=18`. This is a target, not a verified result.

If mismatches remain, share only the printed `fields=` and `updated_at_diagnostic=` portions, which don't reveal row values. If the MySQL session timezone differs across databases, this offset expression may not be appropriate for every schema; the live result will determine the next correction.
