-- =====================================================
-- Migration: Add actions_data to floors
-- Date: 2026-02-16
-- Description: 
--   Adicionar campo actions_data JSONB para guardar
--   dados de zonamento gráfico (Secção 7)
-- =====================================================

-- STEP 1: Adicionar campo actions_data
ALTER TABLE floors 
ADD COLUMN IF NOT EXISTS actions_data JSONB DEFAULT '{}'::jsonb;

-- STEP 2: Adicionar comentário
COMMENT ON COLUMN floors.actions_data IS 'Dados zonamento gráfico: layers, zones, rcp, etc (Secção 7)';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================
-- Verificar o campo foi criado:
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'floors' 
  AND column_name = 'actions_data';

-- Testar insert:
-- UPDATE floors 
-- SET actions_data = '{"layers": {}, "blueprint": {}}'::jsonb
-- WHERE id = '<test-floor-id>';
