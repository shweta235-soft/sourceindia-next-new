# Bulk77 – Admin session on public product pages

The admin session is an HttpOnly cookie scoped to `/admin`. The public `AuthContext` only represents Buyer/Seller user-token sessions, so the public header incorrectly displayed Sign In for a logged-in Admin.

- Added `GET /admin/session-status`, which uses the existing signed admin cookie, returns only `{"authenticated": boolean}` with no caching, and does not expose session identifiers or tokens.
- Allowed this read-only endpoint through the `/admin/:path*` proxy while leaving all other Admin access checks intact.
- Public header now shows **Admin**, **Admin Dashboard**, and **Logout** if no Buyer/Seller session is present and the admin cookie is valid.
- Existing cookie path and original Admin login/logout logic are unchanged; both account types remain separate.
- If a public Buyer/Seller session is also active, its header takes precedence.
- No new npm dependency, schema or API migration changes.

## Testing
1. `npm run build`, start the server.
2. Login as Admin and visit `/products/ai-powered-custom-pcba-build`; header should display Admin and Admin Dashboard dropdown.
3. Select Admin Dashboard and return to public product detail; status should remain Admin.
4. Select Logout; public header should return to Sign In after navigating back.
5. Seller/Buyer login, protected Admin pages and Product Detail should continue working.

The endpoint is not a general-purpose authentication mechanism for Buyer/Seller APIs. Admin privileges are NOT granted to public account APIs.
