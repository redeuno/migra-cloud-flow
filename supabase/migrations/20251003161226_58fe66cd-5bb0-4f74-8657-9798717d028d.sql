-- FASE 1: Adicionar campos Asaas na tabela mensalidades
ALTER TABLE mensalidades 
ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT,
ADD COLUMN IF NOT EXISTS linha_digitavel TEXT,
ADD COLUMN IF NOT EXISTS qr_code_pix TEXT,
ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT,
ADD COLUMN IF NOT EXISTS historico_status JSONB DEFAULT '[]'::jsonb;

-- Adicionar índice para melhorar performance de busca por asaas_payment_id
CREATE INDEX IF NOT EXISTS idx_mensalidades_asaas_payment_id ON mensalidades(asaas_payment_id);

-- FASE 1: Adicionar campos na tabela contratos
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS modalidade tipo_esporte,
ADD COLUMN IF NOT EXISTS clausulas_especiais TEXT;

-- FASE 3: Criar tabela assinaturas_arena (Arena paga para Super Admin)
CREATE TABLE IF NOT EXISTS assinaturas_arena (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id UUID REFERENCES arenas(id) ON DELETE CASCADE NOT NULL,
  plano_sistema_id UUID REFERENCES planos_sistema(id),
  
  -- Dados da assinatura
  numero_assinatura VARCHAR(50) UNIQUE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dia_vencimento INTEGER NOT NULL DEFAULT 5,
  
  -- Valores
  valor_mensal DECIMAL(10,2) NOT NULL,
  status status_contrato NOT NULL DEFAULT 'ativo',
  
  -- Asaas (arena como cliente do Super Admin)
  asaas_subscription_id VARCHAR(100),
  asaas_customer_id VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assinaturas_arena ENABLE ROW LEVEL SECURITY;

-- Super admin pode ver e gerenciar tudo
CREATE POLICY "Super admin manage assinaturas"
ON assinaturas_arena
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Arena admins podem ver apenas sua própria assinatura
CREATE POLICY "Arena admins view own assinatura"
ON assinaturas_arena
FOR SELECT
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'arena_admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_assinaturas_arena_updated_at
BEFORE UPDATE ON assinaturas_arena
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- FASE 3: Criar tabela faturas_sistema (Arena paga para Super Admin)
CREATE TABLE IF NOT EXISTS faturas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_arena_id UUID REFERENCES assinaturas_arena(id) ON DELETE CASCADE NOT NULL,
  arena_id UUID REFERENCES arenas(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados da fatura
  numero_fatura VARCHAR(50) UNIQUE NOT NULL,
  competencia DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  
  status_pagamento status_pagamento NOT NULL DEFAULT 'pendente',
  
  -- Asaas
  asaas_payment_id VARCHAR(100),
  asaas_invoice_url TEXT,
  linha_digitavel TEXT,
  qr_code_pix TEXT,
  pix_copy_paste TEXT,
  
  data_pagamento TIMESTAMPTZ,
  forma_pagamento forma_pagamento,
  
  observacoes TEXT,
  historico_status JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faturas_sistema ENABLE ROW LEVEL SECURITY;

-- Super admin pode ver e gerenciar todas as faturas
CREATE POLICY "Super admin manage faturas_sistema"
ON faturas_sistema
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Arena admins podem ver apenas faturas de sua arena
CREATE POLICY "Arena admins view own faturas"
ON faturas_sistema
FOR SELECT
USING (
  arena_id IN (
    SELECT arena_id FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'arena_admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_faturas_sistema_updated_at
BEFORE UPDATE ON faturas_sistema
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar sequence para numero_fatura
CREATE SEQUENCE IF NOT EXISTS faturas_sistema_seq START 1;

-- Function para gerar numero_fatura automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_fatura()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_fatura IS NULL THEN
    NEW.numero_fatura := 'FAT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('faturas_sistema_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para gerar numero_fatura
CREATE TRIGGER gerar_numero_fatura_trigger
BEFORE INSERT ON faturas_sistema
FOR EACH ROW
EXECUTE FUNCTION gerar_numero_fatura();

-- Criar sequence para numero_assinatura
CREATE SEQUENCE IF NOT EXISTS assinaturas_arena_seq START 1;

-- Function para gerar numero_assinatura automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_assinatura()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_assinatura IS NULL THEN
    NEW.numero_assinatura := 'ASS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('assinaturas_arena_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para gerar numero_assinatura
CREATE TRIGGER gerar_numero_assinatura_trigger
BEFORE INSERT ON assinaturas_arena
FOR EACH ROW
EXECUTE FUNCTION gerar_numero_assinatura();

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_faturas_sistema_arena_id ON faturas_sistema(arena_id);
CREATE INDEX IF NOT EXISTS idx_faturas_sistema_assinatura_id ON faturas_sistema(assinatura_arena_id);
CREATE INDEX IF NOT EXISTS idx_faturas_sistema_status ON faturas_sistema(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_assinaturas_arena_id ON assinaturas_arena(arena_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_arena_status ON assinaturas_arena(status);