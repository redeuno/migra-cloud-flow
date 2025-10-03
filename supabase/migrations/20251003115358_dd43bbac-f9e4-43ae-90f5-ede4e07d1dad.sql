-- =====================================================
-- VERANA - CORREÇÃO DE SEGURANÇA (RLS POLICIES)
-- =====================================================

-- Adicionar policies faltantes para aulas_alunos
CREATE POLICY "Users manage own aula inscriptions" ON public.aulas_alunos
FOR INSERT WITH CHECK (
  usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
);

CREATE POLICY "Users update own aula inscriptions" ON public.aulas_alunos
FOR UPDATE USING (
  usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
  OR aula_id IN (SELECT id FROM public.aulas WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Arena staff delete aula inscriptions" ON public.aulas_alunos
FOR DELETE USING (
  aula_id IN (SELECT id FROM public.aulas WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

-- Adicionar policies faltantes para mensalidades
CREATE POLICY "Users view own mensalidades" ON public.mensalidades
FOR SELECT USING (
  contrato_id IN (
    SELECT id FROM public.contratos 
    WHERE usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
  )
  OR contrato_id IN (SELECT id FROM public.contratos WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Arena staff manage mensalidades" ON public.mensalidades
FOR ALL USING (
  contrato_id IN (SELECT id FROM public.contratos WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

-- Adicionar policies faltantes para torneios_inscricoes
CREATE POLICY "Users create own inscricoes" ON public.torneios_inscricoes
FOR INSERT WITH CHECK (
  usuario_id = (SELECT id FROM public.usuarios WHERE auth_id = auth.uid())
);

CREATE POLICY "Arena staff manage inscricoes" ON public.torneios_inscricoes
FOR ALL USING (
  torneio_id IN (SELECT id FROM public.torneios WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

-- Adicionar policies faltantes para torneios_jogos
CREATE POLICY "Users view jogos" ON public.torneios_jogos
FOR SELECT USING (
  torneio_id IN (SELECT id FROM public.torneios WHERE status != 'planejamento')
  OR torneio_id IN (SELECT id FROM public.torneios WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Arena staff manage jogos" ON public.torneios_jogos
FOR INSERT WITH CHECK (
  torneio_id IN (SELECT id FROM public.torneios WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Arena staff update jogos" ON public.torneios_jogos
FOR UPDATE USING (
  torneio_id IN (SELECT id FROM public.torneios WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

CREATE POLICY "Arena staff delete jogos" ON public.torneios_jogos
FOR DELETE USING (
  torneio_id IN (SELECT id FROM public.torneios WHERE arena_id IN (SELECT arena_id FROM public.user_roles WHERE user_id = auth.uid()))
);

-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Adicionar trigger de updated_at nas tabelas que faltavam
CREATE TRIGGER update_aulas_alunos_updated_at BEFORE UPDATE ON public.aulas_alunos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON public.mensalidades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimentacoes_updated_at BEFORE UPDATE ON public.movimentacoes_financeiras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inscricoes_updated_at BEFORE UPDATE ON public.torneios_inscricoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jogos_updated_at BEFORE UPDATE ON public.torneios_jogos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modulos_sistema_updated_at BEFORE UPDATE ON public.modulos_sistema
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arena_modulos_updated_at BEFORE UPDATE ON public.arena_modulos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bloqueios_updated_at BEFORE UPDATE ON public.bloqueios_quadra
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();