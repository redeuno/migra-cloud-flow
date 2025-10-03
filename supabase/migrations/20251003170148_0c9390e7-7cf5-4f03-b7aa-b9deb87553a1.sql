-- Tabela de configurações da arena (Evolution API, etc)
CREATE TABLE IF NOT EXISTS public.configuracoes_arena (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID NOT NULL UNIQUE REFERENCES public.arenas(id) ON DELETE CASCADE,
  
  -- Evolution API Config
  evolution_api_enabled BOOLEAN DEFAULT false,
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  evolution_instance_name TEXT,
  
  -- Configurações de notificações
  notificacoes_whatsapp_enabled BOOLEAN DEFAULT false,
  notificacoes_email_enabled BOOLEAN DEFAULT false,
  email_remetente TEXT,
  
  -- Mensagens template
  template_lembrete_pagamento TEXT DEFAULT 'Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}. Link para pagamento: {{link_pagamento}}',
  template_confirmacao_pagamento TEXT DEFAULT 'Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}. Obrigado!',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_arena ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Arena admins manage own config"
  ON public.configuracoes_arena
  FOR ALL
  USING (
    arena_id IN (
      SELECT arena_id FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'arena_admin')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_arena_updated_at
  BEFORE UPDATE ON public.configuracoes_arena
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();