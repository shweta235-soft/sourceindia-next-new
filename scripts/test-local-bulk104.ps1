# Bulk104 non-destructive anonymous-access matrix: tests secure 401, no database writes.
param([string]$Base = 'http://localhost:3000')
$ErrorActionPreference='Stop'
$ok=0;$failed=0;$total=0
function Check($label,$method,$path,$expected){
 $script:total++
 $options=@{Uri=($Base.TrimEnd('/')+$path);Method=$method;UseBasicParsing=$true;MaximumRedirection=0;ErrorAction='Stop';TimeoutSec=20}
 if($method -in @('POST','PUT','PATCH')){ $options.ContentType='application/json';$options.Body='{}' }
 try { $res=Invoke-WebRequest @options; $code=[int]$res.StatusCode }
 catch { if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}else{$code=0} }
 if($code -eq $expected){$script:ok++}else{ $script:failed++;Write-Host "FAIL $label ($method $path): got HTTP $code, expected $expected" }
}
$kinds=@('roles','activities','core-activities','applications','membership-plans','interest-subcategories','shortcut-menus','contacts')
foreach($kind in $kinds){
 $root='/admin/api/local/'+$kind
 Check "${kind}:list" 'GET' $root 401
 Check "${kind}:count" 'GET' ($root+'/count') 401
 Check "${kind}:server-side" 'GET' ($root+'/server-side') 401
 Check "${kind}:detail" 'GET' ($root+'/1') 401
 Check "${kind}:delete" 'DELETE' ($root+'/1') 401
 Check "${kind}:bulk-delete" 'DELETE' ($root+'/delete-selected') 401
 if($kind -ne 'contacts'){
  Check "${kind}:create" 'POST' $root 401
  Check "${kind}:update" 'PUT' ($root+'/1') 401
  Check "${kind}:status" 'PATCH' ($root+'/1/status') 401
 }
}
Check 'Core activity colors' 'GET' '/admin/api/local/core-activities/colors' 401
Check 'Activity by core category' 'GET' '/admin/api/local/activities/coreactivity/1' 401
Write-Host '------------------------------------'
Write-Host "BULK104 SECURITY RESULTS: PASS=$ok FAIL=$failed TOTAL=$total"
Write-Host 'All checks are anonymous. No DB writes, emails, or destructive operations are attempted.'
if($failed -gt 0){exit 1}
