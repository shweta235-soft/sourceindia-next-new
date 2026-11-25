# Bulk99 Turbopack duplicate-declaration build fix

Fixes six Turbopack errors in two Admin API routes:
- src/app/admin/api/local/front-menu/route.ts
- src/app/admin/api/local/knowledge-center/route.ts

The GET and POST handlers are preserved. Each route now has one NextRequest type import, one database import, one adminFaqResponse import, and one literal `export const runtime = 'nodejs'`.

No dependencies, database schema, existing user-facing UI, or write configuration changed. Original React project remains read-only.

Run: `npm run build`, then `node --test src/lib/localContentWrites.test.mjs`, and the existing Bulk99 safe test script.
