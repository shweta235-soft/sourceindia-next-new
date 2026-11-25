# Phase 71 - Authenticated Company Text Update API

- New `PATCH /api/local/companies/me`, accepts local JWT in Authorization Bearer header.
- Only the logged-in account's active company may be updated, enforced by a JOIN between `users` and `company_info`.
- Editable fields: `brief_company`, `company_location`, `designation`, `company_email`, `company_website`, `company_phone`, `contact_person`, `postcode`, `organization_quality_certification`.
- Rejects unknown fields, unsafe URLs, invalid contact values, malformed JSON and bodies over 32 KiB. SQL values are parameterized.
- Does not change organization name/slug, company logo, files, categories, membership, notifications or any database schema.
- Existing frontend stays on its current live API until local database-connected integration tests pass.
- New package dependencies: **none**. Build with `npm run build` only.
- Unit test: `node --test src/lib/localCompanyUpdate.test.mjs`.
- **Not yet verified**: production build on Windows and actual MySQL update flow. Back up your database before testing a write endpoint.
