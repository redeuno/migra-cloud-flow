-- FASE 2: Criar tabela de Categorias Financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  tipo tipo_movimentacao NOT NULL,
  cor VARCHAR(7),
  icone VARCHAR,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Popular categorias padrão
INSERT INTO categorias_financeiras (nome, tipo, cor, icone, ordem) VALUES
  ('Mensalidades', 'receita', '#10b981', 'DollarSign', 1),
  ('Agendamentos', 'receita', '#3b82f6', 'Calendar', 2),
  ('Aulas', 'receita', '#8b5cf6', 'GraduationCap', 3),
  ('Torneios', 'receita', '#f59e0b', 'Trophy', 4),
  ('Salários', 'despesa', '#ef4444', 'Users', 5),
  ('Manutenção', 'despesa', '#f97316', 'Wrench', 6),
  ('Contas', 'despesa', '#64748b', 'FileText', 7);

-- RLS policies para categorias_financeiras
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage categorias"
  ON categorias_financeiras
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users view categorias"
  ON categorias_financeiras
  FOR SELECT
  USING (ativo = true);

-- Trigger para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FASE 3: Criar tabela de Templates de Notificação
CREATE TABLE IF NOT EXISTS templates_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  tipo VARCHAR NOT NULL, -- 'whatsapp', 'email', 'sms'
  assunto VARCHAR,
  mensagem TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]',
  categoria VARCHAR, -- 'cobranca', 'confirmacao', 'lembrete'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Popular templates padrão
INSERT INTO templates_notificacao (nome, tipo, categoria, mensagem, variaveis) VALUES
  (
    'Lembrete de Pagamento',
    'whatsapp',
    'cobranca',
    'Olá {{nome}}! Sua mensalidade de {{valor}} vence em {{data_vencimento}}. Link: {{link_pagamento}}',
    '["nome", "valor", "data_vencimento", "link_pagamento"]'::jsonb
  ),
  (
    'Confirmação de Pagamento',
    'whatsapp',
    'confirmacao',
    'Obrigado {{nome}}! Confirmamos o recebimento de {{valor}}. Seu acesso está liberado.',
    '["nome", "valor"]'::jsonb
  ),
  (
    'Lembrete de Aula',
    'whatsapp',
    'lembrete',
    'Oi {{nome}}! Sua aula com {{professor}} é hoje às {{horario}}. Quadra {{quadra}}.',
    '["nome", "professor", "horario", "quadra"]'::jsonb
  );

-- RLS policies para templates_notificacao
ALTER TABLE templates_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage templates"
  ON templates_notificacao
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Arena admins view templates"
  ON templates_notificacao
  FOR SELECT
  USING (ativo = true);

-- Trigger para updated_at
CREATE TRIGGER update_templates_notificacao_updated_at
  BEFORE UPDATE ON templates_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();