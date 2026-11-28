$ErrorActionPreference = 'Stop'
$base = if ($env:BULK120_URL) { $env:BULK120_URL.TrimEnd('/') } else { 'http://localhost:3000' }
$cases = @(
    @{ path='/v2/api/tickets/count'; status=200 },
    @{ path='/v2/api/tickets/'; status=401 },
    @{ path='/v2/api/tickets/server-side?page=1&limit=2'; status=401 },
    @{ path='/v2/api/tickets/999999999999999'; status=401 },
    @{ path='/v2/api/tickets/test-ticket/next'; status=401 },
    @{ path='/v2/api/tickets/id/999999999999999/next'; status=401 },
    @{ path='/v2/api/tickets/support-ticket/track/test-bulk120'; status=302 }
)
# Windows PowerShell 5.1 can throw InvalidOperationException for a valid HTTP 302
# when Invoke-WebRequest is called with -MaximumRedirection 0. Use HttpClient
# with redirect following disabled so 302 can be measured as a response.
Add-Type -AssemblyName System.Net.Http
$redirectHandler = [System.Net.Http.HttpClientHandler]::new()
$redirectHandler.AllowAutoRedirect = $false
$redirectClient = [System.Net.Http.HttpClient]::new($redirectHandler)
$redirectClient.Timeout = [TimeSpan]::FromSeconds(20)
$passed=0; $failed=0
foreach ($case in $cases) {
  $url=$base+$case.path
  try {
    if ($case.status -eq 302) {
      # Redirect expected: do not follow /support-ticket/track/:number.
      $httpResponse = $redirectClient.GetAsync($url).GetAwaiter().GetResult()
      try { $status = [int]$httpResponse.StatusCode }
      finally { $httpResponse.Dispose() }
    } else {
      $response=Invoke-WebRequest -Uri $url -Method GET -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
      $status=[int]$response.StatusCode
    }
  } catch {
    if ($_.Exception.Response) {$status=[int]$_.Exception.Response.StatusCode}
    else {Write-Host "ERROR GET $($case.path) $($_.Exception.Message)"; $failed++;continue}
  }
  if ($status -eq $case.status){Write-Host "PASS GET $($case.path) => $status";$passed++}
  else{Write-Host "FAIL GET $($case.path) => $status expected $($case.status)";$failed++}
}
$redirectClient.Dispose()
$redirectHandler.Dispose()
Write-Host "BULK120 LOCAL HTTP RESULTS: PASS=$passed FAIL=$failed TOTAL=$($passed+$failed)"
if($failed -gt 0){exit 1}
