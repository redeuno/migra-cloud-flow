-- =====================================================
-- CORREÇÃO DE SCHEMAS - OPÇÃO B
-- Alinhando agendamentos, aulas e contratos com prompts
-- =====================================================

-- 1. TABELA AGENDAMENTOS - Adicionar campos faltantes
ALTER TABLE public.agendamentos
ADD COLUMN IF NOT EXISTS criado_por_id uuid REFERENCES public.usuarios(id),
ADD COLUMN IF NOT EXISTS e_recorrente boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recorrencia_config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS agendamento_pai_id uuid REFERENCES public.agendamentos(id),
ADD COLUMN IF NOT EXISTS permite_checkin boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS checkin_aberto_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS checkin_fechado_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS notificacoes_enviadas jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS lembrete_enviado boolean DEFAULT false;

-- 2. TABELA AULAS - Expandir schema
ALTER TABLE public.aulas
ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES public.agendamentos(id),
ADD COLUMN IF NOT EXISTS min_alunos integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS objetivos text,
ADD COLUMN IF NOT EXISTS conteudo_programatico text,
ADD COLUMN IF NOT EXISTS material_necessario text,
ADD COLUMN IF NOT EXISTS checkin_habilitado boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS checkin_config jsonb DEFAULT '{"metodos": ["manual", "qrcode"], "antecedencia_minutos": 15}',
ADD COLUMN IF NOT EXISTS presencas jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS realizada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_realizacao timestamp with time zone;

-- 3. TABELA CONTRATOS - Completar schema
ALTER TABLE public.contratos
ADD COLUMN IF NOT EXISTS numero_contrato varchar UNIQUE,
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.usuarios(id),
ADD COLUMN IF NOT EXISTS valor_taxa_adesao numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_percentual numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
ADD COLUMN IF NOT EXISTS data_cancelamento timestamp with time zone;

-- Gerar número de contrato automático se não existir
CREATE OR REPLACE FUNCTION public.gerar_numero_contrato()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_contrato IS NULL THEN
    NEW.numero_contrato := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('contratos_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Criar sequence para contratos
CREATE SEQUENCE IF NOT EXISTS public.contratos_seq START 1;

-- Trigger para gerar número de contrato
DROP TRIGGER IF EXISTS trigger_gerar_numero_contrato ON public.contratos;
CREATE TRIGGER trigger_gerar_numero_contrato
BEFORE INSERT ON public.contratos
FOR EACH ROW
EXECUTE FUNCTION public.gerar_numero_contrato();

-- 4. CORRIGIR RLS - AVALIACOES (adicionar UPDATE/DELETE)
DROP POLICY IF EXISTS "Users can update own avaliacoes" ON public.avaliacoes;
CREATE POLICY "Users can update own avaliacoes"
ON public.avaliacoes
FOR UPDATE
TO authenticated
USING (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own avaliacoes" ON public.avaliacoes;
CREATE POLICY "Users can delete own avaliacoes"
ON public.avaliacoes
FOR DELETE
TO authenticated
USING (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Arena staff can manage all avaliacoes" ON public.avaliacoes;
CREATE POLICY "Arena staff can manage all avaliacoes"
ON public.avaliacoes
FOR ALL
TO authenticated
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'arena_admin')
  )
);

-- 5. MELHORAR RLS - MOVIMENTACOES_FINANCEIRAS
DROP POLICY IF EXISTS "Arena staff can insert movimentacoes" ON public.movimentacoes_financeiras;
CREATE POLICY "Arena staff can insert movimentacoes"
ON public.movimentacoes_financeiras
FOR INSERT
TO authenticated
WITH CHECK (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'arena_admin', 'funcionario')
  )
);

DROP POLICY IF EXISTS "Arena staff can update movimentacoes" ON public.movimentacoes_financeiras;
CREATE POLICY "Arena staff can update movimentacoes"
ON public.movimentacoes_financeiras
FOR UPDATE
TO authenticated
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'arena_admin')
  )
);

DROP POLICY IF EXISTS "Arena staff can delete movimentacoes" ON public.movimentacoes_financeiras;
CREATE POLICY "Arena staff can delete movimentacoes"
ON public.movimentacoes_financeiras
FOR DELETE
TO authenticated
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'arena_admin')
  )
);

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.agendamentos.e_recorrente IS 'Indica se é um agendamento recorrente';
COMMENT ON COLUMN public.agendamentos.recorrencia_config IS 'Configuração da recorrência: {frequencia: "semanal", dias: [1,3,5], data_fim: "2025-12-31"}';
COMMENT ON COLUMN public.aulas.checkin_config IS 'Configuração do check-in: {metodos: ["manual", "qrcode", "geo"], antecedencia_minutos: 15, tolerancia_atraso: 10}';
COMMENT ON COLUMN public.contratos.numero_contrato IS 'Número único do contrato gerado automaticamente';

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agendamentos_recorrente ON public.agendamentos(e_recorrente) WHERE e_recorrente = true;
CREATE INDEX IF NOT EXISTS idx_agendamentos_pai ON public.agendamentos(agendamento_pai_id) WHERE agendamento_pai_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aulas_agendamento ON public.aulas(agendamento_id) WHERE agendamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contratos_numero ON public.contratos(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_contratos_vendedor ON public.contratos(vendedor_id) WHERE vendedor_id IS NOT NULL;