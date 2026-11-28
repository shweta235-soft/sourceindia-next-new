$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try {
 Set-Location $project
 Write-Host 'BULK116 (1/3): source/SQL/validation contracts'
 & node --test '.\scripts\bulk116-contracts.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Source contracts failed.'}
 Write-Host 'BULK116 (2/3): read-only MySQL schema preflight'
 & node '.\scripts\test-local-bulk116-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'DB preflight failed.'}
 Write-Host 'BULK116 (3/3): local read-only GET HTTP tests (npm run dev required)'
 & node '.\scripts\test-local-bulk116-http.mjs'
 if($LASTEXITCODE -ne 0){throw 'HTTP tests failed.'}
 Write-Host 'BULK116 COMBINED RESULTS: PASS'
} catch {
 Write-Host ('BULK116 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
} finally {Set-Location $previous}
