import { z } from "zod";

export const clienteSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  telefone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().optional(),
  data_nascimento: z.string().refine((date) => {
    const d = new Date(date);
    return d < new Date();
  }, "Data de nascimento inválida"),
  tipo_usuario: z.enum(["aluno", "professor", "funcionario", "arena_admin"]),
  status: z.enum(["ativo", "inativo", "bloqueado", "suspenso"]),
  aceite_termos: z.boolean().default(false),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
