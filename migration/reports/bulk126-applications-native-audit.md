# BULK126 Completion — Applications original Express vs native Next.js audit

**Original read-only references:** `backend/routes/applicationRoutes.js`, `backend/controllers/applicationController.js`, `backend/models/Applications.js`, `backend/models/UploadImage.js`, `backend/utils/upload.js`; frontend `ApplicationList.jsx` inspected from original archive without modifying it.

## 12 original method/path registrations

| Method | Original route | Next.js handler | Implementation / assurance |
|---|---|---|---|
| GET | `/v2/api/applications/` | `listApplications` | 5/5 listed GET cases matched by user's earlier local Express comparison |
| GET | `/v2/api/applications/count` | `countApplications` | GET parity for listed case confirmed by user |
| GET | `/v2/api/applications/server-side` | `gridApplications` | GET pagination comparison confirmed for listed test case |
| GET | `/v2/api/applications/:id` | `detailApplications` | GET detail comparison confirmed for tested IDs |
| POST | `/v2/api/applications/` | `createApplications` | **Native multipart image + UploadImage/applications transactional insertion**, QA-only |
| PUT | `/v2/api/applications/:id` | `updateApplications` | **Native multipart optional image replacement, reversible quarantine, atomic DB update**, QA-only |
| PATCH | `/v2/api/applications/:id/status` | `patchApplications` | Native QA-only status change; mock-verified |
| PATCH | `/v2/api/applications/:id/category_status` | `patchApplications` | Native QA-only top_category change; mock-verified |
| PATCH | `/v2/api/applications/:id/delete_status` | `patchApplications` | Native QA-only is_delete change; mock-verified |
| DELETE | `/v2/api/applications/:id` | `deleteApplications` | **Native QA-only row + associated UploadImage + quarantined image cleanup**; mock-verified |
| DELETE | `/v2/api/applications/delete-selected` | `deleteSelectedApplications` | Native QA-only soft delete by physical `application_id`; mock-verified |
| DELETE | `/v2/api/applications/count` | `deleteCountApplications` | Preserved unusual legacy registration; QA-gated count response |

## File parity and explicit limitations

- Original uses Multer `single('file')`, disk path `upload/applications/<filename>`, `UploadImage.file`, response messages `Application created`, `Application updated`, `Application deleted successfully`.
- Next accepts the same multipart field names and database path prefix, and uses `application_id`/`upload_image_id` physical keys. New image filenames are random `b126_<32hex>.<ext>` instead of original client-controlled/timestamp names, to prevent collisions and path injection.
- Supported images: JPG/JPEG/PNG/GIF/WEBP with signature check and max 6 MiB. Original Multer accepts broader file formats. Missing creation image is rejected with 400 rather than original's 500 crash; intentional security improvement, **not byte-for-byte invalid-input parity**.
- Physical images are stored **only** below explicit `SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT` in a disposable local QA directory; they are NOT stored in the original Express project or production asset host. Existing legacy file paths must resolve under the QA root and pass safety checks, otherwise the operation fails closed.
- Existing image is quarantined before SQL commit and restored on SQL rollback. After successful commit it is removed. A crash/power loss during SQL/filesystem coordination can leave temporary quarantine files; manual QA reconciliation is required. Shared image references are refused with HTTP 409, rather than deleting files used by others.
- **The 12 method/path registrations are implemented; exact POST/PUT/PATCH/DELETE response and side-effect parity is not yet independently verified against a real cloned QA MySQL database.** No production or shared database writes were tested. Frontend asset serving, filesystem cross-process coordination and upload replacement on live data still need end-to-end verification. No production writes are enabled.

## Checks performed

- Native Applications mocked tests: multipart create/update, no-image update, replacement cleanup, soft bulk delete, status changes, single physical delete, missing IDs, duplicate/invalid inputs, default-deny, insert/update/delete failure rollback.
- `npm run test:api:bulk126` (non-writing). `npm run test:api:bulk126:db` (read-only INFORMATION_SCHEMA).
- `scripts/test-local-bulk126.ps1` (12 default-deny/GET smoke checks), and `npm run test:api:bulk126:parity` (5 GET comparisons) may be repeated on Windows.
- `npm run build` and any **real database write parity test** must be verified on the user's Windows local QA clone; packaging environment does not have the complete Next.js dependencies or authorized QA DB.

## Hard safety gate for writes

All writes return 403 by default and in production regardless of environment toggles. Only opt in after cloning a disposable, local QA DB:

```dotenv
NODE_ENV=development
DB_HOST=127.0.0.1
DB_NAME=sourceindia_applications_qa_test
SOURCEINDIA_APPLICATION_WRITES_ENABLED=1
SOURCEINDIA_APPLICATION_QA_DB_NAME=sourceindia_applications_qa_test
SOURCEINDIA_APPLICATION_QA_TOKEN=<32+-character-random-qa-secret>
SOURCEINDIA_APPLICATION_QA_STORAGE_ROOT=E:\sourceindia-applications-qa-storage
```

Only test against a disposable cloned database. All write requests require bearer QA token, local Origin (if supplied) and approved database/storage location. No database schema modifications are included.
