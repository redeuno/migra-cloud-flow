import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

const aulaSchema = z.object({
  professor_id: z.string().min(1, "Selecione um professor"),
  quadra_id: z.string().optional().nullable(),
  tipo_aula: z.enum(["individual", "grupo", "clinica", "curso"]),
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  data_aula: z.date(),
  hora_inicio: z.string().min(1, "Hora de início é obrigatória"),
  hora_fim: z.string().min(1, "Hora de fim é obrigatória"),
  duracao_minutos: z.number().min(30).max(240),
  min_alunos: z.number().min(1).max(20),
  max_alunos: z.number().min(1).max(20),
  valor_por_aluno: z.number().min(0),
  nivel: z.string().optional(),
  objetivos: z.string().optional(),
  material_necessario: z.string().optional(),
});

type AulaFormData = z.infer<typeof aulaSchema>;

interface AulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulaId?: string;
}

export function AulaDialog({ open, onOpenChange, aulaId }: AulaDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AulaFormData>({
    resolver: zodResolver(aulaSchema),
    defaultValues: {
      tipo_aula: "grupo",
      min_alunos: 1,
      max_alunos: 8,
      duracao_minutos: 60,
      valor_por_aluno: 50,
    },
  });

  // Buscar professores
  const { data: professores } = useQuery({
    queryKey: ["professores", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professores")
        .select("*, usuarios(nome_completo)")
        .eq("arena_id", arenaId)
        .eq("status", "ativo");
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  // Buscar quadras
  const { data: quadras } = useQuery({
    queryKey: ["quadras-ativas", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .eq("arena_id", arenaId)
        .eq("status", "ativa");
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  // Buscar aula existente
  const { data: aula } = useQuery({
    queryKey: ["aula", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .eq("id", aulaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!aulaId && open,
  });

  // Preencher form com dados existentes
  useEffect(() => {
    if (aula) {
      form.reset({
        professor_id: aula.professor_id,
        quadra_id: aula.quadra_id || "none",
        tipo_aula: aula.tipo_aula,
        titulo: aula.titulo,
        descricao: aula.descricao || "",
        data_aula: new Date(aula.data_aula),
        hora_inicio: aula.hora_inicio,
        hora_fim: aula.hora_fim,
        duracao_minutos: aula.duracao_minutos,
        min_alunos: aula.min_alunos || 1,
        max_alunos: aula.max_alunos,
        valor_por_aluno: Number(aula.valor_por_aluno),
        nivel: aula.nivel || "",
        objetivos: aula.objetivos || "",
        material_necessario: aula.material_necessario || "",
      });
    }
  }, [aula, form]);

  const createMutation = useMutation({
    mutationFn: async (data: AulaFormData) => {
      const { error } = await supabase.from("aulas").insert([{
        arena_id: arenaId!,
        professor_id: data.professor_id,
        quadra_id: data.quadra_id === "none" ? null : data.quadra_id || null,
        tipo_aula: data.tipo_aula,
        titulo: data.titulo,
        descricao: data.descricao,
        data_aula: format(data.data_aula, "yyyy-MM-dd"),
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        duracao_minutos: data.duracao_minutos,
        min_alunos: data.min_alunos,
        max_alunos: data.max_alunos,
        valor_por_aluno: data.valor_por_aluno,
        nivel: data.nivel,
        objetivos: data.objetivos,
        material_necessario: data.material_necessario,
        status: "agendada",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast({ title: "Aula criada com sucesso!" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar aula", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AulaFormData) => {
      const { error } = await supabase
        .from("aulas")
        .update({
          professor_id: data.professor_id,
          quadra_id: data.quadra_id === "none" ? null : data.quadra_id || null,
          tipo_aula: data.tipo_aula,
          titulo: data.titulo,
          descricao: data.descricao,
          data_aula: format(data.data_aula, "yyyy-MM-dd"),
          hora_inicio: data.hora_inicio,
          hora_fim: data.hora_fim,
          duracao_minutos: data.duracao_minutos,
          min_alunos: data.min_alunos,
          max_alunos: data.max_alunos,
          valor_por_aluno: data.valor_por_aluno,
          nivel: data.nivel,
          objetivos: data.objetivos,
          material_necessario: data.material_necessario,
        })
        .eq("id", aulaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast({ title: "Aula atualizada com sucesso!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar aula", variant: "destructive" });
    },
  });

  const onSubmit = async (data: AulaFormData) => {
    setIsSubmitting(true);
    if (aulaId) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{aulaId ? "Editar Aula" : "Nova Aula"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="professor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professor *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um professor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {professores?.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.usuarios?.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quadra_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadra (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma quadra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-background">
                        <SelectItem value="none">Sem quadra específica</SelectItem>
                        {quadras?.map((quadra) => (
                          <SelectItem key={quadra.id} value={quadra.id}>
                            Quadra {quadra.numero} - {quadra.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aula de Beach Tennis - Iniciante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_aula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Aula *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="grupo">Grupo</SelectItem>
                      <SelectItem value="clinica">Clínica</SelectItem>
                      <SelectItem value="curso">Curso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="data_aula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="duracao_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_alunos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mín Alunos *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_alunos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx Alunos *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_por_aluno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descrição da aula..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {aulaId ? "Atualizar" : "Criar"} Aula
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
