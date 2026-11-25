# Bulk88 — FAQ local API addition

Prior baseline: Bulk87 original Express inventory **516 registrations**, Next.js **41 local route files / 46 exported methods**. These are not comparable parity counts.

New read-only public GET routes (4 route files; 4 GET method declarations):

- `/api/local/faqs`
- `/api/local/faqs/count`
- `/api/local/faqs/[id]`
- `/api/local/faqs/categories`

Updated source-declaration baseline: **45 local route files / 50 exported HTTP handlers**. These counts reflect static route handlers, **not** fully migrated legacy-equivalent APIs. Exact remaining original API count remains unverified.

Original frontend and database untouched. Local FAQ list intentionally excludes soft-deleted entries, which differs from legacy public list's omission of that filter. The new `/api/local` response structures are not directly wired into React/Next frontend yet. Windows Next.js build and database runtime tests are pending.
