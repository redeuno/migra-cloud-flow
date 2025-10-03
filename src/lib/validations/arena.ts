import { z } from "zod";

export const arenaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  razao_social: z.string().min(1, "Razão social é obrigatória").max(200),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido (use XX.XXX.XXX/XXXX-XX)"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  
  // Endereço
  endereco_completo: z.object({
    cep: z.string().min(8, "CEP inválido"),
    logradouro: z.string().min(1, "Logradouro é obrigatório"),
    numero: z.string().min(1, "Número é obrigatório"),
    complemento: z.string().optional(),
    bairro: z.string().min(1, "Bairro é obrigatório"),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    uf: z.string().length(2, "UF deve ter 2 caracteres"),
  }),

  // Configurações
  horario_funcionamento: z.object({
    segunda: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    terca: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    quarta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    quinta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    sexta: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    sabado: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
    domingo: z.object({ inicio: z.string(), fim: z.string(), ativo: z.boolean() }),
  }),

  plano_sistema_id: z.string().uuid("Selecione um plano válido").optional(),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z.enum(["ativo", "inativo", "suspenso"]).default("ativo"),
  
  cores_tema: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor primária inválida"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor secundária inválida"),
  }).optional(),
});

export type ArenaFormData = z.infer<typeof arenaSchema>;
