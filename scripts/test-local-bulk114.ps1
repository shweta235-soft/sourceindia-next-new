# Bulk114 post-build verification. Runs no INSERT/UPDATE/DELETE/POST requests.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try{
 Set-Location $project
 Write-Host 'BULK114 (1/3): source contracts'
 & node --test '.\scripts\bulk114-contracts.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk114 source contracts failed.'}
 Write-Host 'BULK114 (2/3): live MySQL schema preflight only (no data writes)'
 & node '.\scripts\test-local-bulk114-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk114 schema preflight failed.'}
 Write-Host 'BULK114 (3/3): local read-only HTTP GET smoke (requires npm run dev in other terminal)'
 & node '.\scripts\test-local-bulk114-http.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk114 local HTTP test failed.'}
 Write-Host 'BULK114 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK114 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
