# Bulk88 — Public FAQ read-only local API migration

Original reference: `backend/routes/faqRoutes.js`, `backend/controllers/faqController.js`, `backend/models/Faq.js`, `backend/models/FaqCategory.js` (inspected read-only).

Added:
- `GET /api/local/faqs` — active, not-deleted FAQ list, `page`/`limit` max 50
- `GET /api/local/faqs/count` — public FAQs count
- `GET /api/local/faqs/{id}` — public detail; 404 for inactive/deleted entries
- `GET /api/local/faqs/categories` — active FAQ categories

**Intentional security difference:** the legacy `getAllFaqs` filtered `status=1` but did *not* filter `is_delete=0`. Local public APIs exclude soft-deleted FAQs. No admin API or UI has been migrated/wired for these new endpoints, and the response shape is a new explicit local contract, not claimed byte-for-byte identical to the legacy API.

This batch adds no dependencies or schema changes. Build/runtime MySQL checks remain pending on Windows machine.

Run:
```
node --test src/lib/localFaqPublic.test.mjs
npm run build
```
Then with dev server running, test `GET http://localhost:3000/api/local/faqs`, `/count`, `/categories` and (if a list ID exists) `/{id}`. These are public, no JWT needed.

One-command smoke tests (after `npm run dev`):
```
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-faqs.ps1
```
