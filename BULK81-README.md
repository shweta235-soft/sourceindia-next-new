# Bulk81 – Scoped enquiry and buyer-message details

Adds four new **GET** endpoints, all requiring a valid local JWT:

- `/api/local/enquiries/sent/{id}` – enquiry owned by signed-in user
- `/api/local/enquiries/received/{id}` – enquiry assigned in `enquiry_users` to signed-in seller's company
- `/api/local/enquiries/buyer-messages/{id}` – buyer message created by signed-in user
- `/api/local/enquiries/incoming-buyer-messages/{id}` – buyer message addressed to signed-in user

Responses are `{item}` on success. An inaccessible/missing record is `404`; invalid ID is `400`; missing/invalid JWT is `401`; ineligible receiver is `403`; database error is `503`. No new npm dependencies, DB changes, UI wiring or writes. Parameterized SQL and selected minimal columns only; private no-store responses.

Tests: `node --test src/lib/localEnquiryDetailRead.test.mjs` and `npm run build`.

**Test with records actually present in the signed-in account.** Start by GETting the relevant list and selecting its `items[0].id`. If that list is empty, skip its detail; 404 for someone else's ID is expected.

**Scope limitation:** This is a read-only details batch. Original React/Express submission, OTP, messaging and mutation behavior is not yet migrated. HTTP 200 alone does not validate complete React feature parity.
