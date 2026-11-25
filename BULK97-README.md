# Bulk97 — Secure testimonial image serving

- `GET /api/local/testimonials/images/:id` serves only images attached to an active, non-deleted testimonial.
- `GET /admin/api/local/testimonials/images/:id` requires a signed Admin session and permits linked images for Admin management.
- Database file paths are **not** used as raw filesystem paths: only a strictly validated basename under `upload/testimonials/` is accepted.
- Existing image files are read, not modified. Missing legacy images return 404 rather than fetching arbitrary URLs.
- Admin Testimonials view now tries the local image endpoint for relevant `upload/testimonials/...` records, then falls back to original asset URL for older installations.
- Existing testimonial management form submit remains disabled; this batch does not enable live CRUD or upload writes.
- The image on-disk folder must exist on the same server process or mounted persistent storage; files only present on the old Express server cannot be served locally without copying them.

## Verify on Windows

```powershell
node --test src/lib/localTestimonialImage.test.mjs
npm run build
npm run dev
# In second terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-testimonial-images-bulk97.ps1
```

No DB/schema changes, no new npm dependencies, no live writes.
