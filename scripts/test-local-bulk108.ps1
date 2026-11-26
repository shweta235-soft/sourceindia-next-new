# Windows PowerShell 5.1 compatible. Run with local Next dev server on port 3000.
# All tests are read-only. No valid write payload or same-origin DELETE is sent.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try {
 Set-Location $project
 Write-Host 'Consolidated API (1/4): audited contracts and mock Admin HTTP tests'
 & node --experimental-strip-types --test '.\scripts\bulk108-contracts.test.mjs' '.\scripts\bulk108-http-mock.test.mjs' '.\scripts\bulk108-history-identity.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Contract or mock tests failed.'}
 Write-Host 'Consolidated API (2/4): 516-endpoint inventory + static traceability'
 & node '.\scripts\api-migration-inventory.mjs'
 if($LASTEXITCODE -ne 0){throw 'API inventory failed.'}
 & node '.\scripts\api-migration-matrix.mjs' '--bulk108'
 if($LASTEXITCODE -ne 0){throw 'API traceability failed.'}
 Write-Host 'Consolidated API (3/4): live local MySQL schema metadata (NO writes)'
 & node '.\scripts\test-local-bulk108-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Database schema preflight failed.'}
 Write-Host 'Consolidated API (4/4): signed Admin read and write guards (NO valid writes)'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk108-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Authenticated Admin API verification failed.'}
 Write-Host 'BULK108 COMBINED RESULTS: PASS'
} catch {
 Write-Host ('BULK108 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
} finally {Set-Location $previous}
