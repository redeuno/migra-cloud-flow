import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mensalidadeSchema, type MensalidadeFormData } from "@/lib/validations/mensalidade";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface MensalidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mensalidade?: any;
}

export function MensalidadeDialog({ open, onOpenChange, mensalidade }: MensalidadeDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<MensalidadeFormData>({
    resolver: zodResolver(mensalidadeSchema),
    defaultValues: mensalidade
      ? {
          contrato_id: mensalidade.contrato_id,
          referencia: mensalidade.referencia,
          data_vencimento: mensalidade.data_vencimento,
          valor: mensalidade.valor,
          desconto: mensalidade.desconto || 0,
          acrescimo: mensalidade.acrescimo || 0,
          observacoes: mensalidade.observacoes || "",
        }
      : {
          valor: 0,
          desconto: 0,
          acrescimo: 0,
        },
  });

  const { data: contratos } = useQuery({
    queryKey: ["contratos-ativos", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero_contrato, usuarios!contratos_usuario_id_fkey(nome_completo)")
        .eq("status", "ativo")
        .order("numero_contrato");

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId && !mensalidade,
  });

  const mutation = useMutation({
    mutationFn: async (values: MensalidadeFormData) => {
      const valorFinal = values.valor - (values.desconto || 0) + (values.acrescimo || 0);
      
      if (mensalidade) {
        const { error } = await supabase
          .from("mensalidades")
          .update(values)
          .eq("id", mensalidade.id);

        if (error) throw error;
      } else {
        const insertData = {
          contrato_id: values.contrato_id!,
          referencia: values.referencia,
          data_vencimento: values.data_vencimento,
          valor: values.valor,
          desconto: values.desconto || 0,
          acrescimo: values.acrescimo || 0,
          valor_final: valorFinal,
          observacoes: values.observacoes,
        };
        
        const { error } = await supabase.from("mensalidades").insert([insertData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensalidades"] });
      toast({
        title: "Sucesso",
        description: mensalidade
          ? "Mensalidade atualizada com sucesso"
          : "Mensalidade criada com sucesso",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: MensalidadeFormData) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mensalidade ? "Editar Mensalidade" : "Nova Mensalidade"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!mensalidade && (
              <FormField
                control={form.control}
                name="contrato_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o contrato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contratos?.map((contrato) => (
                          <SelectItem key={contrato.id} value={contrato.id}>
                            {contrato.numero_contrato} - {contrato.usuarios?.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Referência</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Base</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acrescimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acréscimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
