import { z } from "zod";

export const quadraSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  numero: z.coerce.number().int().min(1, "Número deve ser maior que 0"),
  tipo_esporte: z.enum(["padel", "tenis", "beach_tennis", "futevolei"], {
    required_error: "Tipo de esporte é obrigatório",
  }),
  tipo_piso: z.enum(["sintetico", "concreto", "saibro", "grama", "areia"], {
    required_error: "Tipo de piso é obrigatório",
  }),
  valor_hora_normal: z.coerce.number().min(0, "Valor deve ser positivo"),
  valor_hora_pico: z.coerce.number().min(0, "Valor deve ser positivo"),
  cobertura: z.boolean().default(false),
  iluminacao: z.boolean().default(false),
  capacidade_jogadores: z.coerce.number().int().min(1, "Capacidade mínima é 1").default(4),
  status: z.enum(["ativa", "inativa", "manutencao"]).default("ativa"),
  observacoes: z.string().optional(),
});

export type QuadraFormData = z.infer<typeof quadraSchema>;
