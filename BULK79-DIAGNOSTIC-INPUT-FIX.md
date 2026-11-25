# Bulk79 local login diagnostic input fix

This fixes Windows PowerShell-to-Node input transfer using explicit UTF-8 stdin and distinguishes blank email, blank password, and malformed JSON. The database and application authentication code remain unchanged.

Run: `powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-local-login.ps1`

Only share the RESULT and ERROR_CODE lines; never share credentials, tokens, hashes, or .env.local.
