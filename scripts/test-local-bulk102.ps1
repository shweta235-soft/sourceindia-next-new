param([string]$BaseUrl = 'http://localhost:3000')
$ErrorActionPreference='Stop'
$pass=0;$fail=0
$routes=@(
 '/admin/api/local/ticket-categories',
 '/admin/api/local/ticket-categories/1',
 '/admin/api/local/ticket-categories/1/status',
 '/admin/api/local/ticket-categories/delete-selected',
 '/admin/api/local/interest-categories',
 '/admin/api/local/interest-categories/1',
 '/admin/api/local/interest-categories/1/status',
 '/admin/api/local/seo-pages',
 '/admin/api/local/seo-pages/1'
)
foreach($path in $routes){
 $method=if($path -match '/status$'){'PATCH'}elseif($path -match '/delete-selected$'){'DELETE'}elseif($path -match '/1$'){'PUT'}else{'POST'}
 try{
  $result=Invoke-WebRequest -Uri ($BaseUrl.TrimEnd('/')+$path) -Method $method -ContentType 'application/json' -Body '{}' -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  $status=[int]$result.StatusCode
 }catch{
  if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}else{$status=0}
 }
 if($status -eq 401){Write-Host "$method $path : HTTP 401 PASS";$pass++}else{Write-Host "$method $path : HTTP $status FAIL";$fail++}
}
Write-Host "BULK102 SAFE RESULTS: PASS=$pass FAIL=$fail TOTAL=$($pass+$fail)"
Write-Host 'Anonymous security tests only. No database writes.'
if($fail){exit 1}
