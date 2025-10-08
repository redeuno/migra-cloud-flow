import { z } from "zod";

export const agendamentoFormSchema = z.object({
  quadra_id: z.string().uuid("Selecione uma quadra válida"),
  cliente_id: z.string().uuid("Selecione um cliente válido").optional(),
  data_agendamento: z.date({
    required_error: "Data do agendamento é obrigatória",
  }),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  hora_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  modalidade: z.enum(["beach_tennis", "padel", "tenis"], {
    required_error: "Selecione uma modalidade",
  }),
  tipo_agendamento: z.enum(["avulso", "mensalista"], {
    required_error: "Selecione o tipo de agendamento",
  }),
  valor_total: z.number().min(0, "Valor deve ser maior ou igual a zero"),
  max_participantes: z.number().int().min(1).max(10).default(4),
  observacoes: z.string().optional(),
}).refine(
  (data) => {
    const inicio = data.hora_inicio.split(":").map(Number);
    const fim = data.hora_fim.split(":").map(Number);
    const minutosInicio = inicio[0] * 60 + inicio[1];
    const minutosFim = fim[0] * 60 + fim[1];
    return minutosFim > minutosInicio;
  },
  {
    message: "Horário de término deve ser posterior ao de início",
    path: ["hora_fim"],
  }
);

export type AgendamentoFormData = z.infer<typeof agendamentoFormSchema>;
