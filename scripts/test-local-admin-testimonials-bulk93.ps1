# Bulk93 anonymous read/write authorization tests. No session cookie, no DB modifications.
$base='http://localhost:3000'
$checks=@(
 @{Label='Admin testimonial listing';Path='/admin/api/local/testimonials';Method='GET'},
 @{Label='Admin testimonial count';Path='/admin/api/local/testimonials/count';Method='GET'},
 @{Label='Admin testimonial detail';Path='/admin/api/local/testimonials/1';Method='GET'},
 @{Label='Admin testimonial status change';Path='/admin/api/local/testimonials/1';Method='PATCH'}
)
$passed=0
foreach($c in $checks){
 $status=0;$contentType=''
 try{
  $arg=@{Uri=($base+$c.Path);Method=$c.Method;UseBasicParsing=$true;MaximumRedirection=0;ErrorAction='Stop'}
  if($c.Method -eq 'PATCH'){$arg.ContentType='application/json';$arg.Body='{"status":1}'}
  $r=Invoke-WebRequest @arg
  $status=[int]$r.StatusCode;$contentType=[string]$r.Headers['Content-Type']
 }catch{
  if($null -ne $_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode;$contentType=[string]$_.Exception.Response.Headers['Content-Type']}
 }
 if($status -eq 401 -and $contentType -match 'application/json'){
  Write-Host "$($c.Label): HTTP 401 JSON PASS" -ForegroundColor Green;$passed++
 }else{Write-Host "$($c.Label): HTTP $status FAIL (expected JSON 401)" -ForegroundColor Red}
}
Write-Host "BULK93 SAFE RESULTS: PASS=$passed TOTAL=$($checks.Count)"
Write-Host 'Anonymous tests only. No testimonial records modified.'
