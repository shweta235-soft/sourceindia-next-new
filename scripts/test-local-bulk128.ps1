# Non-mutating local HTTP test. All writes must be denied before touching DB.
$base='http://localhost:3000'
$cases=@(
 @{method='GET';path='/v2/api/front_menu/';expected=200},
 @{method='GET';path='/v2/api/front_menu/count';expected=200},
 @{method='GET';path='/v2/api/front_menu/server-side?page=1&limit=2';expected=200},
 @{method='GET';path='/v2/api/front_menu/999999999999999';expected=404},
 @{method='POST';path='/v2/api/front_menu/';expected=403},
 @{method='POST';path='/v2/api/front_menu/main-search?type=product&q=test';expected=200},
 @{method='PUT';path='/v2/api/front_menu/999999999999999';expected=403},
 @{method='PATCH';path='/v2/api/front_menu/999999999999999/is_show';expected=403},
 @{method='PATCH';path='/v2/api/front_menu/999999999999999/status';expected=403},
 @{method='DELETE';path='/v2/api/front_menu/999999999999999';expected=403}
)
$pass=0;$fail=0
foreach($c in $cases){
 try{
  $req=[System.Net.HttpWebRequest]::Create($base+$c.path);$req.Method=$c.method;$req.AllowAutoRedirect=$false;$req.Timeout=15000
  if($c.method -ne 'GET'){$req.ContentType='application/json';$req.ContentLength=0}
  try{$res=$req.GetResponse()}catch [System.Net.WebException]{if($_.Exception.Response){$res=$_.Exception.Response}else{throw}}
  $status=[int]$res.StatusCode;$res.Close()
  if($status -eq $c.expected){$pass++;Write-Host "PASS $($c.method) $($c.path) => $status"}
  else{$fail++;Write-Host "FAIL $($c.method) $($c.path) => $status expected $($c.expected)"}
 }catch{$fail++;Write-Host "ERROR $($c.method) $($c.path) $($_.Exception.Message)"}
}
Write-Host "BULK128 LOCAL HTTP RESULTS: PASS=$pass FAIL=$fail TOTAL=$($cases.Count)"
Write-Host 'GET and native search smoke with default-deny writes; not full production parity.'
if($fail -gt 0){exit 1}
