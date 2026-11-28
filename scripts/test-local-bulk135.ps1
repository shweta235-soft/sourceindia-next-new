# BULK135 GET + anonymous write guards. Never authorizes a database mutation.
$ErrorActionPreference = 'Stop'
$base = if ($env:BULK135_URL) { $env:BULK135_URL.TrimEnd('/') } else { 'http://localhost:3000' }
$cases = @(
    @{ Method='GET'; Path='/v2/api/shortcut/shortcut_menus'; Expected=200 },
    @{ Method='GET'; Path='/v2/api/shortcut/shortcut_menus?search=not-expected-bulk135'; Expected=200 },
    @{ Method='GET'; Path='/v2/api/shortcut/shortcut_menus?status=1'; Expected=200 },
    @{ Method='POST'; Path='/v2/api/shortcut/shortcut_menus'; Expected=403 },
    @{ Method='PUT'; Path='/v2/api/shortcut/shortcut_menus/99999999'; Expected=403 },
    @{ Method='DELETE'; Path='/v2/api/shortcut/shortcut_menus/99999999'; Expected=403 }
)
$pass=0;$fail=0
foreach ($case in $cases) {
    try {
        $request = [System.Net.HttpWebRequest]::Create($base + $case.Path)
        $request.Method = $case.Method
        $request.AllowAutoRedirect = $false
        $request.Timeout = 15000
        if ($case.Method -ne 'GET') {
            $request.ContentType='application/json'
            $bytes=[System.Text.Encoding]::UTF8.GetBytes('{}')
            $request.ContentLength=$bytes.Length
            $stream=$request.GetRequestStream();$stream.Write($bytes,0,$bytes.Length);$stream.Close()
        }
        try { $response=$request.GetResponse() } catch [System.Net.WebException] { if ($_.Exception.Response) {$response=$_.Exception.Response} else {throw} }
        $status=[int]$response.StatusCode;$response.Close()
        if ($status -eq $case.Expected) {Write-Host "PASS $($case.Method) $($case.Path) => $status";$pass++} else {Write-Host "FAIL $($case.Method) $($case.Path) => $status expected $($case.Expected)";$fail++}
    } catch {Write-Host "ERROR $($case.Method) $($case.Path) $($_.Exception.Message)";$fail++}
}
Write-Host "BULK135 LOCAL HTTP RESULTS: PASS=$pass FAIL=$fail TOTAL=$($cases.Count)"
Write-Host 'GET smoke + anonymous default-deny only; does not establish write parity.'
if($fail -gt 0){exit 1}
