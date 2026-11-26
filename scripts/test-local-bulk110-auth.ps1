# PowerShell 5.1 compatible. Prompt Admin credentials locally, without echo/logging.
$ErrorActionPreference='Stop'
$email=Read-Host 'Existing Admin email (not Seller/Buyer)'
$secure=Read-Host 'Existing Admin password (hidden)' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try{$password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
$child=$null
$code=1
try {
 $payload=@{email=$email;password=$password}|ConvertTo-Json -Compress
 $encodedPayload=[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payload))
 $start=New-Object System.Diagnostics.ProcessStartInfo
 $start.FileName=(Get-Command node -CommandType Application -ErrorAction Stop).Source
 $start.Arguments='"'+(Join-Path $PSScriptRoot 'test-local-bulk110-auth.mjs')+'"'
 $start.UseShellExecute=$false
 $start.RedirectStandardInput=$true
 $child=[System.Diagnostics.Process]::Start($start)
 if($null -eq $child){throw 'Unable to launch node.'}
 $child.StandardInput.Write($encodedPayload)
 $child.StandardInput.Close()
 $child.WaitForExit()
 $code=$child.ExitCode
}finally{
 if($null -ne $child){$child.Dispose()}
 $encodedPayload=$null;$payload=$null;$password=$null;$email=$null
 if($null -ne $secure){$secure.Dispose()}
}
exit $code
