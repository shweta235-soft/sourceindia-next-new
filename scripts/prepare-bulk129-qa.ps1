# BULK129 interactive QA configuration. No database connections, writes, or mail.
# Run ONLY after independently creating a disposable QA DB containing the needed schema/templates.
param([string]$Output = '.env.bulk129.qa.local')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destination = [IO.Path]::GetFullPath((Join-Path $root $Output))
if (-not $destination.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Output must be inside the project folder.' }
if (Test-Path -LiteralPath $destination) { throw 'QA configuration already exists. Refusing to overwrite it.' }
if ($destination -eq (Join-Path $root '.env.local')) { throw 'Refusing to overwrite .env.local.' }
Write-Host 'BULK129 - isolated QA configuration wizard' -ForegroundColor Cyan
Write-Host 'This script does not create/clone databases, modify existing data, or send emails.'
Write-Host 'Prepare a disposable local QA database with contacts, front_menu, emails and the original schema.'
$dbName = (Read-Host 'EXISTING isolated QA database name (must include qa/test/sandbox)').Trim()
if ($dbName -notmatch '^[a-zA-Z0-9_]*(qa|test|sandbox)[a-zA-Z0-9_]*$') { throw 'Invalid QA DB name.' }
# Prevent accidental use of the main database recorded in .env.local.
$mainEnv = Join-Path $root '.env.local'
if (Test-Path $mainEnv) {
 $mainLine = Get-Content $mainEnv | Where-Object { $_ -match '^\s*DB_NAME\s*=' } | Select-Object -Last 1
 if ($mainLine) {
  $mainName = (($mainLine -split '=',2)[1]).Trim().Trim('"').Trim("'")
  if ($dbName -ieq $mainName) { throw 'QA DB equals existing .env.local DB_NAME. Refusing to proceed.' }
 }
}
$dbUser = (Read-Host 'QA-only MariaDB username').Trim()
if (-not $dbUser) { throw 'QA username required.' }
$dbPort = (Read-Host 'Local MariaDB port [3306]').Trim()
if (-not $dbPort) {$dbPort='3306'}
if ($dbPort -notmatch '^\d{1,5}$' -or [int]$dbPort -lt 1 -or [int]$dbPort -gt 65535) { throw 'Invalid DB port.' }
function Get-Secret([string]$question) {
 $secure = Read-Host $question -AsSecureString
 $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try {return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)}
}
$dbPass = Get-Secret 'QA MariaDB password (hidden)'
$admin = (Read-Host 'SANDBOX admin recipient email').Trim().ToLowerInvariant()
$user = (Read-Host 'SANDBOX test contact recipient email').Trim().ToLowerInvariant()
$from = (Read-Host 'SANDBOX sender email').Trim().ToLowerInvariant()
foreach ($address in @($admin,$user,$from)) {if ($address -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {throw 'Invalid email address.'}}
if ($admin -eq $user) {throw 'Use distinct QA admin and contact recipients.'}
Write-Host 'SMTP must be a sandbox/trap, never a production email delivery service.' -ForegroundColor Yellow
$smtpHost=(Read-Host 'SMTP SANDBOX host').Trim()
$smtpPort=(Read-Host 'SMTP SANDBOX port [587]').Trim()
if (-not $smtpPort) {$smtpPort='587'}
if (-not $smtpHost -or $smtpHost -match '[\s\r\n]' -or $smtpPort -notmatch '^\d{1,5}$' -or [int]$smtpPort -lt 1 -or [int]$smtpPort -gt 65535) {throw 'Invalid SMTP sandbox host/port.'}
$smtpUser=(Read-Host 'SMTP sandbox username').Trim()
$smtpPass=Get-Secret 'SMTP sandbox password (hidden)'
if (-not $smtpUser -or -not $smtpPass) {throw 'SMTP sandbox credentials required.'}
$confirm=(Read-Host 'Type ISOLATED-QA to confirm this DB and SMTP sandbox are disposable')
if ($confirm -cne 'ISOLATED-QA') {throw 'Cancelled. No configuration written.'}
# Avoid weak Get-Random for bearer tokens: use cryptographic random generator.
$bytes1=New-Object byte[] 48; $bytes2=New-Object byte[] 48
$rng=[Security.Cryptography.RandomNumberGenerator]::Create()
try {$rng.GetBytes($bytes1); $rng.GetBytes($bytes2)} finally {$rng.Dispose()}
$contactToken=[Convert]::ToBase64String($bytes1)
$menuToken=[Convert]::ToBase64String($bytes2)
function Escape-Env([string]$v) {
 if ($v -match '[\r\n\x00]') {throw 'Newlines not permitted in environment values.'}
 # Node's dotenv parser supports quoted double-quoted values.
 return '"' + $v.Replace('\\','\\').Replace('"','\\"') + '"'
}
$settings=[ordered]@{
 'DB_HOST'='127.0.0.1'; 'DB_PORT'=$dbPort; 'DB_NAME'=$dbName; 'DB_USER'=$dbUser; 'DB_PASSWORD'=$dbPass;
 'SOURCEINDIA_CONTACT_QA_DB_NAME'=$dbName; 'SOURCEINDIA_FRONT_MENU_QA_DB_NAME'=$dbName;
 'SOURCEINDIA_CONTACT_WRITES_ENABLED'='1'; 'SOURCEINDIA_FRONT_MENU_WRITES_ENABLED'='1';
 'SOURCEINDIA_CONTACT_QA_TOKEN'=$contactToken; 'SOURCEINDIA_FRONT_MENU_QA_TOKEN'=$menuToken;
 'SOURCEINDIA_CONTACT_QA_EMAIL_ENABLED'='1'; 'SOURCEINDIA_CONTACT_QA_ADMIN_EMAIL'=$admin;
 'SOURCEINDIA_CONTACT_QA_MAIL_FROM'=$from; 'SOURCEINDIA_CONTACT_QA_MAIL_ALLOWLIST'="$admin,$user";
 'SOURCEINDIA_CONTACT_QA_SMTP_HOST'=$smtpHost; 'SOURCEINDIA_CONTACT_QA_SMTP_PORT'=$smtpPort;
 'SOURCEINDIA_CONTACT_QA_SMTP_USER'=$smtpUser; 'SOURCEINDIA_CONTACT_QA_SMTP_PASSWORD'=$smtpPass
}
$lines=@('# BULK129 - LOCAL ISOLATED QA ONLY; DO NOT COMMIT OR SHARE','NODE_ENV=development')
foreach($entry in $settings.GetEnumerator()) {$lines += ($entry.Key + '=' + (Escape-Env ([string]$entry.Value)))}
[IO.File]::WriteAllText($destination, (($lines -join "`n")+"`n"), (New-Object Text.UTF8Encoding($false)))
# Windows: lock file ACL to current user where supported.
try {
 $acl=Get-Acl -LiteralPath $destination
 $acl.SetAccessRuleProtection($true,$false)
 $identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
 $rule=New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','Allow')
 $acl.SetAccessRule($rule)
 Set-Acl -LiteralPath $destination -AclObject $acl
} catch {Write-Warning 'Unable to restrict ACL automatically; verify file permissions.'}
Write-Host 'Local QA config created. Tokens and passwords deliberately not printed.' -ForegroundColor Green
Write-Host 'Next: powershell -ExecutionPolicy Bypass -File .\scripts\start-bulk129-qa.ps1 -PreflightOnly'
