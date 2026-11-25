$ErrorActionPreference = 'Stop'
$base='http://localhost:3000'
$cases=@(
 @{Name='Invalid public image ID';Url="$base/api/local/testimonials/images/not-an-id";Expected=400},
 @{Name='Anonymous Admin testimonial image';Url="$base/admin/api/local/testimonials/images/1";Expected=401},
 @{Name='Anonymous Admin invalid image ID';Url="$base/admin/api/local/testimonials/images/not-an-id";Expected=401}
)
$pass=0
foreach($case in $cases){
 try{$r=Invoke-WebRequest -Uri $case.Url -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop;$code=[int]$r.StatusCode;$json=$r.Headers['Content-Type'] -match 'application/json'}
 catch [System.Net.WebException] {if(!$_.Exception.Response){throw};$code=[int]$_.Exception.Response.StatusCode;$json=$_.Exception.Response.ContentType -match 'application/json'}
 if($code -eq $case.Expected -and $json){Write-Host "$($case.Name): HTTP $code JSON PASS";$pass++}
 else{Write-Host "$($case.Name): HTTP $code FAIL expected $($case.Expected) JSON"}
}
Write-Host "BULK97 SAFE RESULTS: PASS=$pass TOTAL=$($cases.Count)"
Write-Host 'No images uploaded; no database writes.'
if($pass -ne $cases.Count){exit 1}
