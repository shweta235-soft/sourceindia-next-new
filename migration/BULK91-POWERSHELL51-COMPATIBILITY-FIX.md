# Bulk91 Windows PowerShell 5.1 compatibility fix

- Removed `ProcessStartInfo.StandardInputEncoding`, which does not exist in Windows PowerShell 5.1 / .NET Framework.
- The PowerShell wrapper now sends an ASCII base64 representation of the UTF-8 JSON payload over the child process standard input; Node decodes it in memory.
- Credentials are never written to files, process arguments, or console output.
- No API handler, UI, database, dependency, or authentication logic changes.

## Run

Run `npm run dev` in one terminal, then from a separate PowerShell window:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk91.ps1
```

The Admin session and FAQ test results still require verification on the user's Windows machine.
