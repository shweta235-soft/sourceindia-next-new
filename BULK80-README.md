# Bulk80 – Own open enquiries and incoming buyer messages (read-only)

Adds five authenticated **GET** endpoints:
- `/api/local/enquiries/open` – the signed-in user's nondeleted open enquiries, paginated
- `/api/local/enquiries/open/count` – count of own nondeleted open enquiries
- `/api/local/enquiries/open/{id}` – own nondeleted open enquiry detail only, otherwise 404
- `/api/local/enquiries/incoming-buyer-messages` – messages addressed to signed-in user, paginated
- `/api/local/enquiries/incoming-buyer-messages/count` – count addressed to signed-in user

All require a local JWT in the `Authorization: Bearer <token>` header. The local login endpoint and Bulk79 tester remain unchanged.

Responses: list `{items, pagination:{page,limit,total}}`, count `{total}`, detail `{item}`. `page` defaults to 1, `limit` defaults to 20, max limit 50. 401 unauthenticated, 400 invalid pagination/ID, 404 when detail is not owned, 503 DB unavailable. Only safe selected columns are returned. No customer contact info or password hashes are exposed.

Original Express reference: `backend/models/OpenEnquiries.js`, `backend/models/BuyerEnquiry.js`, and `backend/controllers/openEnquiriesController.js`, `backend/controllers/buyerEnquiryController.js`. Express originally allows open enquiry by arbitrary ID, but this new local API deliberately restricts private details to current user. The original buyer-enquiry `/user` controller has a search filter overriding its owner OR check; this local route instead strictly filters recipient `reciever_id`.

No existing UI is rewired. Database schema/data unchanged; no new dependencies.

Run `node --test src/lib/localOpenEnquiryRead.test.mjs` and `npm run build`. Test local auth on your machine with both seller and buyer and validate counts against your own data. 200 alone does not prove React UI parity.

Enquiry creation, OTP, replies, and status mutation are intentionally postponed until the existing frontend request contracts and authorizations are traced to prevent security regressions.
