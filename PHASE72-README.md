# SourceIndia Phase 72 – Company content fields (local APIs)

Based on Phase 71 full project. The original React/Node project was inspected only, not modified.

## Changes

- `GET /api/local/companies/me` now includes `company_meta_title` and `organizations_product_description`.
- `PATCH /api/local/companies/me` accepts these two optional fields with strict allowlisting, maximum lengths (255 and 20,000 characters), and current-account ownership scoping.
- No company slug/name, uploaded media, membership, verification flag, or schema changes.
- Existing frontend still uses live APIs: local endpoints are opt-in and DB integration is not yet verified.
- Existing auth and dashboard behavior is unchanged.

## Verification

12/12 targeted tests pass with Node 22 `node --experimental-strip-types --test src/lib/localCompanyUpdate.test.mjs src/lib/localCompanyProfile.test.mjs`. Production build and MySQL read/write integration were NOT executed.

## Apply

Back up the current E:\nextjs\sourceindia-next-new folder, extract this complete ZIP over it, and preserve `.env.local`. No npm dependencies changed; run `npm run build` and usual Seller/Buyer/Admin browser regression checks. Do not send JWTs, passwords, or DB credentials in chat.
