-- ====================================
-- FASE 2: SISTEMA DE MÓDULOS POR ARENA
-- ====================================

-- Trigger para popular arena_modulos quando arena é criada
CREATE OR REPLACE FUNCTION populate_arena_modulos()
RETURNS TRIGGER AS $$
DECLARE
  modulo_slug TEXT;
BEGIN
  -- Buscar módulos inclusos no plano
  FOR modulo_slug IN 
    SELECT jsonb_array_elements_text(
      (SELECT modulos_inclusos FROM planos_sistema WHERE id = NEW.plano_sistema_id)
    )
  LOOP
    INSERT INTO arena_modulos (arena_id, modulo_id, ativo)
    SELECT NEW.id, ms.id, true
    FROM modulos_sistema ms
    WHERE ms.slug = modulo_slug
    AND ms.status = 'ativo'
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_populate_arena_modulos ON arenas;
CREATE TRIGGER trigger_populate_arena_modulos
AFTER INSERT ON arenas
FOR EACH ROW
EXECUTE FUNCTION populate_arena_modulos();

-- ====================================
-- FASE 3: CATEGORIAS FINANCEIRAS
-- ====================================

-- Remover enum categoria e criar FK para categorias_financeiras
ALTER TABLE movimentacoes_financeiras 
  DROP COLUMN IF EXISTS categoria;

ALTER TABLE movimentacoes_financeiras
  ADD COLUMN categoria_id UUID REFERENCES categorias_financeiras(id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria 
  ON movimentacoes_financeiras(categoria_id);

-- ====================================
-- Popular arena_modulos para arenas existentes
-- ====================================
DO $$
DECLARE
  arena_record RECORD;
  modulo_slug TEXT;
BEGIN
  FOR arena_record IN SELECT id, plano_sistema_id FROM arenas
  LOOP
    -- Limpar registros existentes
    DELETE FROM arena_modulos WHERE arena_id = arena_record.id;
    
    -- Popular com módulos do plano
    FOR modulo_slug IN 
      SELECT jsonb_array_elements_text(
        (SELECT modulos_inclusos FROM planos_sistema WHERE id = arena_record.plano_sistema_id)
      )
    LOOP
      INSERT INTO arena_modulos (arena_id, modulo_id, ativo)
      SELECT arena_record.id, ms.id, true
      FROM modulos_sistema ms
      WHERE ms.slug = modulo_slug
      AND ms.status = 'ativo'
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;