$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$tests = @(
 @('Knowledge create','POST','/admin/api/local/knowledge-center'),
 @('Knowledge edit','PUT','/admin/api/local/knowledge-center/1'),
 @('Knowledge delete','DELETE','/admin/api/local/knowledge-center/1'),
 @('Knowledge status','PATCH','/admin/api/local/knowledge-center/1/status'),
 @('Knowledge delete status','PATCH','/admin/api/local/knowledge-center/1/delete_status'),
 @('Knowledge bulk delete','DELETE','/admin/api/local/knowledge-center/delete-selected'),
 @('Menu create','POST','/admin/api/local/front-menu'),
 @('Menu edit','PUT','/admin/api/local/front-menu/1'),
 @('Menu delete','DELETE','/admin/api/local/front-menu/1'),
 @('Menu status','PATCH','/admin/api/local/front-menu/1/status'),
 @('Menu visibility','PATCH','/admin/api/local/front-menu/1/is_show'),
 @('Menu children','GET','/admin/api/local/front-menu/1/children')
)
$pass = 0
foreach ($t in $tests) {
 try {
  $res = Invoke-WebRequest -Uri ($base+$t[2]) -Method $t[1] -MaximumRedirection 0 -UseBasicParsing -ErrorAction Stop
  $code = [int]$res.StatusCode; $type = [string]$res.Headers['Content-Type']
 } catch [System.Net.WebException] {
  $r = $_.Exception.Response
  if ($null -eq $r) { Write-Host ($t[0]+': Network ERROR'); continue }
  $code=[int]$r.StatusCode; $type=[string]$r.ContentType
 }
 if ($code -eq 401 -and $type -match 'application/json') { $pass++;Write-Host ($t[0]+': HTTP 401 JSON PASS') }
 else { Write-Host ($t[0]+': HTTP '+$code+' FAIL expected 401 JSON') }
}
Write-Host ('BULK99 SAFE RESULTS: PASS='+$pass+' FAIL='+($tests.Count-$pass)+' TOTAL='+$tests.Count)
Write-Host 'All checks anonymous. No database writes.'
