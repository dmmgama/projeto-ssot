$ErrorActionPreference = 'Stop'

$supabaseUrl = 'https://vkuqmnoepiddpidmdale.supabase.co'
$anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdXFtbm9lcGlkZHBpZG1kYWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTIxMDUsImV4cCI6MjA4Njc2ODEwNX0.66AiBEfBDuC0s6qp_vf3jCqQAEQZkynCkFLR0XoKeMs'

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "autotask21_$timestamp@jsj.pt"
$password = 'AutoTask21@12345!'
$projectName = "Task2.1-Validation-$timestamp"
$cliente = 'JSJ-Validation'
$blockName = "Bloco-$timestamp"

Write-Host "[1/6] Signup user: $email"
$signupHeaders = @{
  'apikey' = $anonKey
  'Content-Type' = 'application/json'
}
$signupBody = @{ email = $email; password = $password } | ConvertTo-Json
$null = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/auth/v1/signup" -Headers $signupHeaders -Body $signupBody

Write-Host "[2/6] Login user"
$loginHeaders = @{
  'apikey' = $anonKey
  'Content-Type' = 'application/json'
}
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Headers $loginHeaders -Body $loginBody

if (-not $login.access_token) {
  throw 'Login não retornou access_token (possível email confirmation obrigatória)'
}

$accessToken = $login.access_token
$userId = $login.user.id

$authHeaders = @{
  'apikey' = $anonKey
  'Authorization' = "Bearer $accessToken"
  'Content-Type' = 'application/json'
  'Prefer' = 'return=representation'
}

Write-Host "[3/6] createProject (REST equivalente)"
$projectBody = @{ user_id = $userId; nome_projeto = $projectName; cliente = $cliente } | ConvertTo-Json
$projectCreate = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/projects" -Headers $authHeaders -Body $projectBody
if (-not $projectCreate -or -not $projectCreate[0].id) {
  throw 'Falha ao criar project via REST'
}
$projectId = $projectCreate[0].id

Write-Host "[4/6] listUserProjects (REST equivalente)"
$listProjects = Invoke-RestMethod -Method Get -Uri "$supabaseUrl/rest/v1/projects?select=id,nome_projeto,cliente,updated_at&order=updated_at.desc" -Headers $authHeaders
$foundProject = $listProjects | Where-Object { $_.id -eq $projectId }
if (-not $foundProject) {
  throw 'Projeto criado não encontrado na listagem'
}

Write-Host "[5/6] Task 2.2 quick check create/list block"
$blockBody = @{ project_id = $projectId; name = $blockName; block_type = 'building' } | ConvertTo-Json
$blockCreate = Invoke-RestMethod -Method Post -Uri "$supabaseUrl/rest/v1/blocks" -Headers $authHeaders -Body $blockBody
if (-not $blockCreate -or -not $blockCreate[0].id) {
  throw 'Falha ao criar block via REST'
}
$blockId = $blockCreate[0].id
$listBlocks = Invoke-RestMethod -Method Get -Uri "$supabaseUrl/rest/v1/blocks?select=*&project_id=eq.$projectId" -Headers $authHeaders
$foundBlock = $listBlocks | Where-Object { $_.id -eq $blockId }
if (-not $foundBlock) {
  throw 'Block criado não encontrado na listagem'
}

Write-Host "[6/6] Cleanup test data"
Invoke-RestMethod -Method Delete -Uri "$supabaseUrl/rest/v1/blocks?id=eq.$blockId" -Headers $authHeaders | Out-Null
Invoke-RestMethod -Method Delete -Uri "$supabaseUrl/rest/v1/projects?id=eq.$projectId" -Headers $authHeaders | Out-Null

Write-Host 'VALIDACAO_TASKS_2_1_2_OK'
