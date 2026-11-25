# Bulk92 - read-only public testimonial smoke tests (Windows PowerShell 5.1 compatible).
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$pass = 0
$fail = 0
$skip = 0
function Check-Get([string]$name, [string]$uri, [int]$expected) {
    $code = 0
    $obj = $null
    try {
        $response = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -ErrorAction Stop
        $code = [int]$response.StatusCode
        $obj = $response.Content | ConvertFrom-Json
    } catch {
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    }
    if ($code -eq $expected) { Write-Host "${name}: HTTP $code PASS" -ForegroundColor Green; $script:pass++ }
    else { Write-Host "${name}: HTTP $code FAIL (expected $expected)" -ForegroundColor Red; $script:fail++ }
    return $obj
}
$items = Check-Get 'Testimonial list' "$base/api/local/testimonials" 200
$null = Check-Get 'Testimonial count' "$base/api/local/testimonials/count" 200
$null = Check-Get 'Invalid testimonial ID' "$base/api/local/testimonials/invalid" 400
$null = Check-Get 'Invalid pagination' "$base/api/local/testimonials?page=0" 400
$firstId = $null
if ($null -ne $items -and $null -ne $items.items -and @($items.items).Count -gt 0) {
    $firstId = @($items.items)[0].id
}
if ($firstId) { $null = Check-Get 'Testimonial detail' "$base/api/local/testimonials/$firstId" 200 }
else { Write-Host 'Testimonial detail: SKIPPED (no active testimonial rows)' -ForegroundColor Yellow; $skip++ }
Write-Host '------------------------------------'
Write-Host "BULK92 RESULTS: PASS=$pass FAIL=$fail SKIPPED=$skip"
