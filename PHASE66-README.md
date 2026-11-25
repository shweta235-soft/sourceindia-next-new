# Phase 66 — Buyer company listing Connect navigation

## Fix
The Buyer Companies listing previously routed every Connect button to `/login`, even for signed-in users and without preserving the selected company. Now the button opens that company's detail route. The existing Company Detail Connect button owns the authentication/connect action; if unauthenticated, it uses the Phase 64 login return redirect.

Companies without a valid route slug display `Details unavailable` rather than a generic login link. No backend, database, authentication or public detail changes.

## Changed
- `src/components/public/CompanyListingFilter.tsx`
- `src/lib/companyListingConnect.ts` (new)
- `tests/company-listing-connect.test.mjs` (new)

## Verified
`node --experimental-strip-types --test tests/company-listing-connect.test.mjs tests/account-login-redirect.test.mjs` — 12/12 PASS with Node 22.16.0. Full Next.js build and browser behavior need verification locally.

## Browser test
1. `npm run build`
2. Open buyer companies listing as logged-out user; Connect should open chosen company detail, then its Connect action should route to login and return to the chosen detail after login.
3. As a logged-in user, Connect on buyer listing should open chosen company detail, not the login page. The detail Connect action should work as before.
4. Check Seller/Buyer login, Product Review redirects and Enquiry Detail return flows as regression checks.
