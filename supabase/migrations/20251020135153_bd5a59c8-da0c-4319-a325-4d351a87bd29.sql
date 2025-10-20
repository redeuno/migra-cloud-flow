-- ============================================
-- FASE 1: CORREÇÕES CRÍTICAS - AUTOMAÇÕES DE ARENAS
-- ============================================

-- 1. CORRIGIR TRIGGER sync_arena_modulos_on_plan_change
-- Fazer disparar também em INSERT (não só UPDATE)
-- ============================================

DROP TRIGGER IF EXISTS trg_sync_arena_modulos_on_plan_change ON arenas;

CREATE TRIGGER trg_sync_arena_modulos_on_plan_change
  AFTER INSERT OR UPDATE OF plano_sistema_id ON arenas
  FOR EACH ROW
  WHEN (NEW.plano_sistema_id IS NOT NULL)
  EXECUTE FUNCTION sync_arena_modulos_on_plan_change();

-- 2. CRIAR TRIGGER auto_create_configuracoes_arena
-- Cria configurações padrão ao criar nova arena
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_configuracoes_arena()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar configurações padrão para nova arena
  INSERT INTO configuracoes_arena (
    arena_id,
    notificacoes_email_enabled,
    notificacoes_whatsapp_enabled,
    evolution_api_enabled,
    template_lembrete_pagamento,
    template_confirmacao_pagamento
  ) VALUES (
    NEW.id,
    false, -- Email desabilitado por padrão
    false, -- WhatsApp desabilitado por padrão
    false, -- Evolution API desabilitada por padrão
    'Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}. Link para pagamento: {{link_pagamento}}',
    'Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}. Obrigado!'
  )
  ON CONFLICT (arena_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_configuracoes_arena ON arenas;

CREATE TRIGGER trg_auto_create_configuracoes_arena
  AFTER INSERT ON arenas
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_configuracoes_arena();

-- 3. CRIAR TRIGGER auto_create_assinatura_on_plan_set
-- Cria assinatura automaticamente quando plano é associado à arena
-- ============================================

CREATE OR REPLACE FUNCTION auto_create_assinatura_on_plan_set()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano_valor numeric;
BEGIN
  -- Só criar assinatura se plano foi definido e não existe assinatura ativa
  IF NEW.plano_sistema_id IS NOT NULL AND 
     (TG_OP = 'INSERT' OR OLD.plano_sistema_id IS DISTINCT FROM NEW.plano_sistema_id) THEN
    
    -- Verificar se já existe assinatura ativa
    IF NOT EXISTS (
      SELECT 1 FROM assinaturas_arena 
      WHERE arena_id = NEW.id 
        AND status = 'ativo'
    ) THEN
      -- Buscar valor do plano
      SELECT valor_mensal INTO v_plano_valor
      FROM planos_sistema
      WHERE id = NEW.plano_sistema_id;
      
      -- Criar assinatura
      INSERT INTO assinaturas_arena (
        arena_id,
        plano_sistema_id,
        valor_mensal,
        data_inicio,
        dia_vencimento,
        status
      ) VALUES (
        NEW.id,
        NEW.plano_sistema_id,
        COALESCE(v_plano_valor, 0),
        CURRENT_DATE,
        5, -- Dia 5 como padrão
        'ativo'
      )
      ON CONFLICT DO NOTHING;
      
      RAISE LOG 'Assinatura criada automaticamente para arena %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_assinatura_on_plan_set ON arenas;

CREATE TRIGGER trg_auto_create_assinatura_on_plan_set
  AFTER INSERT OR UPDATE OF plano_sistema_id ON arenas
  FOR EACH ROW
  WHEN (NEW.plano_sistema_id IS NOT NULL)
  EXECUTE FUNCTION auto_create_assinatura_on_plan_set();

-- 4. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON FUNCTION auto_create_configuracoes_arena() IS 
'Cria automaticamente registro de configurações padrão ao inserir nova arena';

COMMENT ON FUNCTION auto_create_assinatura_on_plan_set() IS 
'Cria automaticamente assinatura quando plano é associado à arena pela primeira vez';

COMMENT ON TRIGGER trg_sync_arena_modulos_on_plan_change ON arenas IS 
'Sincroniza módulos da arena baseado no plano - dispara em INSERT e UPDATE';

COMMENT ON TRIGGER trg_auto_create_configuracoes_arena ON arenas IS 
'Cria configurações padrão ao criar nova arena';

COMMENT ON TRIGGER trg_auto_create_assinatura_on_plan_set ON arenas IS 
'Cria assinatura automática ao definir plano da arena';