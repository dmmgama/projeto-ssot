# =====================================================
# Script: Executar migração remove zones + simplify floors
# Executar: .\migrations\run-migration-zones.ps1
# =====================================================

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "MIGRAÇÃO: Remove Zones + Simplify Floors" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = Join-Path $PSScriptRoot "2026-02-16-remove-zones-simplify-floors.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Erro: Ficheiro de migração não encontrado!" -ForegroundColor Red
    Write-Host "   Path: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Ficheiro de migração: $migrationFile" -ForegroundColor Green
Write-Host ""

# Verificar se supabase CLI está instalado
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if ($null -eq $supabaseCLI) {
    Write-Host "⚠️  Supabase CLI não encontrado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPÇÃO 1: Instalar Supabase CLI" -ForegroundColor Cyan
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "OPÇÃO 2: Executar manualmente no Supabase Dashboard" -ForegroundColor Cyan
    Write-Host "  1. Aceder: https://app.supabase.com/project/_/sql" -ForegroundColor White
    Write-Host "  2. Copiar conteúdo de: $migrationFile" -ForegroundColor White
    Write-Host "  3. Colar no SQL Editor" -ForegroundColor White
    Write-Host "  4. Executar (RUN)" -ForegroundColor White
    Write-Host ""
    
    # Abrir ficheiro SQL automaticamente
    Write-Host "🔧 A abrir ficheiro SQL..." -ForegroundColor Green
    Start-Process notepad.exe -ArgumentList $migrationFile
    
    exit 0
}

# Supabase CLI encontrado - executar migração
Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  ATENÇÃO: Esta migração vai:" -ForegroundColor Yellow
Write-Host "   - APAGAR tabela 'zones' (dados perdidos permanentemente)" -ForegroundColor Red
Write-Host "   - REMOVER campos: lajes, uso_ec1, permanentes, walls, sobrecargas" -ForegroundColor Red
Write-Host "   - ADICIONAR campo: cotas_tosco (JSONB array)" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Continuar? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Migração cancelada pelo utilizador" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 A executar migração..." -ForegroundColor Green

# Executar via Supabase CLI
try {
    $content = Get-Content $migrationFile -Raw
    $content | supabase db diff --use-migra --file - --local
    
    Write-Host ""
    Write-Host "✅ Migração executada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Validação: Verificar schema floors" -ForegroundColor Cyan
    Write-Host "   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'floors';" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migração:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Executar manualmente no Dashboard: https://app.supabase.com/project/_/sql" -ForegroundColor Yellow
    exit 1
}
