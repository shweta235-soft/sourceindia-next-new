# Bulk99 — Consolidated content management API batch

Based on original React/Express KnowledgeCenter and FrontMenu models/controllers. 12 new operations:
- Knowledge center POST create; PUT edit; DELETE soft-delete; PATCH status; PATCH delete_status; DELETE delete-selected.
- Front menu POST create; PUT edit; DELETE leaf-only (no is_delete column in original schema); PATCH status; PATCH is_show; GET children (admin only).

**All writes are disabled by default.** Requires `LOCAL_ADMIN_CONTENT_WRITES_ENABLED=true` to enable intentionally; no schema changes, no files deleted by knowledge-center soft deletion. Validates admin signed session and same-origin for writes. DO NOT enable writes until backed-up database and end-to-end permission checks are complete.

This batch is **not** a complete migration of all 516 original Express method+path registrations. More operations, including multipart media uploads and cross-module side effects, require code-level equivalence testing.

## Windows verification
- `node --test src/lib/localContentWrites.test.mjs`
- `npm run build`
- Start `npm run dev`
- In second terminal: `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-content-writes-bulk99.ps1`
Expected anonymous security test: PASS=12 FAIL=0 TOTAL=12. Test does not write data.
