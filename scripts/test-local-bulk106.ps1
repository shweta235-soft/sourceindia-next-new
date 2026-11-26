# Run after npm run dev is available on localhost. Read-only DB metadata and HTTP.
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$previous=Get-Location
try {
 Set-Location $project
 Write-Host 'Bulk106 (1/3): source-contract tests'
 & node --test '.\scripts\bulk106-verification.test.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk106 source tests failed.'}
 Write-Host 'Bulk106 (2/3): database schema (read-only)'
 & node '.\scripts\test-local-bulk106-db-preflight.mjs'
 if($LASTEXITCODE -ne 0){throw 'Bulk106 DB schema preflight failed.'}
 Write-Host 'Bulk106 (3/3): signed Admin HTTP reads and write guards (read-only)'
 & powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\test-local-bulk106-auth.ps1'
 if($LASTEXITCODE -ne 0){throw 'Bulk106 signed Admin HTTP checks failed.'}
 Write-Host 'BULK106 COMBINED RESULTS: PASS'
}catch{
 Write-Host ('BULK106 COMBINED RESULTS: FAIL - '+$_.Exception.Message)
 exit 1
}finally{Set-Location $previous}
