$ErrorActionPreference = "Stop"
Write-Host "BULK119 (1/3): 17 native Express GET path/contract tests"
node --test scripts/bulk119-native-contracts.test.mjs
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "BULK119 (2/3): read-only MySQL INFORMATION_SCHEMA preflight"
node scripts/test-local-bulk119-db-preflight.mjs
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "BULK119 (3/3): GET-only local HTTP smoke (npm run dev required)"
node scripts/test-bulk119-http.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "BULK119 COMBINED RESULTS: FAIL"; exit 1 }
Write-Host "BULK119 COMBINED RESULTS: PASS (GET smoke only; exact parity still needs Express comparison)"
