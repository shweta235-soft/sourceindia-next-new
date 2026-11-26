# Bulk105 live Admin auth/read smoke test. Windows PowerShell 5.1 and PowerShell 7.
# No credential file or command-line arguments. Never prints secrets or DB records.
$ErrorActionPreference = 'Stop'
$email = Read-Host 'Existing Admin email (not Seller/Buyer)'
$secure = Read-Host 'Existing Admin password (hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
$exitCode=1
$child=$null
try {
  $payload=@{email=$email;password=$password}|ConvertTo-Json -Compress
  $encodedPayload=[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payload))
  $start=New-Object System.Diagnostics.ProcessStartInfo
  $start.FileName=(Get-Command node -CommandType Application -ErrorAction Stop).Source
  $start.Arguments='"'+(Join-Path $PSScriptRoot 'test-local-bulk105-auth.mjs')+'"'
  $start.UseShellExecute=$false
  $start.RedirectStandardInput=$true
  $child=[System.Diagnostics.Process]::Start($start)
  if($null -eq $child){throw 'Unable to start Node test process.'}
  $child.StandardInput.Write($encodedPayload)
  $child.StandardInput.Close()
  $child.WaitForExit()
  $exitCode=$child.ExitCode
} finally {
  if($null -ne $child){$child.Dispose()}
  $encodedPayload=$null;$payload=$null;$password=$null;$email=$null
  if($null -ne $secure){$secure.Dispose()}
}
exit $exitCode
