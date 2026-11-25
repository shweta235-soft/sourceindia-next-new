# Bulk98 - combined read-only public checks + anonymous admin access denial. Windows PowerShell 5.1.
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$pass=0;$fail=0;$skip=0
function Check([string]$name,[string]$uri,[int]$expected){
 $status=0;$value=$null
 try{$r=Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop;$status=[int]$r.StatusCode;try{$value=$r.Content|ConvertFrom-Json}catch{}}
 catch{if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}}
 if($status -eq $expected){Write-Host "${name}: HTTP $status PASS" -ForegroundColor Green;$script:pass++}
 else{Write-Host "${name}: HTTP $status FAIL expected $expected" -ForegroundColor Red;$script:fail++}
 return $value
}
foreach($module in @('knowledge-center','front-menu')){
 $data=Check "$module public list" "$base/api/local/$module" 200
 $null=Check "$module public count" "$base/api/local/$module/count" 200
 $null=Check "$module invalid id" "$base/api/local/$module/invalid" 400
 $id=$null
 if($data -and $data.items -and @($data.items).Count -gt 0){$id=@($data.items)[0].id}
 if($id){$null=Check "$module detail" "$base/api/local/$module/$id" 200}
 else{Write-Host "$module detail: SKIPPED no visible records" -ForegroundColor Yellow;$skip++}
 foreach($url in @("$base/admin/api/local/$module","$base/admin/api/local/$module/count","$base/admin/api/local/$module/1")){$null=Check "$module anonymous admin protected" $url 401}
}
$null=Check 'knowledge invalid paging' "$base/api/local/knowledge-center?page=0" 400
Write-Host '------------------------------------'
Write-Host "BULK98 RESULTS: PASS=$pass FAIL=$fail SKIPPED=$skip"
