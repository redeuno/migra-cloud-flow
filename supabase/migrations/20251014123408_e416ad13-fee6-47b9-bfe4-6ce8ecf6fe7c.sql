-- Popular arena_modulos para arenas existentes
-- Inserir todos os módulos do plano para cada arena existente

DO $$
DECLARE
  arena_record RECORD;
  modulo_slug TEXT;
BEGIN
  -- Para cada arena existente
  FOR arena_record IN SELECT id, plano_sistema_id FROM arenas
  LOOP
    -- Buscar módulos inclusos no plano e inserir
    FOR modulo_slug IN 
      SELECT jsonb_array_elements_text(
        (SELECT modulos_inclusos FROM planos_sistema WHERE id = arena_record.plano_sistema_id)
      )
    LOOP
      INSERT INTO arena_modulos (arena_id, modulo_id, ativo)
      SELECT 
        arena_record.id, 
        ms.id, 
        true
      FROM modulos_sistema ms
      WHERE ms.slug = modulo_slug
      AND ms.status = 'ativo'
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;