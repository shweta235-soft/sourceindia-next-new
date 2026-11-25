# Bulk95 – Admin Testimonials JSON Write API (Default-off)

Built on verified Bulk94 project. Original Express controller and Sequelize models inspected read-only.

- `POST /admin/api/local/testimonials`: create using existing `upload_images` image ID belonging to `upload/testimonials/`.
- `PUT /admin/api/local/testimonials/{id}`: edit with strict payload.
- `DELETE /admin/api/local/testimonials/{id}`: soft-delete `is_delete=1` only; preserve image records and files.
- Required JSON keys: `name` (1–255 chars), `description` (1–30000 chars), `status` (0/1 number), `file_id` (positive integer referring to existing testimonial upload).
- Safeguards: signed Admin cookie, same-origin checks, parameterized SQL, and `LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED=true` opt-in (default disabled).
- Uploading *new* image files and full React form integration NOT included; original Express used multipart upload. No schema changes.
- No write tests against a live database; do not enable opt-in until independent backup and explicit approval.
- Source tests: `node --test src/lib/localAdminTestimonialWrite.test.mjs`
- Build: `npm run build`
- Anonymous runtime tests: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-testimonials-bulk95.ps1`
