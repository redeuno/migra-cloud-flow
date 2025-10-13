import { z } from "zod";

export const contratoSchema = z.object({
  usuario_id: z.string().uuid({ message: "Selecione um usuário válido" }),
  tipo_contrato: z.enum(["mensal", "trimestral", "semestral", "anual"], {
    required_error: "Selecione o tipo de contrato",
  }),
  valor_mensal: z.coerce
    .number()
    .min(0, "Valor deve ser maior ou igual a zero"),
  dia_vencimento: z.coerce
    .number()
    .min(1, "Dia deve ser entre 1 e 28")
    .max(28, "Dia deve ser entre 1 e 28"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  valor_taxa_adesao: z.coerce.number().min(0).optional(),
  desconto_percentual: z.coerce.number().min(0).max(100).optional(),
  beneficios: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (!data.data_fim) return true;
    return new Date(data.data_fim) > new Date(data.data_inicio);
  },
  {
    message: "Data de término deve ser posterior à data de início",
    path: ["data_fim"],
  }
).refine(
  (data) => data.valor_mensal > 0,
  {
    message: "Valor mensal deve ser maior que zero",
    path: ["valor_mensal"],
  }
);

export type ContratoFormData = z.infer<typeof contratoSchema>;
