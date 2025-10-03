-- Inserir configuração padrão para Arena Demo (apenas se não existir)
INSERT INTO configuracoes_arena (
  arena_id,
  evolution_api_enabled,
  evolution_api_url,
  evolution_api_key,
  evolution_instance_name,
  notificacoes_whatsapp_enabled,
  notificacoes_email_enabled,
  email_remetente,
  template_lembrete_pagamento,
  template_confirmacao_pagamento
)
SELECT 
  a.id,
  false,
  '',
  '',
  '',
  false,
  false,
  'contato@arenaverana.com.br',
  'Olá {{nome}}, seu pagamento de {{valor}} vence em {{data_vencimento}}. Link para pagamento: {{link_pagamento}}',
  'Olá {{nome}}, confirmamos o recebimento do seu pagamento de {{valor}}. Obrigado!'
FROM arenas a
WHERE a.nome = 'Arena Verana Demo'
  AND NOT EXISTS (
    SELECT 1 FROM configuracoes_arena ca WHERE ca.arena_id = a.id
  );

-- Inserir cliente de teste (apenas se não existir)
INSERT INTO usuarios (
  nome_completo,
  email,
  cpf,
  telefone,
  whatsapp,
  data_nascimento,
  tipo_usuario,
  status,
  aceite_termos,
  arena_id
)
SELECT
  'João da Silva',
  'joao.teste@example.com',
  '12345678901',
  '11987654321',
  '11987654321',
  '1990-05-15',
  'aluno',
  'ativo',
  true,
  a.id
FROM arenas a
WHERE a.nome = 'Arena Verana Demo'
  AND NOT EXISTS (
    SELECT 1 FROM usuarios u WHERE u.cpf = '12345678901'
  );

-- Inserir contrato ativo para o cliente de teste
INSERT INTO contratos (
  usuario_id,
  arena_id,
  tipo_contrato,
  valor_mensal,
  data_inicio,
  dia_vencimento,
  status,
  modalidade,
  descricao
)
SELECT
  u.id,
  u.arena_id,
  'mensal',
  150.00,
  CURRENT_DATE - INTERVAL '2 months',
  10,
  'ativo',
  'padel',
  'Plano Mensal - 8 horas mensais de quadra'
FROM usuarios u
WHERE u.email = 'joao.teste@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM contratos c WHERE c.usuario_id = u.id
  );

-- Inserir mensalidade pendente (vencimento próximo)
INSERT INTO mensalidades (
  contrato_id,
  referencia,
  data_vencimento,
  valor,
  valor_final,
  status_pagamento
)
SELECT
  c.id,
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days',
  150.00,
  150.00,
  'pendente'
FROM contratos c
JOIN usuarios u ON c.usuario_id = u.id
WHERE u.email = 'joao.teste@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM mensalidades m 
    WHERE m.contrato_id = c.id 
      AND m.referencia = DATE_TRUNC('month', CURRENT_DATE)
  );

-- Inserir mensalidade paga (mês anterior)
INSERT INTO mensalidades (
  contrato_id,
  referencia,
  data_vencimento,
  valor,
  valor_final,
  status_pagamento,
  forma_pagamento,
  data_pagamento
)
SELECT
  c.id,
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '10 days',
  150.00,
  150.00,
  'pago',
  'pix',
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '8 days'
FROM contratos c
JOIN usuarios u ON c.usuario_id = u.id
WHERE u.email = 'joao.teste@example.com'
  AND NOT EXISTS (
    SELECT 1 FROM mensalidades m 
    WHERE m.contrato_id = c.id 
      AND m.referencia = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  );