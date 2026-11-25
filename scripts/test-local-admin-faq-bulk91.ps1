# Bulk91: authenticated FAQ read-only smoke test.
# Keep credentials out of CLI arguments, disk files, stdout and stderr.
$ErrorActionPreference = 'Stop'
$email = Read-Host 'Existing Admin account email (not Seller/Buyer)'
$secure = Read-Host 'Admin password (hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
$exitCode = 1
$process = $null
try {
  $payload = @{ email = $email; password = $password } | ConvertTo-Json -Compress
  # Native executable pipelines can drop/transform stdin in Windows PowerShell 5.1.
  # Write a single UTF-8 JSON payload directly to the child's stdin instead.
  $nodeExecutable = (Get-Command node -CommandType Application -ErrorAction Stop).Source
  $scriptPath = Join-Path $PSScriptRoot 'test-local-admin-faq-bulk91.mjs'
  $start = New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName = $nodeExecutable
  $start.Arguments = '"' + $scriptPath + '"'
  $start.UseShellExecute = $false
  $start.RedirectStandardInput = $true
  $process = [System.Diagnostics.Process]::Start($start)
  if ($null -eq $process) { throw 'Unable to start Node.js test process.' }
  # ASCII-only base64 avoids Windows PowerShell 5.1 child-stdin encoding ambiguity.
  # The sensitive JSON exists only in process memory; never write it to disk.
  $encodedPayload = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payload))
  $process.StandardInput.Write($encodedPayload)
  $process.StandardInput.Close()
  $process.WaitForExit()
  $exitCode = $process.ExitCode
} finally {
  if ($null -ne $process) { $process.Dispose() }
  $encodedPayload = $null
  $payload = $null
  $password = $null
  $email = $null
  $secure.Dispose()
}
exit $exitCode
