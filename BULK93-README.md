# Bulk93: Admin Testimonials API (safe rollout)

Original source: `backend/routes/testimonialRoutes.js`, `backend/controllers/testimonialController.js`, `backend/models/Testimonials.js` (read-only reference). Implemented endpoints:

- `GET /admin/api/local/testimonials?page=1&limit=20&deleted=0` — admin listing, including inactive rows; deleted=1 inspects soft-deleted rows.
- `GET /admin/api/local/testimonials/count?deleted=0` — count.
- `GET /admin/api/local/testimonials/{id}` — admin detail, including status and file reference.
- `PATCH /admin/api/local/testimonials/{id}` — strict JSON `{ "status": 0|1 }`. **Default disabled**; requires `LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED=true`, signed admin session, and same-origin.

Uses `testimonials.testimonial_id`, `upload_images.upload_image_id`, parameterized SQL, and existing signed `si_admin_session`. The middleware returns JSON 401 instead of an HTML login redirect for anonymous Admin Testimonials requests. Public APIs and working UI unchanged. No schema migrations, uploads, deletions, or dependency changes. Existing legacy Express create/edit/delete and upload handling are **not** reproduced in this batch; this is not complete CRUD parity.

Testing (Windows):

```
cd E:\nextjs\sourceindia-next-new
node --test src/lib/localAdminTestimonials.test.mjs
npm run build
npm run dev
# in another terminal
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-testimonials-bulk93.ps1
```

Expected safe tests: `BULK93 SAFE RESULTS: PASS=4 TOTAL=4`. A real authenticated Admin DB read has not been executed in the artifact environment and remains to be verified. Do not enable writes until separately approved and DB backed up.
