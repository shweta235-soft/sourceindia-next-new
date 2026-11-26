# Bulk105 one-command live verification for Windows PowerShell 5.1 / 7.
# Requires Next.js server running in another terminal (npm run dev).
# 1) Pure source/mock tests, 2) local DB metadata only, 3) signed Admin HTTP reads.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try {
 Set-Location $project
 Write-Host 'Bulk105 (1/3): source + mock tests'
 & node --test '.\scripts\bulk105-verification.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk105 source/mock tests failed.'}
 Write-Host 'Bulk105 (2/3): local database schema preflight (read-only)'
 & node '.\scripts\test-local-bulk105-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk105 DB schema preflight failed. See missing table/column diagnostics above.'}
 Write-Host 'Bulk105 (3/3): authenticated HTTP reads + CSRF checks (no mutations)'
 $auth=Join-Path $PSScriptRoot 'test-local-bulk105-auth.ps1'
 & powershell -NoProfile -ExecutionPolicy Bypass -File $auth
 if($LASTEXITCODE -ne 0){throw 'Bulk105 authenticated HTTP checks failed.'}
 Write-Host 'BULK105 COMBINED RESULTS: PASS (source/mock + DB schema + authenticated HTTP reads)'
} catch {
 Write-Host ('BULK105 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
} finally {Set-Location $previous}
