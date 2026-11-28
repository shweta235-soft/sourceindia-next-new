# BULK128 Front Menu parity follow-up

## Reported Windows comparison (before this patch)

- GET: MATCH=2, DIFF=3, ERROR=0. Mismatches were `created_at` and `updated_at` in menu list, grid and detail, including nested submenus.
- Search: MATCH=6, DIFF=2, ERROR=0. Mismatches were the three company result entries for `seller&q=india` and `buyer&q=india`, including IDs, names, slugs and URLs.

## Changes

- Serialize Front Menu GET `created_at` and `updated_at` as UTC ISO-8601 text at SQL read time, consistent with Sequelize JSON date formatting and other previously parity-tested modules. Applied to list, detail and grid, including submenu objects built from list rows.
- Remove forced `ORDER BY u.user_id ASC` on seller/buyer company suggestion SELECT. Original Sequelize `Users.findAll` has no explicit `order`; the forced sort could select different first three companies. No other SQL filters or QA write guards changed.
- Include source regression tests in `npm run test:api:bulk128`.

## Limitations

These are source-grounded targeted fixes; local Windows/MySQL Express-vs-Next retest is still required. GET list/date mismatch could differ depending on the database column type/timezone. No authenticated QA writes or SMTP side-effect parity were executed. No live database data is changed by the supplied tests.
