# Phase 65 — Account enquiry detail return after login

Base: Phase 64 full project.

## Root cause
AccountShell previously forwarded only the pathname (except `open-enquiry?type=1`) to `/login?returnTo=...`. The login destination allowlist did not accept `/lead-detail/[enquiry_number]`, so authenticated users arriving from a logged-out deep link went to `/dashboard` instead. `received=1`, which switches the page from MyEnquiryDetail to SellerLeadDetail, was lost.

## Changes
- `src/lib/accountLoginRedirect.ts`: Added tightly validated lead detail destinations, recognized `received=1` and `my-enquiry=true`, and exported `accountLoginReturnTarget` to preserve these modes without forwarding arbitrary query parameters.
- `src/components/account/AccountShell.tsx`: Use the shared safe return-target helper for unauthenticated account redirects.
- `tests/account-login-redirect.test.mjs`: Added regression tests for lead detail, invalid query strings and mode preservation.

## Verification
- `node --experimental-strip-types --test tests/*.test.mjs`: **18/18 PASS** (Node 22 in authoring environment).
- Full Next.js production build NOT run here. Run `npm run build` in target project.

## Browser checklist
1. Normal Seller/Buyer login -> `/dashboard`.
2. Open `/lead-detail/ENQUIRY_NUMBER?received=1` while logged out -> login -> same detail URL with `received=1`, provided the enquiry exists and the user has access.
3. Open `/lead-detail/ENQUIRY_NUMBER?my-enquiry=true` while logged out -> login -> same detail URL.
4. Open `/open-enquiry/ID?type=1` while logged out -> login -> same URL with `type=1`.
5. Product Review and Company Connect login returns remain working; logout prevents protected access.

Keep `.env.local` when applying this full ZIP. React reference and database were not changed.
