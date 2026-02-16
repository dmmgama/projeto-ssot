$ErrorActionPreference = 'Stop'

$supabaseUrl = 'https://vkuqmnoepiddpidmdale.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXFtbm9lcGlkZHBpZG1kYWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTIxMDUsImV4cCI6MjA4Njc2ODEwNX0.66AiBEfBDuC0s6qp_vf3jCqQAEQZkynCkFLR0XoKeMs'

function New-TestUser($prefix) {
  $ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  return @{ Email = "$prefix`_$ts@jsj.pt"; Password = 'RlsTest@12345!' }
}

function Signup-Login($email, $password) {
  $baseHeaders = @{ apikey = $anonKey; 'Content-Type' = 'application/json' }
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $null = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/auth/v1/signup" -Headers $baseHeaders -Body $body

  $login = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Headers $baseHeaders -Body $body
  if (-not $login.access_token) { throw "Login falhou para $email" }

  return @{ Token = $login.access_token; UserId = $login.user.id }
}

$user1 = New-TestUser 'rlsuser1'
$user2 = New-TestUser 'rlsuser2'

Write-Host "[1/5] Signup/Login user1: $($user1.Email)"
$auth1 = Signup-Login $user1.Email $user1.Password
$headers1 = @{ apikey = $anonKey; Authorization = "Bearer $($auth1.Token)"; 'Content-Type' = 'application/json'; Prefer = 'return=representation' }

Write-Host "[2/5] user1 cria projeto"
$projectBody = @{ user_id = $auth1.UserId; nome_projeto = 'Projeto-RLS-A'; cliente = 'JSJ-RLS' } | ConvertTo-Json
$projectCreate = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/projects" -Headers $headers1 -Body $projectBody
$projectId = $projectCreate[0].id
if (-not $projectId) { throw 'user1 não conseguiu criar projeto' }

Write-Host "[3/5] Signup/Login user2: $($user2.Email)"
$auth2 = Signup-Login $user2.Email $user2.Password
$headers2 = @{ apikey = $anonKey; Authorization = "Bearer $($auth2.Token)"; 'Content-Type' = 'application/json' }

Write-Host '[4/5] user2 tenta listar e buscar projeto de user1'
$user2List = Invoke-RestMethod -Method Get -Uri "$supabaseUrl/rest/v1/projects?select=id,nome_projeto,cliente" -Headers $headers2
$foundInList = $user2List | Where-Object { $_.id -eq $projectId }

$user2Direct = Invoke-RestMethod -Method Get -Uri "$supabaseUrl/rest/v1/projects?select=*&id=eq.$projectId" -Headers $headers2
$directCount = if ($user2Direct) { @($user2Direct).Count } else { 0 }

if ($foundInList -or $directCount -gt 0) {
  throw 'RLS FALHOU: user2 conseguiu ver projeto de user1'
}

Write-Host '[5/5] Cleanup projeto teste user1'
Invoke-RestMethod -Method Delete -Uri "$supabaseUrl/rest/v1/projects?id=eq.$projectId" -Headers $headers1 | Out-Null

Write-Host 'SPRINT2_RLS_VALIDATION_OK'
