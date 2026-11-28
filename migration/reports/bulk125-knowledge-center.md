BULK125: 10 original method/path native exports. GET parity not yet validated against MySQL. Writes require isolated QA gate. Multipart uploads, disk deletion and exact write parity intentionally pending. No original legacy files modified.

Verified source inventory from legacy/sourceindia-express/routes/knowledgeCenterRoutes.js:
GET /v2/api/knowledge_center/
GET /v2/api/knowledge_center/count
GET /v2/api/knowledge_center/server-side
GET /v2/api/knowledge_center/:id
POST /v2/api/knowledge_center/
PUT /v2/api/knowledge_center/:id
PATCH /v2/api/knowledge_center/:id/status
PATCH /v2/api/knowledge_center/:id/delete_status
DELETE /v2/api/knowledge_center/:id
DELETE /v2/api/knowledge_center/delete-selected

Differences to verify or complete:
- multipart upload/create/update including upload_images record, disk placement and cleanup is not supported (501 for multipart in isolated QA); normal production writes are 403.
- hard delete with attachment cleanup remains 501 in QA.
- server-side dateRange, startDate, endDate original Express filters not implemented yet.
- default GET visibility matches original unprotected Express routes; admin auth remains outside this native route scope.
- Date and association field serialization must be verified by real original-vs-Next GET comparison.
- Original React/Express snapshot is included but not modified.
