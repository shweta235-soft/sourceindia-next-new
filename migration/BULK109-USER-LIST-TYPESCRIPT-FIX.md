# Bulk109 Users page-first TypeScript build correction

The enriched MySQL result is ordered using `bulk109OrderByIds`, which requires a row `id`. The SELECT projection already declares `u.user_id AS id`, but the `db.execute<RowDataPacket[]>` generic did not declare that field to TypeScript. The enriched SELECT now uses `db.execute<(RowDataPacket & {id:number|string})[]>`; the output remains assignable to `RowDataPacket[]`, and the ID-order helper receives the required typed alias. No database or runtime SQL changes.

This addresses the TS2322/TS2345 errors reported for line 245 of `src/lib/localBulk109Admin.ts`. The regression test asserts the typed query. The full Next.js production build has not been verified in this environment (offline npm cache lacks required packages).
