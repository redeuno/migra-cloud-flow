-- =====================================================
-- AUTOMAÇÃO 1: Sincronizar módulos quando plano muda
-- =====================================================
CREATE OR REPLACE FUNCTION sync_arena_modulos_on_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  modulo_slug TEXT;
  modulo_record RECORD;
BEGIN
  -- Se o plano mudou
  IF (OLD.plano_sistema_id IS DISTINCT FROM NEW.plano_sistema_id) OR 
     (TG_OP = 'INSERT' AND NEW.plano_sistema_id IS NOT NULL) THEN
    
    -- Desativar todos os módulos que NÃO estão no novo plano
    UPDATE arena_modulos
    SET ativo = false
    WHERE arena_id = NEW.id
    AND modulo_id NOT IN (
      SELECT ms.id
      FROM modulos_sistema ms
      WHERE ms.slug = ANY(
        SELECT jsonb_array_elements_text(
          (SELECT modulos_inclusos FROM planos_sistema WHERE id = NEW.plano_sistema_id)
        )
      )
      AND ms.status = 'ativo'
    );
    
    -- Adicionar e ativar módulos que estão no novo plano
    FOR modulo_slug IN 
      SELECT jsonb_array_elements_text(
        (SELECT modulos_inclusos FROM planos_sistema WHERE id = NEW.plano_sistema_id)
      )
    LOOP
      -- Buscar módulo
      SELECT * INTO modulo_record
      FROM modulos_sistema ms
      WHERE ms.slug = modulo_slug
      AND ms.status = 'ativo'
      LIMIT 1;
      
      IF modulo_record.id IS NOT NULL THEN
        -- Inserir ou ativar módulo
        INSERT INTO arena_modulos (arena_id, modulo_id, ativo, data_ativacao)
        VALUES (NEW.id, modulo_record.id, true, CURRENT_DATE)
        ON CONFLICT (arena_id, modulo_id) 
        DO UPDATE SET 
          ativo = true,
          data_ativacao = CURRENT_DATE;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar módulos quando arena é criada ou plano muda
DROP TRIGGER IF EXISTS sync_modulos_on_plan_change ON arenas;
CREATE TRIGGER sync_modulos_on_plan_change
  AFTER INSERT OR UPDATE OF plano_sistema_id ON arenas
  FOR EACH ROW
  EXECUTE FUNCTION sync_arena_modulos_on_plan_change();

-- =====================================================
-- AUTOMAÇÃO 2: Constraint única em arena_modulos
-- =====================================================
ALTER TABLE arena_modulos 
DROP CONSTRAINT IF EXISTS arena_modulos_arena_id_modulo_id_key;

ALTER TABLE arena_modulos 
ADD CONSTRAINT arena_modulos_arena_id_modulo_id_key 
UNIQUE (arena_id, modulo_id);

-- =====================================================
-- AUTOMAÇÃO 3: Verificar status da arena
-- =====================================================
CREATE OR REPLACE FUNCTION check_arena_status(_arena_id uuid)
RETURNS TABLE(
  status status_geral,
  data_vencimento date,
  dias_ate_vencimento integer,
  pode_acessar boolean,
  mensagem text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.status,
    a.data_vencimento,
    (a.data_vencimento - CURRENT_DATE) as dias_ate_vencimento,
    CASE 
      WHEN a.status = 'suspenso' THEN false
      WHEN a.status = 'inativo' THEN false
      WHEN a.data_vencimento < CURRENT_DATE THEN false
      ELSE true
    END as pode_acessar,
    CASE 
      WHEN a.status = 'suspenso' THEN 'Arena suspensa. Entre em contato com o suporte.'
      WHEN a.status = 'inativo' THEN 'Arena inativa. Entre em contato com o suporte.'
      WHEN a.data_vencimento < CURRENT_DATE THEN 'Assinatura vencida. Regularize o pagamento.'
      WHEN (a.data_vencimento - CURRENT_DATE) <= 3 THEN 'Assinatura vence em ' || (a.data_vencimento - CURRENT_DATE) || ' dias.'
      ELSE 'Arena ativa'
    END as mensagem
  FROM arenas a
  WHERE a.id = _arena_id;
$$;

-- =====================================================
-- AUTOMAÇÃO 4: Atualizar updated_at em arena_modulos
-- =====================================================
DROP TRIGGER IF EXISTS update_arena_modulos_updated_at ON arena_modulos;
CREATE TRIGGER update_arena_modulos_updated_at
  BEFORE UPDATE ON arena_modulos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();