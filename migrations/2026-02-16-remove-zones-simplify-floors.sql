-- =====================================================
-- Migration: Remove Zones + Simplify Floors (Secção 2)
-- Date: 2026-02-16
-- Description: 
--   - Remove tabela zones (model obsoleto)
--   - Simplifica floors para geometria base apenas
--   - Adiciona cotas_tosco (array JSONB)
--   - Remove campos técnicos (lajes, uso_ec1, etc)
-- =====================================================

-- STEP 1: Drop tabela zones (cascade remove foreign keys)
DROP TABLE IF EXISTS zones CASCADE;

-- STEP 2: Modificar tabela floors - Remover campos técnicos
-- (Esses dados serão geridos em Secção 7+)
ALTER TABLE floors DROP COLUMN IF EXISTS lajes;
ALTER TABLE floors DROP COLUMN IF EXISTS uso_ec1;
ALTER TABLE floors DROP COLUMN IF EXISTS permanentes;
ALTER TABLE floors DROP COLUMN IF EXISTS walls;
ALTER TABLE floors DROP COLUMN IF EXISTS sobrecargas;

-- STEP 3: Adicionar campo cotas_tosco (array de cotas)
-- Primeira cota do array = cota principal (field 'cota')
ALTER TABLE floors ADD COLUMN IF NOT EXISTS cotas_tosco JSONB DEFAULT '[]'::jsonb;

-- STEP 4: Migrar cota existente para cotas_tosco (se vazio)
UPDATE floors 
SET cotas_tosco = jsonb_build_array(cota)
WHERE cotas_tosco = '[]'::jsonb OR cotas_tosco IS NULL;

-- =====================================================
-- SCHEMA FINAL ESPERADO: floors
-- =====================================================
-- Campos:
--   - id UUID PRIMARY KEY
--   - block_id UUID (FK blocks)
--   - project_id UUID (FK projects)
--   - name TEXT (Nome piso, ex: "Piso 0")
--   - tipologia TEXT (fundacao|enterrado|elevado|cobertura)
--   - cota NUMERIC (Cota principal - primeira em cotas_tosco)
--   - cotas_tosco JSONB (Array de cotas: [0.0, 0.15, 0.30])
--   - image_path TEXT (Caminho Storage para planta arquitetura)
--   - created_at TIMESTAMP
--   - updated_at TIMESTAMP
-- =====================================================

-- Validação do schema (executar após migração)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'floors'
-- ORDER BY ordinal_position;
