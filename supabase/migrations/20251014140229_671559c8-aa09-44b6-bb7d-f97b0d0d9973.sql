-- Garantir que notificacoes está configurada para realtime
ALTER TABLE public.notificacoes REPLICA IDENTITY FULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida 
ON public.notificacoes(usuario_id, lida, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notificacoes_arena 
ON public.notificacoes(arena_id, created_at DESC) 
WHERE arena_id IS NOT NULL;