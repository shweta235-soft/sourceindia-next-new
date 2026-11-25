# Bulk92 — Public Testimonials (3 read-only API endpoints)

Based on the original Express `/v2/api/testimonials` router and Sequelize `Testimonials`/`UploadImage` models; the reference was read-only.

- `GET /api/local/testimonials?page=1&limit=20` — active, non-deleted testimonials listing
- `GET /api/local/testimonials/count` — filtered public total
- `GET /api/local/testimonials/{id}` — active, non-deleted testimonial detail, 400 invalid ID, 404 not found

Uses parameterized mysql2 queries against existing `testimonials` and `upload_images`; no new database tables/migrations/dependencies or UI changes.

The original legacy GET list/count includes inactive records; the new **public** endpoints deliberately exclude inactive and soft-deleted entries. This is **not exact legacy response parity** and isn't wired into the UI.

Testing: `node --test src/lib/localTestimonialsPublic.test.mjs`, `npm run build`; start `npm run dev`, then `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-testimonials.ps1` in another PowerShell terminal.

Do not overwrite `.env.local` when applying ZIP. No data-writing operations are added. GitHub push not performed.
