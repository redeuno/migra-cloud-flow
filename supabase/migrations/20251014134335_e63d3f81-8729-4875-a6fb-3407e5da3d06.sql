-- Criar enum para tipos de notificação
CREATE TYPE tipo_notificacao AS ENUM (
  'agendamento_novo',
  'agendamento_cancelado',
  'checkin_realizado',
  'pagamento_recebido',
  'pagamento_vencido',
  'mensalidade_proxima',
  'contrato_expirando',
  'aula_confirmada',
  'torneio_inscricao',
  'sistema_alerta',
  'financeiro_alerta'
);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  arena_id UUID REFERENCES arenas(id) ON DELETE CASCADE,
  tipo tipo_notificacao NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  link VARCHAR(500),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  lida_em TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_arena ON notificacoes(arena_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(usuario_id, lida);
CREATE INDEX idx_notificacoes_created ON notificacoes(created_at DESC);

-- Habilitar RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários veem suas notificações"
ON notificacoes
FOR SELECT
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Sistema pode criar notificações"
ON notificacoes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas notificações"
ON notificacoes
FOR UPDATE
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar suas notificações"
ON notificacoes
FOR DELETE
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_id = auth.uid()
  )
);

-- Função para criar notificação de novo agendamento
CREATE OR REPLACE FUNCTION notificar_novo_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome TEXT;
  v_quadra_info TEXT;
BEGIN
  -- Buscar informações
  SELECT u.nome_completo INTO v_cliente_nome
  FROM usuarios u WHERE u.id = NEW.cliente_id;
  
  SELECT 'Quadra ' || q.numero || ' - ' || q.nome INTO v_quadra_info
  FROM quadras q WHERE q.id = NEW.quadra_id;

  -- Criar notificação para admins da arena
  INSERT INTO notificacoes (usuario_id, arena_id, tipo, titulo, mensagem, link, metadata)
  SELECT 
    u.id,
    NEW.arena_id,
    'agendamento_novo',
    'Novo Agendamento',
    'Agendamento criado para ' || v_cliente_nome || ' em ' || v_quadra_info,
    '/agendamentos',
    jsonb_build_object('agendamento_id', NEW.id)
  FROM usuarios u
  INNER JOIN user_roles ur ON ur.user_id = u.auth_id
  WHERE ur.arena_id = NEW.arena_id 
    AND ur.role IN ('arena_admin', 'super_admin');

  RETURN NEW;
END;
$$;

-- Trigger para novos agendamentos
DROP TRIGGER IF EXISTS trigger_notificar_novo_agendamento ON agendamentos;
CREATE TRIGGER trigger_notificar_novo_agendamento
AFTER INSERT ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION notificar_novo_agendamento();

-- Função para notificar check-in
CREATE OR REPLACE FUNCTION notificar_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome TEXT;
BEGIN
  IF NEW.checkin_realizado = true AND (OLD.checkin_realizado IS NULL OR OLD.checkin_realizado = false) THEN
    SELECT u.nome_completo INTO v_cliente_nome
    FROM usuarios u WHERE u.id = NEW.cliente_id;

    INSERT INTO notificacoes (usuario_id, arena_id, tipo, titulo, mensagem, link, metadata)
    SELECT 
      u.id,
      NEW.arena_id,
      'checkin_realizado',
      'Check-in Realizado',
      v_cliente_nome || ' fez check-in',
      '/agendamentos',
      jsonb_build_object('agendamento_id', NEW.id)
    FROM usuarios u
    INNER JOIN user_roles ur ON ur.user_id = u.auth_id
    WHERE ur.arena_id = NEW.arena_id 
      AND ur.role IN ('arena_admin', 'super_admin');
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para check-ins
DROP TRIGGER IF EXISTS trigger_notificar_checkin ON agendamentos;
CREATE TRIGGER trigger_notificar_checkin
AFTER UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION notificar_checkin();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;