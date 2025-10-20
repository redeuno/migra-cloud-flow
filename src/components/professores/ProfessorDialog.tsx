import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const professorSchema = z.object({
  // Dados Pessoais
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  telefone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().optional(),
  data_nascimento: z.string().refine((date) => new Date(date) < new Date(), {
    message: "Data de nascimento inválida",
  }),
  
  // Dados Profissionais
  valor_hora_aula: z.number().min(0, "Valor deve ser positivo"),
  percentual_comissao_padrao: z.number().min(0).max(100, "Percentual entre 0 e 100"),
  registro_profissional: z.string().optional(),
  biografia: z.string().optional(),
  especialidades: z.array(z.string()).optional(),
  
  status: z.enum(["ativo", "inativo", "suspenso"]),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

interface ProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professor?: any;
}

export function ProfessorDialog({ open, onOpenChange, professor }: ProfessorDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novaEspecialidade, setNovaEspecialidade] = useState("");

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      cpf: "",
      telefone: "",
      whatsapp: "",
      data_nascimento: "",
      valor_hora_aula: 100,
      percentual_comissao_padrao: 30,
      registro_profissional: "",
      biografia: "",
      especialidades: [],
      status: "ativo",
    },
  });

  useEffect(() => {
    if (professor) {
      form.reset({
        nome_completo: professor.usuarios?.nome_completo || "",
        email: professor.usuarios?.email || "",
        cpf: professor.usuarios?.cpf || "",
        telefone: professor.usuarios?.telefone || "",
        whatsapp: professor.usuarios?.whatsapp || "",
        data_nascimento: professor.usuarios?.data_nascimento || "",
        valor_hora_aula: professor.valor_hora_aula || 100,
        percentual_comissao_padrao: professor.percentual_comissao_padrao || 30,
        registro_profissional: professor.registro_profissional || "",
        biografia: professor.biografia || "",
        especialidades: Array.isArray(professor.especialidades) ? professor.especialidades : [],
        status: professor.status || "ativo",
      });
    } else {
      form.reset({
        nome_completo: "",
        email: "",
        cpf: "",
        telefone: "",
        whatsapp: "",
        data_nascimento: "",
        valor_hora_aula: 100,
        percentual_comissao_padrao: 30,
        registro_profissional: "",
        biografia: "",
        especialidades: [],
        status: "ativo",
      });
    }
  }, [professor, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      // 1. Criar usuário
      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .insert({
          arena_id: arenaId,
          nome_completo: data.nome_completo,
          email: data.email,
          cpf: data.cpf,
          telefone: data.telefone,
          whatsapp: data.whatsapp || null,
          data_nascimento: data.data_nascimento,
          tipo_usuario: "professor",
          status: data.status,
          aceite_termos: true,
          data_cadastro: new Date().toISOString().split("T")[0],
          auth_id: null, // Será preenchido via trigger ou manualmente depois
        } as any)
        .select()
        .single();

      if (usuarioError) throw usuarioError;

      // 2. Aguardar trigger criar professor automaticamente, então atualizar dados profissionais
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: professorError } = await supabase
        .from("professores")
        .update({
          valor_hora_aula: data.valor_hora_aula,
          percentual_comissao_padrao: data.percentual_comissao_padrao,
          registro_profissional: data.registro_profissional || null,
          biografia: data.biografia || null,
          especialidades: data.especialidades || [],
        })
        .eq("usuario_id", usuario.id);

      if (professorError) throw professorError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor cadastrado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar professor");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfessorFormData) => {
      // 1. Atualizar usuário
      const { error: usuarioError } = await supabase
        .from("usuarios")
        .update({
          nome_completo: data.nome_completo,
          email: data.email,
          cpf: data.cpf,
          telefone: data.telefone,
          whatsapp: data.whatsapp || null,
          data_nascimento: data.data_nascimento,
          status: data.status,
        })
        .eq("id", professor.usuario_id);

      if (usuarioError) throw usuarioError;

      // 2. Atualizar professor
      const { error: professorError } = await supabase
        .from("professores")
        .update({
          valor_hora_aula: data.valor_hora_aula,
          percentual_comissao_padrao: data.percentual_comissao_padrao,
          registro_profissional: data.registro_profissional || null,
          biografia: data.biografia || null,
          especialidades: data.especialidades || [],
          status: data.status,
        })
        .eq("id", professor.id);

      if (professorError) throw professorError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores"] });
      toast.success("Professor atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar professor");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: ProfessorFormData) => {
    setIsSubmitting(true);
    if (professor) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const adicionarEspecialidade = () => {
    if (novaEspecialidade.trim()) {
      const atual = form.getValues("especialidades") || [];
      form.setValue("especialidades", [...atual, novaEspecialidade.trim()]);
      setNovaEspecialidade("");
    }
  };

  const removerEspecialidade = (index: number) => {
    const atual = form.getValues("especialidades") || [];
    form.setValue(
      "especialidades",
      atual.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {professor ? "Editar Professor" : "Novo Professor"}
          </DialogTitle>
          <DialogDescription>
            {professor
              ? "Atualize as informações do professor"
              : "Preencha os dados para cadastrar um novo professor"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pessoal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissional">Dados Profissionais</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="pessoal" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome_completo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678900" maxLength={11} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="11999999999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="11999999999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="suspenso">Suspenso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="profissional" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="valor_hora_aula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Hora/Aula *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor cobrado por hora de aula
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="percentual_comissao_padrao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Comissão Padrão *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de comissão sobre aulas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registro_profissional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registro Profissional</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: CREF 123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="biografia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descrição profissional..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="especialidades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidades</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ex: Beach Tennis Iniciante"
                            value={novaEspecialidade}
                            onChange={(e) => setNovaEspecialidade(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                adicionarEspecialidade();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={adicionarEspecialidade}
                            variant="outline"
                          >
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(field.value || []).map((esp, idx) => (
                            <Badge key={idx} variant="secondary">
                              {esp}
                              <button
                                type="button"
                                onClick={() => removerEspecialidade(idx)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..."
                    : professor
                    ? "Atualizar"
                    : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
