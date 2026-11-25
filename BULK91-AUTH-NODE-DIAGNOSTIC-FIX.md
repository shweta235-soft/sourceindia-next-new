# Bulk91 authenticated FAQ test – Node transport and session diagnosis

Previous Windows PowerShell checks returned 401 for all Admin FAQ endpoints despite a successful login and cookie capture. Those HTTP results did not establish whether the login cookie was invalid or not forwarded correctly.

This revision only changes test scripts, leaving source handlers, middleware, UI, and DB schema/data untouched.

Run with the Next.js dev server active:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-admin-faq-bulk91.ps1
```

The PowerShell wrapper prompts for Admin credentials (password hidden), passes them to the Node smoke-test program on stdin, and never writes them to disk. Native Node fetch explicitly sends the signed admin cookie to /admin endpoints. The test checks `/admin/session-status` before authenticated FAQ list/detail-ID checks; if session verification fails, the script prints a narrowly scoped diagnostic instead of misleading FAQ errors. Logout is limited to the isolated test client. No FAQ DB writes are made.

Expected fully successful run: PASS=8 FAIL=0 TOTAL=8 (the session-status validation is an added check). An active session failure yields an explicit diagnostic and fewer total checks; share only the result text without credentials.

Source smoke-test check: `node --test scripts/test-local-admin-faq-bulk91.test.mjs`.
