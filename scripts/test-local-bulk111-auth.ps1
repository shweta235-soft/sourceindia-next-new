# PowerShell 5.1-compatible local Buyer login prompt. Credentials are not logged.
$ErrorActionPreference='Stop'
$email=Read-Host 'Existing active Buyer email (not Admin or Seller)'
$secure=Read-Host 'Existing Buyer password (hidden)' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try{$password=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
$child=$null;$code=1
try {
 $payload=@{email=$email;password=$password}|ConvertTo-Json -Compress
 $encoded=[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payload))
 $info=New-Object System.Diagnostics.ProcessStartInfo
 $info.FileName=(Get-Command node -CommandType Application -ErrorAction Stop).Source
 $info.Arguments='"'+(Join-Path $PSScriptRoot 'test-local-bulk111-auth.mjs')+'"'
 $info.UseShellExecute=$false;$info.RedirectStandardInput=$true
 $child=[System.Diagnostics.Process]::Start($info)
 if($null -eq $child){throw 'Unable to launch node.'}
 $child.StandardInput.Write($encoded);$child.StandardInput.Close()
 $child.WaitForExit();$code=$child.ExitCode
}finally{
 if($null -ne $child){$child.Dispose()}
 $email=$null;$password=$null;$payload=$null;$encoded=$null
 if($null -ne $secure){$secure.Dispose()}
}
exit $code
