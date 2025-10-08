-- =========================================
-- MIGRATION: Popular Dados de Exemplo
-- Criar planos, assinatura e fatura para teste
-- =========================================

-- 1. Inserir planos do sistema (se não existirem)
INSERT INTO planos_sistema (nome, descricao, valor_mensal, max_quadras, max_usuarios, modulos_inclusos, status)
VALUES 
  ('Plano Básico', 'Plano básico para pequenas arenas', 99.00, 5, 50, '["agendamentos", "quadras"]', 'ativo'),
  ('Plano Profissional', 'Plano completo para arenas médias', 199.00, 15, 150, '["agendamentos", "quadras", "financeiro", "aulas"]', 'ativo'),
  ('Plano Enterprise', 'Plano completo para grandes arenas', 299.00, 30, 500, '["agendamentos", "quadras", "financeiro", "aulas", "torneios"]', 'ativo')
ON CONFLICT DO NOTHING;

-- 2. Criar assinatura para Arena Verana Demo (se não existir)
INSERT INTO assinaturas_arena (
  arena_id,
  plano_sistema_id,
  numero_assinatura,
  valor_mensal,
  dia_vencimento,
  data_inicio,
  status
)
SELECT 
  '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid,
  p.id,
  'ASS-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  199.00,
  5,
  CURRENT_DATE - INTERVAL '3 months',
  'ativo'
FROM planos_sistema p
WHERE p.nome = 'Plano Profissional'
  AND NOT EXISTS (
    SELECT 1 FROM assinaturas_arena 
    WHERE arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
  )
LIMIT 1;

-- 3. Gerar fatura do sistema para o mês atual (se não existir)
INSERT INTO faturas_sistema (
  assinatura_arena_id,
  arena_id,
  numero_fatura,
  competencia,
  data_vencimento,
  valor,
  status_pagamento
)
SELECT 
  a.id,
  a.arena_id,
  'FAT-SYS-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
  DATE_TRUNC('month', CURRENT_DATE),
  MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT, a.dia_vencimento),
  a.valor_mensal,
  'pendente'
FROM assinaturas_arena a
WHERE a.arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
  AND a.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 FROM faturas_sistema f
    WHERE f.assinatura_arena_id = a.id
      AND f.competencia = DATE_TRUNC('month', CURRENT_DATE)
  )
LIMIT 1;

-- 4. Gerar fatura do mês anterior (paga) para ter histórico
INSERT INTO faturas_sistema (
  assinatura_arena_id,
  arena_id,
  numero_fatura,
  competencia,
  data_vencimento,
  valor,
  status_pagamento,
  data_pagamento,
  forma_pagamento
)
SELECT 
  a.id,
  a.arena_id,
  'FAT-SYS-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
  DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
  MAKE_DATE(
    EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::INT, 
    EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::INT, 
    a.dia_vencimento
  ),
  a.valor_mensal,
  'pago',
  MAKE_DATE(
    EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'))::INT, 
    EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))::INT, 
    a.dia_vencimento - 2
  ),
  'pix'
FROM assinaturas_arena a
WHERE a.arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'::uuid
  AND a.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 FROM faturas_sistema f
    WHERE f.assinatura_arena_id = a.id
      AND f.competencia = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  )
LIMIT 1;