# Anonymous-only HTTP check. No DB writes because admin cookie is deliberately absent.
$base='http://localhost:3000'
$checks=@(
 @{Label='Testimonial create anonymous';Path='/admin/api/local/testimonials';Method='POST';Body='{"name":"No write","description":"No write","status":1,"file_id":1}'},
 @{Label='Testimonial edit anonymous';Path='/admin/api/local/testimonials/1';Method='PUT';Body='{"name":"No write","description":"No write","status":1,"file_id":1}'},
 @{Label='Testimonial soft-delete anonymous';Path='/admin/api/local/testimonials/1';Method='DELETE';Body=$null}
)
$passed=0
foreach($c in $checks){
 $code=0;$ct=''
 try{
  $arg=@{Uri=($base+$c.Path);Method=$c.Method;UseBasicParsing=$true;MaximumRedirection=0;ErrorAction='Stop'}
  if($null -ne $c.Body){$arg.ContentType='application/json';$arg.Body=$c.Body}
  $r=Invoke-WebRequest @arg;$code=[int]$r.StatusCode;$ct=[string]$r.Headers['Content-Type']
 }catch{if($null -ne $_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode;$ct=[string]$_.Exception.Response.Headers['Content-Type']}}
 if($code -eq 401 -and $ct -match 'application/json') {Write-Host "$($c.Label): HTTP 401 JSON PASS" -ForegroundColor Green;$passed++}
 else {Write-Host "$($c.Label): HTTP $code FAIL (expected JSON 401)" -ForegroundColor Red}
}
Write-Host "BULK95 SAFE RESULTS: PASS=$passed TOTAL=$($checks.Count)"
Write-Host 'Anonymous-only checks. No testimonial records modified.'
