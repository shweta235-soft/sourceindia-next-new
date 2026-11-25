# Bulk79 – Consolidated Read-only Enquiry APIs

## Added endpoints (local JWT Bearer token required)

- `GET /api/local/enquiries/sent?page=1&limit=20`
- `GET /api/local/enquiries/sent/count`
- `GET /api/local/enquiries/received?page=1&limit=20` (active seller linked company)
- `GET /api/local/enquiries/received/count`
- `GET /api/local/enquiries/buyer-messages?page=1&limit=20`
- `GET /api/local/enquiries/buyer-messages/count`

These are read-only, authenticated endpoints and are NOT yet connected to frontend UI.
Data is scoped by the authenticated account user_id, or by their company_id for received enquiries. Soft-deleted enquiries/associations are omitted. Returns 401 for missing/invalid local JWT; 403 for non-sellers requesting received enquiries; 503 for unavailable database/configuration or query failure. All responses use `Cache-Control: private, no-store`.

## Verification

- `node --test src/lib/localEnquiryRead.test.mjs` – 9/9 code-contract checks passed in packaging environment.
- ZIP integrity checked.
- **Not verified:** full production build, actual database read queries, parity of live enquiry interface, and ability to obtain locally issued JWT in the existing UI.

## Not included

Enquiry creation, sending messages, OTP, admin approval, deletion, inbox status transitions, upload operations, and connecting UI to local APIs. Existing live API routes remain unchanged.

## Installing

Make a backup, extract full project files into `E:\nextjs\sourceindia-next-new` (no extra nesting), preserve existing `.env.local`. No new npm dependencies. Run `npm run build` then `npm run dev`. Unlike public catalog endpoints, new routes require a locally issued JWT in an Authorization Bearer header. Do not share real JWTs or secrets in chat.
