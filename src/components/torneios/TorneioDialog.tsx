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
  modalidade: z.enum(["beach_tennis", "futevolei", "volei"]),
  tipo_chaveamento: z.enum(["eliminatoria_simples", "grupos_eliminatorias"]),
  data_inicio: z.string(),
  data_fim: z.string(),
  data_inicio_inscricoes: z.string(),
  data_fim_inscricoes: z.string(),
  max_participantes: z.number().min(4),
  valor_inscricao: z.number().min(0),
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
      tipo_chaveamento: "eliminatoria_simples",
      max_participantes: 16,
      valor_inscricao: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TorneioFormData) => {
      const { error } = await supabase.from("torneios").insert([{
        arena_id: arenaId!,
        ...data,
        status: "planejamento",
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
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="volei">Vôlei</SelectItem>
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
                        <SelectItem value="eliminatoria_simples">Eliminatória Simples</SelectItem>
                        <SelectItem value="grupos_eliminatorias">Grupos + Eliminatórias</SelectItem>
                      </SelectContent>
                    </Select>
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
