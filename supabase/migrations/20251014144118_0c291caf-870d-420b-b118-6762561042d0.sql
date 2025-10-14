-- Criar tabela de comissões de professores
CREATE TABLE IF NOT EXISTS public.comissoes_professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  arena_id UUID NOT NULL REFERENCES public.arenas(id) ON DELETE CASCADE,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
  referencia DATE NOT NULL, -- Mês de referência (YYYY-MM-01)
  valor_aulas NUMERIC(10,2) NOT NULL DEFAULT 0, -- Valor total das aulas
  percentual_comissao NUMERIC(5,2) NOT NULL DEFAULT 0, -- Percentual de comissão
  valor_comissao NUMERIC(10,2) NOT NULL DEFAULT 0, -- Valor calculado da comissão
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, pago, cancelado
  data_pagamento TIMESTAMPTZ,
  observacoes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comissoes_professor ON public.comissoes_professores(professor_id, referencia DESC);
CREATE INDEX IF NOT EXISTS idx_comissoes_arena ON public.comissoes_professores(arena_id, referencia DESC);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON public.comissoes_professores(status);

-- RLS
ALTER TABLE public.comissoes_professores ENABLE ROW LEVEL SECURITY;

-- Professores veem suas comissões
CREATE POLICY "Professores view own comissoes"
ON public.comissoes_professores
FOR SELECT
USING (
  professor_id IN (
    SELECT id FROM professores WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE auth_id = auth.uid()
    )
  )
);

-- Arena staff gerencia comissões
CREATE POLICY "Arena staff manage comissoes"
ON public.comissoes_professores
FOR ALL
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('arena_admin', 'super_admin', 'funcionario')
  )
);

-- Adicionar campo de comissão no professor
ALTER TABLE public.professores 
ADD COLUMN IF NOT EXISTS percentual_comissao_padrao NUMERIC(5,2) DEFAULT 30.00;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_comissoes_professores_updated_at
BEFORE UPDATE ON public.comissoes_professores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.comissoes_professores IS 'Registro de comissões de professores por aulas ministradas';
COMMENT ON COLUMN public.comissoes_professores.referencia IS 'Mês de referência no formato YYYY-MM-01';
COMMENT ON COLUMN public.comissoes_professores.percentual_comissao IS 'Percentual da comissão aplicado (0-100)';
COMMENT ON COLUMN public.comissoes_professores.status IS 'Status do pagamento: pendente, pago, cancelado';