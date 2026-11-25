# Bulk79 authenticated Enquiry API smoke tests

This update adds a read-only test script; **no API implementation, UI, database schema, or npm dependencies changed**.

1. Keep your existing `.env.local`; ensure `DB_HOST`, `DB_USER`, `DB_NAME`, and `LOCAL_AUTH_JWT_SECRET` are configured.
2. Start Next.js: `npm run dev`.
3. In a separate PowerShell terminal in the project root, run:

   `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-enquiries.ps1`

4. Enter your existing Seller/Buyer email and password at the prompts. Password input is hidden. The script logs in via `POST /api/local/auth/login`, then tests six GET endpoints with the locally issued JWT.
5. Only HTTP statuses are printed. Do not paste JWTs, secrets or database passwords into chats.

`200` means the endpoint responded for that account; counts and ownership correctness require separate data inspection. A Seller or Buyer account may have no records. `401` means local authentication failed/expired, `403` means insufficient permissions, `503` may mean DB/configuration problems.

Note: PowerShell and .NET keep transient credential data in process memory; use this only on your trusted development machine. This is a smoke test and does not verify production safety.
