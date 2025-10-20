-- Corrigir estrutura da tabela templates_notificacao para garantir compatibilidade com o código

-- Verificar se colunas existem e criar/renomear conforme necessário
DO $$ 
BEGIN
  -- Adicionar coluna 'nome' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'nome') THEN
    ALTER TABLE templates_notificacao ADD COLUMN nome VARCHAR(255);
  END IF;

  -- Adicionar coluna 'tipo' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'tipo') THEN
    ALTER TABLE templates_notificacao ADD COLUMN tipo VARCHAR(50);
  END IF;

  -- Adicionar coluna 'categoria' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'categoria') THEN
    ALTER TABLE templates_notificacao ADD COLUMN categoria VARCHAR(100);
  END IF;

  -- Adicionar coluna 'mensagem' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'mensagem') THEN
    ALTER TABLE templates_notificacao ADD COLUMN mensagem TEXT;
  END IF;

  -- Adicionar coluna 'assunto' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'assunto') THEN
    ALTER TABLE templates_notificacao ADD COLUMN assunto VARCHAR(255);
  END IF;

  -- Adicionar coluna 'ativo' se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'templates_notificacao' 
                 AND column_name = 'ativo') THEN
    ALTER TABLE templates_notificacao ADD COLUMN ativo BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Garantir que colunas essenciais não sejam NULL
ALTER TABLE templates_notificacao 
  ALTER COLUMN nome SET NOT NULL,
  ALTER COLUMN tipo SET NOT NULL,
  ALTER COLUMN mensagem SET NOT NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_templates_categoria_tipo 
  ON templates_notificacao(categoria, tipo) 
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_templates_ativo 
  ON templates_notificacao(ativo);

-- Inserir templates padrão se não existirem
INSERT INTO templates_notificacao (nome, tipo, categoria, assunto, mensagem, ativo)
VALUES 
  (
    'Confirmação de Inscrição em Aula',
    'whatsapp',
    'aula_confirmada',
    'Inscrição Confirmada',
    'Olá {{nome}}! Sua inscrição na aula "{{titulo_aula}}" foi confirmada. Data: {{data}}, Horário: {{horario}}. Professor: {{professor}}. Nos vemos lá!',
    true
  ),
  (
    'Lembrete de Aula',
    'whatsapp',
    'lembrete_aula',
    'Lembrete de Aula',
    'Olá {{nome}}! Lembrete: Você tem aula "{{titulo_aula}}" hoje às {{horario}} com o professor {{professor}}. Local: {{quadra}}.',
    true
  ),
  (
    'Aula Cancelada',
    'whatsapp',
    'aula_cancelada',
    'Aula Cancelada',
    'Olá {{nome}}. Informamos que a aula "{{titulo_aula}}" do dia {{data}} às {{horario}} foi cancelada. Motivo: {{motivo}}. Entre em contato para reagendar.',
    true
  )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE templates_notificacao IS 'Templates de notificações para WhatsApp, Email e SMS - Estrutura compatível com templateService.ts';