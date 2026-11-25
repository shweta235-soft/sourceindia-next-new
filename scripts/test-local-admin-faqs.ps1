# Bulk89 fixed safe smoke test: anonymous requests only; no writes can succeed.
# Never include admin cookies. Do not silently accept HTML login redirects as API results.
$base = 'http://localhost:3000'
$checks = @(
  @{Label='Admin FAQ list anonymous'; Uri="$base/admin/api/local/faqs"; Method='GET'},
  @{Label='Admin FAQ detail anonymous'; Uri="$base/admin/api/local/faqs/1"; Method='GET'},
  @{Label='Admin FAQ categories anonymous'; Uri="$base/admin/api/local/faqs/categories"; Method='GET'},
  @{Label='Admin FAQ category detail anonymous'; Uri="$base/admin/api/local/faqs/categories/1"; Method='GET'},
  @{Label='FAQ write blocked anonymous'; Uri="$base/admin/api/local/faqs/1"; Method='PATCH'},
  @{Label='Category write blocked anonymous'; Uri="$base/admin/api/local/faqs/categories/1"; Method='PATCH'}
)
$passed=0
foreach ($check in $checks) {
  $status = 0
  $contentType = ''
  $redirected = $false
  try {
    $params = @{
      Uri = $check.Uri
      Method = $check.Method
      UseBasicParsing = $true
      MaximumRedirection = 0
      ErrorAction = 'Stop'
    }
    if ($check.Method -eq 'PATCH') {
      $params.ContentType = 'application/json'
      $params.Body = '{"status":1}'
    }
    $response = Invoke-WebRequest @params
    $status = [int]$response.StatusCode
    $contentType = [string]$response.Headers['Content-Type']
  }
  catch {
    if ($null -ne $_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $contentType = [string]$_.Exception.Response.Headers['Content-Type']
      $redirected = ($status -ge 300 -and $status -lt 400)
    }
  }
  if ($status -eq 401 -and $contentType -match 'application/json') {
    Write-Host "$($check.Label): HTTP $status JSON PASS" -ForegroundColor Green
    $passed++
  }
  else {
    Write-Host "$($check.Label): HTTP $status FAIL (expected JSON 401; content-type=$contentType; redirected=$redirected)" -ForegroundColor Red
  }
}
Write-Host "BULK89 SAFE TEST RESULTS: PASS=$passed TOTAL=$($checks.Count)"
Write-Host 'No authenticated admin actions or database changes were performed.'
