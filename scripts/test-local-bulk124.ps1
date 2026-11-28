# BULK124 — read-only HTTP and default-deny write verification.
# npm run dev must be running. Never enables writes.
$ErrorActionPreference = 'Stop'
$base = if ($env:BULK124_URL) { $env:BULK124_URL.TrimEnd('/') } else { 'http://localhost:3000' }
$cases = @(
  @{ Method='GET'; Path='/v2/api/ticket_categories/'; Expected=200 },
  @{ Method='GET'; Path='/v2/api/ticket_categories/count'; Expected=200 },
  @{ Method='GET'; Path='/v2/api/ticket_categories/server-side?page=1&limit=2'; Expected=200 },
  @{ Method='GET'; Path='/v2/api/ticket_categories/999999999999999'; Expected=404 },
  @{ Method='POST'; Path='/v2/api/ticket_categories/'; Expected=403 },
  @{ Method='PUT'; Path='/v2/api/ticket_categories/999999999999999'; Expected=403 },
  @{ Method='PATCH'; Path='/v2/api/ticket_categories/999999999999999/status'; Expected=403 },
  @{ Method='DELETE'; Path='/v2/api/ticket_categories/999999999999999'; Expected=403 },
  @{ Method='DELETE'; Path='/v2/api/ticket_categories/delete-selected'; Expected=403 }
)
$pass=0; $fail=0
foreach ($c in $cases) {
  $url = $base + $c.Path
  try {
    try {
      if ($c.Method -eq 'GET') {
        $r = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
      } else {
        $r = Invoke-WebRequest -Uri $url -Method $c.Method -ContentType 'application/json' -Body '{}' -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
      }
      $status=[int]$r.StatusCode
    } catch {
      if ($_.Exception.Response) { $status=[int]$_.Exception.Response.StatusCode }
      else { throw }
    }
    if ($status -eq $c.Expected) { $pass++; Write-Host "PASS $($c.Method) $($c.Path) => $status" }
    else { $fail++; Write-Host "FAIL $($c.Method) $($c.Path) => $status expected $($c.Expected)" }
  } catch { $fail++; Write-Host "ERROR $($c.Method) $($c.Path) $($_.Exception.Message)" }
}
Write-Host "BULK124 LOCAL HTTP RESULTS: PASS=$pass FAIL=$fail TOTAL=$($cases.Count)"
Write-Host 'GET smoke and anonymous default-deny only. Not write or full Express parity.'
if ($fail -gt 0) { exit 1 }
