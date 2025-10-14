-- FASE 1: Adicionar policy para super_admin visualizar todas arenas
CREATE POLICY "Super admin pode visualizar todas arenas"
ON public.arenas 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- FASE 4: Índices de performance para queries de financeiro
CREATE INDEX IF NOT EXISTS idx_assinaturas_arena_status 
ON public.assinaturas_arena(arena_id, status) 
WHERE status = 'ativo';

CREATE INDEX IF NOT EXISTS idx_faturas_status_vencimento
ON public.faturas_sistema(status_pagamento, data_vencimento)
WHERE status_pagamento IN ('pendente', 'vencido');

CREATE INDEX IF NOT EXISTS idx_quadras_status
ON public.quadras(arena_id, status);

CREATE INDEX IF NOT EXISTS idx_arenas_status
ON public.arenas(status);