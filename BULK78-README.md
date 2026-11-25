# Bulk78: Local location reference APIs

Original reference: `backend/routes/locationRoutes.js`, `backend/controllers/locationController.js`, `backend/models/Countries.js`, `States.js`, `Cities.js` (read-only).

Read-only endpoints:
- GET `/api/local/locations/countries`
- GET `/api/local/locations/states`
- GET `/api/local/locations/cities`
- GET `/api/local/locations/states/by-country?countryId=1`
- GET `/api/local/locations/cities/by-state?stateId=1`

Responses use keys `countries`, `states`, or `cities`. These new `/api/local/*` endpoints do not replace original `/v4/api/*` responses or frontend integrations yet.
Filtered states intentionally omit computed product/company counts from the original Express `getStatesByCountry` endpoint; that business functionality still needs parity work.
PIN lookup is excluded because the original code disables TLS verification for an external postal service; that unsafe behavior must not be copied.

No new npm dependencies. Existing `.env.local` must be preserved. Run `npm run build` and browser-test five endpoints; location data integration is not verified in this packaging environment.
