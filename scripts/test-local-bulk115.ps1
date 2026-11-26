$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$prev=Get-Location
try{
 Set-Location $project
 Write-Host 'BULK115 (1/3): route/source contracts'
 & node --test '.\scripts\bulk115-contracts.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk115 source contracts failed.'}
 Write-Host 'BULK115 (2/3): original schema preflight - read-only'
 & node '.\scripts\test-local-bulk115-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk115 schema preflight failed.'}
 Write-Host 'BULK115 (3/3): local HTTP GET smoke - requires running npm run dev'
 & node '.\scripts\test-local-bulk115-http.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk115 local HTTP smoke failed.'}
 Write-Host 'BULK115 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK115 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $prev}
