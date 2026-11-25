# Bulk84: buyer-message recipient eligibility + validation-only preview

- GET `/api/local/enquiries/buyer-messages/recipient/{companyId}` — checks an active seller company recipient for the logged-in user; returns only public company name/slug and availability.
- POST `/api/local/enquiries/buyer-messages/validate` — JSON `{"company_id":12,"title":"...","message":"..."}`, checks field lengths and recipient eligibility. **No database writes or mail sent.**
- Both require LOCAL_AUTH_JWT_SECRET Bearer authentication and matching active local account. No PII returned. Body validation is strict; 255-character DB string column bounds retained.
- Original Express `enquiriesController.sendMessage` also sends an email using template 67. Actual message creation is deliberately deferred until mail/business error behavior can be migrated. These endpoints are preparatory and are not React-route parity equivalents.
- No changes to React reference, existing UI, database schema, existing routes, or npm dependencies.
- Run `node --test src/lib/localBuyerMessagePreview.test.mjs`, then `npm run build`.
