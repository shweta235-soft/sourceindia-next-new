# Read-only diagnostic: use UTF-8 process stdin, not PowerShell's native pipeline encoding.
# Does not print email, password, JWT or database password hashes.
$ErrorActionPreference = 'Stop'
$Email = (Read-Host 'Account email in LOCAL database').Trim()
$SecurePassword = Read-Host 'Password to compare with LOCAL users.password (hidden)' -AsSecureString
$Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$Plain = $null
$Payload = $null
try {
    $Plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)
    if ([string]::IsNullOrWhiteSpace($Email)) {
        Write-Host 'RESULT: EMAIL_MISSING'
        exit 2
    }
    if ([string]::IsNullOrEmpty($Plain)) {
        Write-Host 'RESULT: PASSWORD_MISSING'
        exit 2
    }
    # PowerShell 5.1's JSON/pipeline encodings can mangle stdin across runtimes.
    # Use a two-line UTF-8 protocol: email followed by password.
    # Read-Host always supplies one line, so no quoting or JSON escaping is required.
    $Payload = $Email + "`n" + $Plain
    $Plain = $null

    $nodeScript = Join-Path $PSScriptRoot 'diagnose-local-login.mjs'
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = 'node'
    $start.Arguments = ('"' + $nodeScript + '"')
    $start.WorkingDirectory = (Split-Path $PSScriptRoot -Parent)
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $start
    if (-not $process.Start()) { throw 'Unable to start Node.js process' }
    try {
        # PowerShell 5.1 / .NET Framework does not expose ProcessStartInfo.StandardInputEncoding.
        # Send UTF-8 bytes directly to avoid implicit PowerShell pipeline encodings.
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        $bytes = $utf8.GetBytes($Payload)
        $process.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
        $process.StandardInput.BaseStream.Flush()
        $process.StandardInput.Close()
        [Array]::Clear($bytes, 0, $bytes.Length)
        $bytes = $null
        $Payload = $null
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($stdout) { Write-Host $stdout.TrimEnd() }
        if ($process.ExitCode -ne 0 -and -not $stdout) {
            Write-Host 'RESULT: DIAGNOSTIC_PROCESS_ERROR'
            # Do not print exception output: might contain environment details.
        }
    } finally { $process.Dispose() }
} finally {
    if ($Ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr) }
    $Plain = $null
    $Payload = $null
    if ($SecurePassword) { $SecurePassword.Dispose() }
}
