# Bulk109 consolidated full-project verification, PowerShell 5.1 compatible.
# No database record writes, email, uploads, or destructive commands.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try{
 Set-Location $project
 Write-Host 'BULK109 (1/4): source contracts + mocked signed-Admin GET client'
 & node --test '.\scripts\bulk109-contracts.test.mjs' '.\scripts\bulk109-http-mock.test.mjs' '.\scripts\bulk109-failure-diagnostics.test.mjs' '.\scripts\bulk109-users-page-first.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk109 source/mock tests failed.'}
 Write-Host 'BULK109 (2/4): all 516 original routes + static shape matrix'
 & node '.\scripts\api-migration-inventory.mjs'
 if($LASTEXITCODE -ne 0){throw 'API inventory failed.'}
 & node '.\scripts\api-migration-matrix.mjs' '--bulk109'
 if($LASTEXITCODE -ne 0){throw 'API matrix failed.'}
 & node '.\scripts\full-api-worklist.mjs' '--bulk109'
 if($LASTEXITCODE -ne 0){throw 'Full worklist failed.'}
 Write-Host 'BULK109 (3/4): read-only live MySQL column metadata'
 & node '.\scripts\test-local-bulk109-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'DB schema preflight failed.'}
 Write-Host 'BULK109 (4/4): existing signed Admin GET-only live reads'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk109-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Authenticated Admin GET verification failed.'}
 Write-Host 'BULK109 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK109 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
