# Bulk79: authenticated, read-only API verification.
# Run from the project root: powershell -ExecutionPolicy Bypass -File .\scripts\test-local-enquiries.ps1
# Requires a running Next.js server, configured local DB and LOCAL_AUTH_JWT_SECRET.
param([string]$BaseUrl = 'http://localhost:3000')
$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

$email = Read-Host 'Existing local account email (Seller or Buyer)'
$securePassword = Read-Host 'Account password (input hidden)' -AsSecureString
$plainPassword = $null
$token = $null
try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try { $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $body = @{ email = $email; password = $plainPassword } | ConvertTo-Json -Compress
    $plainPassword = $null
    $securePassword.Dispose()
    try {
        $login = Invoke-RestMethod -Uri "$BaseUrl/api/local/auth/login" -Method POST -ContentType 'application/json' -Body $body -ErrorAction Stop
    } catch {
        $code = 0
        if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch {} }
        Write-Host "Local login failed (HTTP $code). Check local DB, JWT configuration, or account credentials." -ForegroundColor Yellow
        exit 1
    } finally { $body = $null }
    $token = [string]$login.token
    if ([string]::IsNullOrWhiteSpace($token)) { Write-Host 'Local login succeeded but no JWT was returned.' -ForegroundColor Red; exit 1 }
    $headers = @{ Authorization = "Bearer $token" }
    $routes = @(
        '/api/local/enquiries/sent',
        '/api/local/enquiries/sent/count',
        '/api/local/enquiries/received',
        '/api/local/enquiries/received/count',
        '/api/local/enquiries/buyer-messages',
        '/api/local/enquiries/buyer-messages/count'
    )
    $passed = 0
    foreach ($route in $routes) {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl$route" -Headers $headers -Method GET -UseBasicParsing -ErrorAction Stop
            $code = [int]$response.StatusCode
        } catch {
            $code = 0
            if ($_.Exception.Response) { try { $code = [int]$_.Exception.Response.StatusCode } catch {} }
        }
        if ($code -eq 200) { $passed++; Write-Host "$route : HTTP 200 PASS" -ForegroundColor Green }
        else { Write-Host "$route : HTTP $code (investigate)" -ForegroundColor Yellow }
    }
    Write-Host "Result: $passed / $($routes.Count) endpoints returned HTTP 200."
    Write-Host 'No passwords, tokens, or private enquiry records were printed.'
} finally {
    $token = $null
    $plainPassword = $null
    $securePassword = $null
}
