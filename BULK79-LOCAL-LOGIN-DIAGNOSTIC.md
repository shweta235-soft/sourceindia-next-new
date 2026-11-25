# Bulk79 Local Login 401 Diagnostic

The existing frontend logs in through the live upstream API. Local endpoints read the local `users` table and verify its bcrypt password. A live login success does not ensure the same password is stored locally.

## Run
From `E:\nextjs\sourceindia-next-new` in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-local-login.ps1
```

This read-only tool checks account existence, active status, password hash format, and password match. It does not modify the database and never prints credentials, JWTs, hashes, or account records.

Possible results: `ACCOUNT_NOT_FOUND_IN_LOCAL_DB`, `ACCOUNT_INACTIVE_OR_DELETED`, `LOCAL_PASSWORD_NOT_SUPPORTED_BCRYPT_HASH`, `LOCAL_PASSWORD_DOES_NOT_MATCH`, `LOCAL_CREDENTIALS_MATCH`, `DB_CONFIGURATION_MISSING`, `DB_QUERY_FAILED` (with DB driver error code only).

Do not reset passwords, alter tables, or copy credentials between environments without authorization. The existing live login is unchanged. Avoid running diagnostic with a production admin account; use an authorized local test account. On a successful result, the existing `scripts/test-local-enquiries.ps1` can test all 6 endpoints.
