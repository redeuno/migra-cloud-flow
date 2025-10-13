import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const torneioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  modalidade: z.enum(["beach_tennis", "futevolei", "padel", "tenis"]),
  tipo_chaveamento: z.enum(["eliminacao_simples", "eliminacao_dupla", "round_robin", "suico"]),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  data_inicio_inscricoes: z.string().min(1, "Data de início das inscrições é obrigatória"),
  data_fim_inscricoes: z.string().min(1, "Data de fim das inscrições é obrigatória"),
  max_participantes: z.number().min(4, "Mínimo de 4 participantes"),
  valor_inscricao: z.number().min(0, "Valor não pode ser negativo"),
});

type TorneioFormData = z.infer<typeof torneioSchema>;

interface TorneioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  torneioId?: string;
}

export function TorneioDialog({ open, onOpenChange, torneioId }: TorneioDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<TorneioFormData>({
    resolver: zodResolver(torneioSchema),
    defaultValues: {
      modalidade: "beach_tennis",
      tipo_chaveamento: "eliminacao_simples",
      max_participantes: 16,
      valor_inscricao: 0,
      data_inicio: "",
      data_fim: "",
      data_inicio_inscricoes: "",
      data_fim_inscricoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TorneioFormData) => {
      const { error } = await supabase.from("torneios").insert([{
        arena_id: arenaId!,
        nome: data.nome,
        descricao: data.descricao,
        modalidade: data.modalidade,
        tipo_chaveamento: data.tipo_chaveamento,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        data_inicio_inscricoes: data.data_inicio_inscricoes,
        data_fim_inscricoes: data.data_fim_inscricoes,
        max_participantes: data.max_participantes,
        valor_inscricao: data.valor_inscricao,
        status: "planejamento" as const,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torneios"] });
      toast({ title: "Torneio criado com sucesso!" });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: TorneioFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Torneio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
                        <SelectItem value="futevolei">Futevôlei</SelectItem>
                        <SelectItem value="padel">Padel</SelectItem>
                        <SelectItem value="tenis">Tênis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_chaveamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chaveamento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eliminacao_simples">Eliminação Simples</SelectItem>
                        <SelectItem value="eliminacao_dupla">Eliminação Dupla</SelectItem>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="suico">Sistema Suíço</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio_inscricoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início das Inscrições *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim_inscricoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim das Inscrições *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_participantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Participantes *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_inscricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Inscrição *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Criar Torneio</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
