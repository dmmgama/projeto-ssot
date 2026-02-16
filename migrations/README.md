# Migrations - Database Schema

## Executar Migração: Remove Zones + Simplify Floors

### Opção 1: PowerShell Script (Recomendado)

```powershell
.\migrations\run-migration-zones.ps1
```

### Opção 2: Supabase Dashboard (Manual)

1. Aceder ao SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
2. Abrir ficheiro: `migrations/2026-02-16-remove-zones-simplify-floors.sql`
3. Copiar todo o conteúdo
4. Colar no SQL Editor
5. Clicar **RUN**

### Opção 3: Supabase CLI

```bash
supabase db push
```

---

## ⚠️ ATENÇÃO: Migração Destrutiva

Esta migração remove:
- **Tabela `zones`** (dados perdidos permanentemente)
- **Campos em `floors`**: `lajes`, `uso_ec1`, `permanentes`, `walls`, `sobrecargas`

Dados serão re-introduzidos em Secções 7+ do workflow.

---

## Validar Migração

```sql
-- Verificar schema floors (esperado)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'floors'
ORDER BY ordinal_position;

-- Resultado esperado:
-- name          | text
-- tipologia     | text
-- cota          | numeric
-- cotas_tosco   | jsonb
-- image_path    | text
-- (Sem: lajes, uso_ec1, permanentes, walls, sobrecargas)
```

---

## Histórico de Migrações

| Data       | Ficheiro                                      | Descrição                          |
|------------|----------------------------------------------|------------------------------------|
| 2026-02-16 | `2026-02-16-remove-zones-simplify-floors.sql` | Remove zones, simplifica floors    |

