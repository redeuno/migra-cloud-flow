-- FASE 1.1: Limpeza de dados mockados
-- Remove mensalidades "pagas" que foram inseridas manualmente sem integração Asaas

-- Deletar mensalidades mockadas (status pago mas sem asaas_customer_id)
DELETE FROM mensalidades 
WHERE status_pagamento = 'pago' 
  AND asaas_customer_id IS NULL;

-- Adicionar constraint para prevenir dados mockados no futuro
-- Mensalidades pagas DEVEM ter asaas_payment_id
ALTER TABLE mensalidades 
ADD CONSTRAINT mensalidades_pagamento_valido 
CHECK (
  (status_pagamento = 'pago' AND asaas_payment_id IS NOT NULL) 
  OR status_pagamento != 'pago'
);

-- Comentário: Agora todas mensalidades marcadas como "pago" DEVEM ter asaas_payment_id
COMMENT ON CONSTRAINT mensalidades_pagamento_valido ON mensalidades IS 
'Garante que mensalidades pagas sempre têm asaas_payment_id válido';