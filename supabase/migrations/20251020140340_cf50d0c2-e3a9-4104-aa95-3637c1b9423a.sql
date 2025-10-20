-- FASE 2.1: Trigger para atualizar arena.data_vencimento quando assinatura é criada/atualizada
CREATE OR REPLACE FUNCTION public.update_arena_vencimento_on_assinatura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nova_data_vencimento date;
BEGIN
  -- Calcular nova data de vencimento baseada no dia_vencimento e data_inicio
  IF NEW.status = 'ativo' THEN
    -- Se é nova assinatura (INSERT) ou mudou para ativo
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'ativo')) THEN
      -- Próximo vencimento = mês atual ou próximo + dia_vencimento
      v_nova_data_vencimento := date_trunc('month', CURRENT_DATE) + 
                                 interval '1 month' + 
                                 (NEW.dia_vencimento - 1 || ' days')::interval;
      
      -- Se já passou o dia de vencimento deste mês, usar próximo mês
      IF EXTRACT(DAY FROM CURRENT_DATE) >= NEW.dia_vencimento THEN
        v_nova_data_vencimento := v_nova_data_vencimento + interval '1 month';
      END IF;
      
      -- Atualizar arena
      UPDATE arenas
      SET data_vencimento = v_nova_data_vencimento,
          updated_at = now()
      WHERE id = NEW.arena_id;
      
      RAISE LOG 'Arena % data_vencimento atualizada para %', NEW.arena_id, v_nova_data_vencimento;
    END IF;
  ELSIF NEW.status IN ('cancelado', 'suspenso') AND OLD.status = 'ativo' THEN
    -- Se assinatura foi cancelada/suspensa, manter data_vencimento mas registrar
    RAISE LOG 'Assinatura % arena % mudou para status %', NEW.id, NEW.arena_id, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_update_arena_vencimento_on_assinatura ON assinaturas_arena;
CREATE TRIGGER trg_update_arena_vencimento_on_assinatura
  AFTER INSERT OR UPDATE OF status, dia_vencimento ON assinaturas_arena
  FOR EACH ROW
  EXECUTE FUNCTION public.update_arena_vencimento_on_assinatura();

-- FASE 2.2: Trigger para gerar primeira fatura quando assinatura é criada
CREATE OR REPLACE FUNCTION public.gerar_primeira_fatura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_competencia date;
  v_data_vencimento date;
  v_arena_info record;
BEGIN
  -- Só gerar fatura se assinatura está ativa e é INSERT
  IF TG_OP = 'INSERT' AND NEW.status = 'ativo' THEN
    
    -- Buscar informações da arena
    SELECT a.nome, a.email, a.cnpj
    INTO v_arena_info
    FROM arenas a
    WHERE a.id = NEW.arena_id;
    
    -- Calcular competência (mês/ano atual)
    v_competencia := date_trunc('month', CURRENT_DATE)::date;
    
    -- Calcular data de vencimento
    v_data_vencimento := date_trunc('month', CURRENT_DATE) + 
                         interval '1 month' + 
                         (NEW.dia_vencimento - 1 || ' days')::interval;
    
    -- Se já passou o dia de vencimento deste mês, usar próximo mês
    IF EXTRACT(DAY FROM CURRENT_DATE) >= NEW.dia_vencimento THEN
      v_data_vencimento := v_data_vencimento + interval '1 month';
      v_competencia := v_competencia + interval '1 month';
    END IF;
    
    -- Verificar se já existe fatura para esta competência
    IF NOT EXISTS (
      SELECT 1 FROM faturas_sistema
      WHERE assinatura_arena_id = NEW.id
        AND competencia = v_competencia
    ) THEN
      -- Inserir primeira fatura
      INSERT INTO faturas_sistema (
        assinatura_arena_id,
        arena_id,
        competencia,
        data_vencimento,
        valor,
        status_pagamento,
        observacoes
      ) VALUES (
        NEW.id,
        NEW.arena_id,
        v_competencia,
        v_data_vencimento,
        NEW.valor_mensal,
        'pendente',
        'Primeira fatura gerada automaticamente ao criar assinatura'
      );
      
      RAISE LOG 'Primeira fatura gerada para assinatura % - Arena %', NEW.id, v_arena_info.nome;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_gerar_primeira_fatura ON assinaturas_arena;
CREATE TRIGGER trg_gerar_primeira_fatura
  AFTER INSERT ON assinaturas_arena
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_primeira_fatura();

COMMENT ON FUNCTION public.update_arena_vencimento_on_assinatura() IS 'Atualiza data_vencimento da arena quando assinatura é criada/atualizada';
COMMENT ON FUNCTION public.gerar_primeira_fatura() IS 'Gera primeira fatura automaticamente ao criar assinatura ativa';