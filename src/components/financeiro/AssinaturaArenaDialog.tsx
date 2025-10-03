import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const assinaturaArenaSchema = z.object({
  arena_id: z.string().uuid(),
  plano_sistema_id: z.string().uuid().optional(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().optional(),
  dia_vencimento: z.coerce.number().min(1).max(28),
  valor_mensal: z.coerce.number().min(0),
  status: z.enum(["ativo", "suspenso", "cancelado"]),
});

type AssinaturaArenaFormData = z.infer<typeof assinaturaArenaSchema>;

interface AssinaturaArenaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assinatura?: any;
}

export function AssinaturaArenaDialog({ open, onOpenChange, assinatura }: AssinaturaArenaDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssinaturaArenaFormData>({
    resolver: zodResolver(assinaturaArenaSchema),
    defaultValues: assinatura
      ? {
          arena_id: assinatura.arena_id,
          plano_sistema_id: assinatura.plano_sistema_id || "",
          data_inicio: assinatura.data_inicio,
          data_fim: assinatura.data_fim || "",
          dia_vencimento: assinatura.dia_vencimento,
          valor_mensal: assinatura.valor_mensal,
          status: assinatura.status,
        }
      : {
          dia_vencimento: 5,
          valor_mensal: 0,
          status: "ativo",
        },
  });

  // Buscar arenas
  const { data: arenas } = useQuery({
    queryKey: ["arenas-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arenas")
        .select("id, nome, email")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar planos
  const { data: planos } = useQuery({
    queryKey: ["planos-sistema"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_sistema")
        .select("id, nome, valor_mensal")
        .eq("status", "ativo")
        .order("valor_mensal");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: AssinaturaArenaFormData) => {
      const payload: any = {
        arena_id: data.arena_id,
        plano_sistema_id: data.plano_sistema_id || null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        dia_vencimento: data.dia_vencimento,
        valor_mensal: data.valor_mensal,
        status: data.status as "ativo" | "suspenso" | "cancelado",
      };

      if (assinatura) {
        const { error } = await supabase
          .from("assinaturas_arena")
          .update(payload)
          .eq("id", assinatura.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assinaturas_arena").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assinaturas-arena"] });
      toast.success(assinatura ? "Assinatura atualizada!" : "Assinatura criada!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar assinatura");
    },
  });

  const onSubmit = async (data: AssinaturaArenaFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assinatura ? "Editar" : "Nova"} Assinatura Arena</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="arena_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arena *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!assinatura}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a arena" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {arenas?.map((arena) => (
                        <SelectItem key={arena.id} value={arena.id}>
                          {arena.nome}
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
              name="plano_sistema_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano Sistema</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planos?.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome} - R$ {Number(plano.valor_mensal).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_mensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dia_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Vencimento *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início *</FormLabel>
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
                    <FormLabel>Data Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {assinatura ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
