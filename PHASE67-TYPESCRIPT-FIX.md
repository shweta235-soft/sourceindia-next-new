# SourceIndia Phase 67 — TypeScript fix

## Issue
`src/app/api/local/auth/session/route.ts` failed TypeScript because `Omit<LocalAccountRow, "password">` dropped named properties from the `RowDataPacket`-extended type.

## Fix
`src/lib/localAccountDatabase.ts` now returns `LocalSessionAccount`, an explicit `Pick` of the six non-password fields used by the session API. The SQL remains unchanged and still does not select `password` in `accountById`.

## Install/build
Preserve your `.env.local` when replacing the project. Run `npm ci` followed by `npm run build`. Do not copy `node_modules` from ZIP.

Existing UI, login routes, and database schema were not changed. Full production build not performed in this packaging environment.
