# Bulk110 safe end-to-end verification. PowerShell 5.1 compatible.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try{
 Set-Location $project
 Write-Host 'BULK110 (1/4): Seller/Buyer contracts + in-memory SQL mock'
 & node --test '.\scripts\bulk110-contracts.test.mjs' '.\scripts\bulk110-http-mock.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk110 source/mock checks failed.'}
 Write-Host 'BULK110 (2/4): 516 legacy registrations + static mapping'
 & node '.\scripts\api-migration-inventory.mjs'
 if($LASTEXITCODE -ne 0){throw 'API inventory failed.'}
 & node '.\scripts\api-migration-matrix.mjs' '--bulk110'
 if($LASTEXITCODE -ne 0){throw 'Static matrix failed.'}
 & node '.\scripts\full-api-worklist.mjs' '--bulk110'
 if($LASTEXITCODE -ne 0){throw 'Worklist failed.'}
 Write-Host 'BULK110 (3/4): read-only live MySQL schema metadata'
 & node '.\scripts\test-local-bulk110-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Schema preflight failed.'}
 Write-Host 'BULK110 (4/4): signed Admin HTTP read-only checks'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk110-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Authenticated Admin GET checks failed.'}
 Write-Host 'BULK110 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK110 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
