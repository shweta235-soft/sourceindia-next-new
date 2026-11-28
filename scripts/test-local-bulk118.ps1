$ErrorActionPreference = 'Stop'
Write-Host 'BULK118 (1/3): native GET route and SQL source regression tests'
node --test .\scripts\bulk118-native-contracts.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Host 'BULK118 COMBINED RESULTS: FAIL - source tests'; exit 1 }
Write-Host 'BULK118 (2/3): read-only database schema preflight'
node .\scripts\test-local-bulk118-db-preflight.mjs
if ($LASTEXITCODE -ne 0) { Write-Host 'BULK118 COMBINED RESULTS: FAIL - schema tests'; exit 1 }
Write-Host 'BULK118 (3/3): localhost native GET HTTP smoke (npm run dev required)'
node .\scripts\test-bulk118-http.mjs
if ($LASTEXITCODE -ne 0) { Write-Host 'BULK118 COMBINED RESULTS: FAIL - HTTP smoke'; exit 1 }
Write-Host 'BULK118 COMBINED RESULTS: PASS (native GET smoke only)'
