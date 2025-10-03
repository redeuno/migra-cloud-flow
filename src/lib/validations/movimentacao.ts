import { z } from "zod";

export const movimentacaoSchema = z.object({
  tipo: z.enum(["receita", "despesa"], {
    required_error: "Selecione o tipo de movimentação",
  }),
  categoria: z.enum([
    "agendamento",
    "aula",
    "equipamento",
    "evento",
    "manutencao",
    "mensalidade",
    "outros",
    "salario",
    "torneio",
  ], {
    required_error: "Selecione a categoria",
  }),
  descricao: z.string().min(1, "Descrição é obrigatória").max(500),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  data_movimentacao: z.string().min(1, "Data é obrigatória"),
  forma_pagamento: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto"]).optional(),
  usuario_id: z.string().uuid().optional(),
  observacoes: z.string().max(1000).optional(),
});

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;
