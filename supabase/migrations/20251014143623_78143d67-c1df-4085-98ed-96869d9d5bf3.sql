-- Criar tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS public.historico_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  arena_id UUID REFERENCES public.arenas(id) ON DELETE CASCADE,
  tipo_acao VARCHAR(50) NOT NULL, -- 'login', 'agendamento_criado', 'pagamento', 'checkin', etc
  descricao TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_usuario ON public.historico_atividades(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_arena ON public.historico_atividades(arena_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_tipo ON public.historico_atividades(tipo_acao);

-- RLS policies
ALTER TABLE public.historico_atividades ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio histórico
CREATE POLICY "Users can view own history"
ON public.historico_atividades
FOR SELECT
USING (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));

-- Arena staff pode ver histórico da arena
CREATE POLICY "Arena staff can view arena history"
ON public.historico_atividades
FOR SELECT
USING (arena_id IN (
  SELECT arena_id FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('arena_admin', 'super_admin', 'funcionario')
));

-- Sistema pode inserir registros
CREATE POLICY "System can insert history"
ON public.historico_atividades
FOR INSERT
WITH CHECK (true);

-- Super admin pode ver tudo
CREATE POLICY "Super admin view all history"
ON public.historico_atividades
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Comentários
COMMENT ON TABLE public.historico_atividades IS 'Registro de todas as atividades dos usuários no sistema';
COMMENT ON COLUMN public.historico_atividades.tipo_acao IS 'Tipo de ação realizada pelo usuário';
COMMENT ON COLUMN public.historico_atividades.metadata IS 'Dados adicionais da atividade em formato JSON';