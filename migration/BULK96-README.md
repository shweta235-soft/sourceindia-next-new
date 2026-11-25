# Bulk96 – Admin Testimonials Image Upload

Adds `POST /admin/api/local/testimonials/upload`, accepting one multipart `file`, with a strict 3 MiB limit, JPEG/PNG/WebP file-signature checks, Admin session and same-origin validation. Returns `{uploaded:true,file_id,file_name}` on success. The returned `file_id` can be passed to existing JSON-based testimonial create/edit APIs.

**Explicitly disabled unless BOTH** `LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED=true` **and** `LOCAL_ADMIN_TESTIMONIAL_UPLOADS_ENABLED=true`. Do not enable without database/filesystem backup and reviewing upload serving/backup policies. No test invokes enabled uploads.

Files are created exclusively under `upload/testimonials/<random UUID>.<extension>` and registered in `upload_images` using the original schema. On database insert failure, the newly saved file is removed best-effort. Does not overwrite or delete old uploaded files. SVG, scripts, invalid signatures and large uploads are rejected. Original reference React/Express project remains read-only.

Security test: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-testimonials-bulk96.ps1` while `npm run dev` runs. Source tests: `node --test src/lib/localAdminTestimonialUpload.test.mjs`. Run `npm run build` on Windows. No dependency changes.

Scope note: new upload endpoint is NOT yet wired to the existing Admin UI, no enabled upload integration test was performed. Images saved under `upload/` follow original backend paths, but **Next.js does not automatically expose that folder as a public URL**; serving needs a separate verified route or asset-host mapping before UI thumbnails work end-to-end.
