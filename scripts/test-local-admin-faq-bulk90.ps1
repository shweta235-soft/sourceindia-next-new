# Bulk90 safe anonymous smoke test. Never sends admin cookie. Never changes DB.
$base='http://localhost:3000'
$checks=@(
  @{Name='FAQ creation unauthorized';Path='/admin/api/local/faqs';Method='POST';Body='{"title":"Blocked","description":"Blocked","category":1,"status":1}'},
  @{Name='FAQ editing unauthorized';Path='/admin/api/local/faqs/1';Method='PUT';Body='{"title":"Blocked","description":"Blocked","category":1,"status":1}'},
  @{Name='FAQ soft deletion unauthorized';Path='/admin/api/local/faqs/1';Method='DELETE'},
  @{Name='Category creation unauthorized';Path='/admin/api/local/faqs/categories';Method='POST';Body='{"name":"Blocked","status":1}'},
  @{Name='Category editing unauthorized';Path='/admin/api/local/faqs/categories/1';Method='PUT';Body='{"name":"Blocked","status":1}'},
  @{Name='Category deletion unauthorized';Path='/admin/api/local/faqs/categories/1';Method='DELETE'}
)
$passed=0
foreach($check in $checks){
 $status=0;$contentType=''
 $params=@{Uri="$base$($check.Path)";Method=$check.Method;UseBasicParsing=$true;MaximumRedirection=0;ErrorAction='Stop'}
 if($check.Body){$params.ContentType='application/json';$params.Body=$check.Body}
 try{$res=Invoke-WebRequest @params;$status=[int]$res.StatusCode;$contentType=[string]$res.Headers['Content-Type']}
 catch{if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode;$contentType=[string]$_.Exception.Response.Headers['Content-Type']}}
 if($status -eq 401 -and $contentType -match 'application/json'){
  Write-Host "$($check.Name): HTTP 401 JSON PASS" -ForegroundColor Green;$passed++
 }else{Write-Host "$($check.Name): HTTP $status FAIL" -ForegroundColor Red}
}
Write-Host "BULK90 SAFE TEST RESULTS: PASS=$passed TOTAL=$($checks.Count)"
Write-Host 'All checks anonymous. No FAQ records modified.'
