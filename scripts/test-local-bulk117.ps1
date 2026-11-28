$ErrorActionPreference = 'Stop'
Write-Host 'BULK117 (1/2): original Express 516-route registration + safety tests'
node --experimental-strip-types --test .\scripts\bulk117-compat-bridge.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Host 'BULK117 COMBINED RESULTS: FAIL - source tests'; exit 1 }
Write-Host 'BULK117 (2/2): read-only Next.js localhost HTTP smoke (npm run dev required)'
node .\scripts\test-bulk117-http.mjs
if ($LASTEXITCODE -ne 0) { Write-Host 'BULK117 COMBINED RESULTS: FAIL - HTTP tests'; exit 1 }
Write-Host 'BULK117 COMBINED RESULTS: PASS (compatibility/safety smoke only)'
