# Bulk88 - Read-only FAQ API smoke tests. No credentials or writes.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$pass = 0
$fail = 0
$skip = 0
function Check-Get([string]$name, [string]$uri, [int]$expected) {
    try {
        $response = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -ErrorAction Stop
        $code = [int]$response.StatusCode
        $obj = $response.Content | ConvertFrom-Json
    }
    catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $obj = $null
    }
    if ($code -eq $expected) { Write-Host "$name : HTTP $code PASS" -ForegroundColor Green; $script:pass++ }
    else { Write-Host "$name : HTTP $code FAIL (expected $expected)" -ForegroundColor Red; $script:fail++ }
    return $obj
}
$items = Check-Get 'FAQ list' "$base/api/local/faqs" 200
$null = Check-Get 'FAQ count' "$base/api/local/faqs/count" 200
$null = Check-Get 'FAQ categories' "$base/api/local/faqs/categories" 200
$null = Check-Get 'Invalid FAQ ID' "$base/api/local/faqs/invalid" 400
$firstId = $null
if ($null -ne $items -and $null -ne $items.items -and @($items.items).Count -gt 0) {
  $firstId = @($items.items)[0].id
}
if ($firstId) { $null = Check-Get 'FAQ detail' "$base/api/local/faqs/$firstId" 200 }
else { Write-Host 'FAQ detail: SKIPPED (no FAQ records)' -ForegroundColor Yellow; $skip++ }
Write-Host '------------------------------------'
Write-Host "BULK88 RESULTS: PASS=$pass FAIL=$fail SKIPPED=$skip"
