# Launch isolated QA checker/server without changing existing .env.local.
param([switch]$PreflightOnly)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$config=Join-Path $root '.env.bulk129.qa.local'
if (-not (Test-Path -LiteralPath $config)) {throw 'Run scripts/prepare-bulk129-qa.ps1 first.'}
Set-Location $root
# Node --env-file is passed ONLY to read-only preflight; it prevents accidental loading of live DB_NAME.
& node --env-file=.env.bulk129.qa.local scripts/check-bulk129-qa-readiness.mjs
if ($LASTEXITCODE -ne 0) {throw 'QA preflight NOT READY. Refusing to launch server.'}
if ($PreflightOnly) {Write-Host 'QA preflight ready. No writes or SMTP attempted.';exit 0}
$confirm=Read-Host 'Type RUN-ISOLATED-QA to start a local QA Next.js server with guarded write methods'
if ($confirm -cne 'RUN-ISOLATED-QA') {throw 'Cancelled.'}
# Load only allowlisted values from our dedicated QA file, not the user's live .env.local.
$allowed=@('DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','SOURCEINDIA_CONTACT_QA_DB_NAME','SOURCEINDIA_FRONT_MENU_QA_DB_NAME','SOURCEINDIA_CONTACT_WRITES_ENABLED','SOURCEINDIA_FRONT_MENU_WRITES_ENABLED','SOURCEINDIA_CONTACT_QA_TOKEN','SOURCEINDIA_FRONT_MENU_QA_TOKEN','SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED','SOURCEINDIA_CONTACT_QA_ADMIN_EMAIL','SOURCEINDIA_CONTACT_QA_MAIL_FROM','SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST','SOURCEINDIA_CONTACT_QA_SMTP_HOST','SOURCEINDIA_CONTACT_QA_SMTP_PORT','SOURCEINDIA_CONTACT_QA_SMTP_USER','SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD')
foreach ($key in $allowed) {
 $line=Get-Content -LiteralPath $config | Where-Object {$_ -match ('^'+[regex]::Escape($key)+'=')} | Select-Object -First 1
 if (-not $line) {throw "Missing QA key: $key"}
 $raw=($line -split '=',2)[1]
 if($raw.StartsWith('"') -and $raw.EndsWith('"')){$raw=$raw.Substring(1,$raw.Length-2).Replace('\"','"')}
 [Environment]::SetEnvironmentVariable($key,$raw,'Process')
}
$env:NODE_ENV='development'
$env:HOSTNAME='127.0.0.1'
Write-Host 'Starting QA Next.js server. Keep QA bearer tokens private; server must not be exposed on LAN.' -ForegroundColor Yellow
& node .\node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3101
