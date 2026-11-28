# Safe smoke only. MUST run with SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED unset/0.
# This script never turns on QA writes and never exercises business-logic mutations.
# Anonymous /admin/api/local/* calls receive 401 at the admin proxy, BEFORE the 403 QA write gate.
# The legacy /v2/api/tickets/* calls reach the default-disabled QA gate and receive 403.
$ErrorActionPreference='Stop'
if ($env:SOURCEINDIA_TICKET_NATIVE_WRITES_ENABLED -eq '1') {
 Write-Host 'SKIP: QA writes enabled in this shell. Do not run anonymous mutation probes against a writable QA server.'
 exit 0
}
$base=if($env:BULK122_URL){$env:BULK122_URL.TrimEnd('/')}else{'http://localhost:3000'}
$cases=@(
 @{method='POST';path='/v2/api/tickets/';status=403},
 @{method='POST';path='/v2/api/tickets/send-otp';status=403},
 @{method='POST';path='/v2/api/tickets/verify-otp';status=403},
 @{method='POST';path='/v2/api/tickets/store-ticket';status=403},
 @{method='POST';path='/v2/api/tickets/track-ticket';status=403},
 @{method='POST';path='/v2/api/tickets/store-support-ticket-reply';status=403},
 @{method='PUT';path='/v2/api/tickets/99999999';status=403},
 @{method='PATCH';path='/v2/api/tickets/99999999/status';status=403},
 @{method='DELETE';path='/v2/api/tickets/99999999';status=403},
 @{method='POST';path='/admin/api/local/tickets';status=401},
 @{method='PUT';path='/admin/api/local/tickets/99999999';status=401},
 @{method='PATCH';path='/admin/api/local/tickets/99999999/status';status=401},
 @{method='DELETE';path='/admin/api/local/tickets/99999999';status=401}
)
$pass=0;$fail=0
foreach($case in $cases){
 try {
  $r=Invoke-WebRequest -Uri ($base+$case.path) -Method $case.method -ContentType 'application/json' -Body '{}' -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
  $code=[int]$r.StatusCode
 }catch{
  if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}
  else{Write-Host "ERROR $($case.method) $($case.path): $($_.Exception.Message)";$fail++;continue}
 }
 if($code -eq $case.status){Write-Host "PASS $($case.method) $($case.path) => $code";$pass++}
 else{Write-Host "FAIL $($case.method) $($case.path) => $code expected $($case.status)";$fail++}
}
Write-Host "BULK122 HTTP DEFAULT-DENY RESULTS: PASS=$pass FAIL=$fail TOTAL=$($pass+$fail)"
Write-Host 'Anonymous /admin calls are denied by session middleware (401); legacy writes are denied by the QA gate (403).'
Write-Host 'No write attempts were authorized. This is not ticket functional/write parity.'
if($fail){exit 1}
