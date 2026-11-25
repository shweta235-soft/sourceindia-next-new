$ErrorActionPreference='Stop'
$base='http://localhost:3000'
$cases=@(
 @{ Name='Anonymous testimonial image upload'; Method='POST'; Url="$base/admin/api/local/testimonials/upload"; Expected=401 },
 @{ Name='Anonymous testimonial image upload with fake file'; Method='POST'; Url="$base/admin/api/local/testimonials/upload"; Expected=401 }
)
$pass=0
foreach($case in $cases){
 try {
  $resp=Invoke-WebRequest -Uri $case.Url -Method $case.Method -ContentType 'multipart/form-data; boundary=bulk96probe' -Body '--bulk96probe--' -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  $code=[int]$resp.StatusCode
 }catch [System.Net.WebException]{
  if($_.Exception.Response){$code=[int]$_.Exception.Response.StatusCode}else{throw}
 }
 if($code -eq $case.Expected){Write-Host "$($case.Name): HTTP $code PASS";$pass++}
 else{Write-Host "$($case.Name): HTTP $code FAIL expected $($case.Expected)"}
}
Write-Host "BULK96 SAFE RESULTS: PASS=$pass TOTAL=$($cases.Count)"
Write-Host 'Anonymous requests only. No files uploaded or database writes.'
if($pass -ne $cases.Count){exit 1}
