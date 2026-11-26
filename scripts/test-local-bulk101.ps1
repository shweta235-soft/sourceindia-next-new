# Bulk101 safe HTTP checks. No authentication secrets, no database writes.
$ErrorActionPreference='Stop'
$base='http://localhost:3000';$ok=0;$fail=0
function Check($label,$path,$expected) {
 try {
  $r=Invoke-WebRequest -Uri ($base+$path) -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  $status=[int]$r.StatusCode;$body=$r.Content
 }catch{
  if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode;$body=''} else {$status=0;$body=''}
 }
 if($status -eq $expected){Write-Host "$label : HTTP $status PASS";$script:ok++}else{Write-Host "$label : HTTP $status FAIL expected $expected";$script:fail++}
}
foreach($module in @('ticket-categories','interest-categories')) {
 Check "$module public list" "/api/local/$module" 200
 Check "$module public count" "/api/local/$module/count" 200
 Check "$module invalid detail" "/api/local/$module/invalid" 400
 Check "$module admin anonymous list" "/admin/api/local/$module" 401
 Check "$module admin anonymous count" "/admin/api/local/$module/count" 401
 Check "$module admin anonymous detail" "/admin/api/local/$module/1" 401
}
Check 'seo public missing slug' '/api/local/seo-pages/slug/__bulk101_absent_slug__' 404
Check 'seo admin anonymous list' '/admin/api/local/seo-pages' 401
Check 'seo admin anonymous count' '/admin/api/local/seo-pages/count' 401
Check 'seo admin anonymous detail' '/admin/api/local/seo-pages/1' 401
Check 'seo admin anonymous slug' '/admin/api/local/seo-pages/slug/test' 401
Write-Host '------------------------------------'
Write-Host "BULK101 RESULTS: PASS=$ok FAIL=$fail TOTAL=$($ok+$fail)"
Write-Host 'All requests read only. No database changes.'
if($fail -gt 0){exit 1}
