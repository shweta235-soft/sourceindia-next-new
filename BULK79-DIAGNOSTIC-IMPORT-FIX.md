# Bulk79 – Node 24 diagnostic script ESM import fix

The previous diagnostic script imported `loadEnvConfig` as a named export from the CommonJS package `@next/env`, causing a startup SyntaxError before database authentication could be checked.

Fixed `scripts/diagnose-local-login.mjs` to default-import `@next/env` and destructure `loadEnvConfig`. This is a diagnostics-only adjustment, not a change to login routes, SQL, or authentication behavior.

Run from the existing Next.js project folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-local-login.ps1
```

Never share account passwords, JWTs, or hash values. Only share `RESULT:` and, if present, `ERROR_CODE:`.

This does not establish that the local account credentials match; the real database check remains pending. No npm dependencies were changed.
