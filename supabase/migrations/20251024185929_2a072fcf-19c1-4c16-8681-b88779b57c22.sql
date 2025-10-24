-- Adicionar coluna para armazenar link direto do boleto
ALTER TABLE faturas_sistema 
ADD COLUMN IF NOT EXISTS asaas_bankslip_url text;

COMMENT ON COLUMN faturas_sistema.asaas_bankslip_url IS 'URL direta do boleto (PDF) gerado pelo Asaas';

-- Atualizar fatura de teste com link correto do boleto
UPDATE faturas_sistema
SET asaas_bankslip_url = 'https://sandbox.asaas.com/b/pdf/test-bankslip-url',
    asaas_invoice_url = 'https://sandbox.asaas.com/i/test-invoice-url'
WHERE numero_fatura LIKE 'FAT-TEST-%';