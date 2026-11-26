# Bulk111 combined read-only verification. PowerShell 5.1 compatible.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try{
 Set-Location $project
 Write-Host 'BULK111 (1/4): Buyer dashboard contracts + in-memory HTTP/SQL mock'
 & node --test '.\scripts\bulk111-contracts.test.mjs' '.\scripts\bulk111-http-mock.test.mjs' '.\scripts\bulk111-local-login-diagnostic.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk111 source/mock verification failed.'}
 Write-Host 'BULK111 (2/4): full Express inventory + static route mapping'
 & node '.\scripts\api-migration-inventory.mjs'
 if($LASTEXITCODE -ne 0){throw 'Inventory failed.'}
 & node '.\scripts\api-migration-matrix.mjs' '--bulk111'
 if($LASTEXITCODE -ne 0){throw 'Bulk111 matrix failed.'}
 & node '.\scripts\full-api-worklist.mjs' '--bulk111'
 if($LASTEXITCODE -ne 0){throw 'Worklist failed.'}
 Write-Host 'BULK111 (3/4): live MySQL schema metadata (no writes)'
 & node '.\scripts\test-local-bulk111-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Schema preflight failed.'}
 Write-Host 'BULK111 (4/4): signed Buyer GET-only HTTP and denied POST probes'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk111-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Signed Buyer HTTP checks failed.'}
 Write-Host 'BULK111 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK111 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
