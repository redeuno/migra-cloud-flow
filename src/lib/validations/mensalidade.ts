import { z } from "zod";

export const mensalidadeSchema = z.object({
  contrato_id: z.string().uuid({ message: "Selecione um contrato válido" }),
  referencia: z.string().min(1, "Mês de referência é obrigatório"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  valor: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
  desconto: z.coerce.number().min(0).optional(),
  acrescimo: z.coerce.number().min(0).optional(),
  observacoes: z.string().optional(),
});

export const mensalidadePagamentoSchema = z.object({
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto"], {
    required_error: "Selecione a forma de pagamento",
  }),
  data_pagamento: z.string().min(1, "Data de pagamento é obrigatória"),
});

export type MensalidadeFormData = z.infer<typeof mensalidadeSchema>;
export type MensalidadePagamentoData = z.infer<typeof mensalidadePagamentoSchema>;
