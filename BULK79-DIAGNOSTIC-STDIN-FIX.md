# Bulk79 — PowerShell diagnostic stdin compatibility fix

- Root cause under investigation: PowerShell 5.1 -> Node.js process supplied stdin that did not parse as JSON (`INPUT_JSON_INVALID`).
- Replaced JSON stdin with a two-line UTF-8 transport (email, password), avoiding PowerShell JSON encoding and BOM pitfalls.
- Reads database only, no modifications, no changes to authentication policy, no package dependencies.
- Run: `powershell -ExecutionPolicy Bypass -File .\scripts\diagnose-local-login.ps1` from the project folder.
- Do not share passwords or tokens. Report only `RESULT:` and `ERROR_CODE:`.
- Full Windows PowerShell + MySQL verification must be performed locally.
