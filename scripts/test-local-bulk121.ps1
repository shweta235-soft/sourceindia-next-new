$ErrorActionPreference='Stop'
$base=if($env:BULK121_URL){$env:BULK121_URL.TrimEnd('/')}else{'http://localhost:3000'}
$cases=@(
 @{path='/admin/api/local/tickets/legacy-grid?page=1&limit=2';status=401},
 @{path='/v2/api/tickets/';status=401},
 @{path='/v2/api/tickets/server-side?page=1&limit=2';status=401},
 @{path='/v2/api/tickets/id/999999999999999/next';status=401}
)
$pass=0;$fail=0
foreach($case in $cases){
 try{$r=Invoke-WebRequest -Uri ($base+$case.path) -Method GET -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop;$code=[int]$r.StatusCode}
 catch {if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}else{Write-Host "ERROR GET $($case.path) $($_.Exception.Message)";$fail++;continue}}
 if($code -eq $case.status){Write-Host "PASS GET $($case.path) => $code";$pass++}else{Write-Host "FAIL GET $($case.path) => $code expected $($case.status)";$fail++}
}
Write-Host "BULK121 HTTP AUTH RESULTS: PASS=$pass FAIL=$fail TOTAL=$($pass+$fail)"
if($fail){exit 1}
Write-Host 'Anonymous auth-boundary smoke only; authenticated role visibility and Express parity require an isolated authorized QA session.'
