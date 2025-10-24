-- Criar fatura de teste para arena suspensa (desenvolvimento)
INSERT INTO faturas_sistema (
  assinatura_arena_id,
  arena_id,
  numero_fatura,
  competencia,
  data_vencimento,
  valor,
  status_pagamento,
  asaas_invoice_url,
  asaas_payment_id,
  observacoes
)
SELECT 
  aa.id,
  aa.arena_id,
  'FAT-TEST-' || to_char(NOW(), 'YYYYMM') || '-001',
  date_trunc('month', CURRENT_DATE)::date,
  CURRENT_DATE + INTERVAL '7 days',
  aa.valor_mensal,
  'pendente'::status_pagamento,
  'https://sandbox.asaas.com/i/test-invoice-url',
  'test_inv_' || substring(gen_random_uuid()::text, 1, 8),
  'Fatura de teste gerada automaticamente para desenvolvimento'
FROM assinaturas_arena aa
WHERE aa.arena_id = '53b6b586-7482-466f-8bf6-290f814d43d9'
  AND aa.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1 FROM faturas_sistema fs
    WHERE fs.arena_id = aa.arena_id
      AND fs.status_pagamento = 'pendente'
  )
LIMIT 1;