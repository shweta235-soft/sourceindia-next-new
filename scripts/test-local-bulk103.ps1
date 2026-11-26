$ErrorActionPreference='Stop';$ok=0;$fail=0;$base='http://localhost:3000'
function Check($label,$path,$expected){
 try{$res=Invoke-WebRequest -Uri ($base+$path) -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop;$code=[int]$res.StatusCode}
 catch{if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}else{$code=0}}
 if($code -eq $expected){Write-Host "$label : HTTP $code PASS";$script:ok++}else{Write-Host "$label : HTTP $code FAIL expected $expected";$script:fail++}
}
Check 'Interest subcategory public list' '/api/local/interest-subcategories' 200
Check 'Interest subcategory public count' '/api/local/interest-subcategories/count' 200
Check 'Interest subcategory invalid ID' '/api/local/interest-subcategories/not-an-id' 400
Check 'Interest subcategory invalid category ID' '/api/local/interest-subcategories/category/not-an-id' 400
Check 'Interest subcategory invalid paging' '/api/local/interest-subcategories?page=0' 400
foreach($path in @('/admin/api/local/interest-subcategories','/admin/api/local/interest-subcategories/count','/admin/api/local/interest-subcategories/1','/admin/api/local/interest-subcategories/category/1','/admin/api/local/shortcut-menus','/admin/api/local/shortcut-menus/count','/admin/api/local/shortcut-menus/1')){Check "Admin anonymous $path" $path 401}
Write-Host '------------------------------------'
Write-Host "BULK103 RESULTS: PASS=$ok FAIL=$fail TOTAL=$($ok+$fail)"
Write-Host 'Read-only checks. No database writes.'
if($fail -gt 0){exit 1}
