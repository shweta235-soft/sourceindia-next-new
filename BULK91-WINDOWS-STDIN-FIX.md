# Bulk91 Windows PowerShell stdin transport fix

Previous script could report `Invalid credential input. Run the .ps1 wrapper.` even when invoked from the wrapper because Windows PowerShell 5.1 native stdin piping is unreliable in some environments.

This revision uses `System.Diagnostics.ProcessStartInfo` with redirected stdin, writes exactly one UTF-8 JSON string, and keeps secrets out of CLI arguments, printed output, and files. Node also tolerates a UTF-8 BOM or trailing whitespace. No database or application authorization logic was changed.

After replacing the full project while preserving `.env.local`, restart `npm run dev` and run:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk91.ps1
```

Only source tests are verified here. The script's live admin session results need to be checked on Windows. Do not share passwords or session tokens.
