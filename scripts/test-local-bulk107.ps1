# Run only with localhost npm run dev running and writes default OFF.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try{
 Set-Location $project
 Write-Host 'Bulk107 (1/4): field/route security contracts'
 & node --experimental-strip-types --test '.\scripts\bulk107-contracts.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk107 source tests failed.'}
 Write-Host 'Bulk107 (2/4): migration inventory'
 & node '.\scripts\api-migration-inventory.mjs'
 if($LASTEXITCODE -ne 0){throw 'Migration inventory failed.'}
 Write-Host 'Bulk107 (3/4): local schema preflight (read-only)'
 & node '.\scripts\test-local-bulk106-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk107 DB schema preflight failed.'}
 Write-Host 'Bulk107 (4/4): signed Admin HTTP guards; no database writes'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk107-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Bulk107 Admin security checks failed.'}
 Write-Host 'BULK107 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK107 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
