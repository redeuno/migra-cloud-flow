import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { contratoSchema, type ContratoFormData } from "@/lib/validations/contrato";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: any;
  preSelectedUsuarioId?: string;
}

export function ContratoDialog({ open, onOpenChange, contrato, preSelectedUsuarioId }: ContratoDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: contrato
      ? {
          usuario_id: contrato.usuario_id,
          tipo_contrato: contrato.tipo_contrato,
          valor_mensal: contrato.valor_mensal,
          dia_vencimento: contrato.dia_vencimento,
          data_inicio: contrato.data_inicio,
          data_fim: contrato.data_fim || "",
          descricao: contrato.descricao || "",
          observacoes: contrato.observacoes || "",
          valor_taxa_adesao: contrato.valor_taxa_adesao || 0,
          desconto_percentual: contrato.desconto_percentual || 0,
        }
      : {
          valor_mensal: 0,
          dia_vencimento: 10,
          valor_taxa_adesao: 0,
          desconto_percentual: 0,
        },
  });

  // Buscar usuários da arena
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo")
        .eq("arena_id", arenaId)
        .eq("status", "ativo")
        .order("nome_completo");

      if (error) throw error;
      return data;
    },
    enabled: !!arenaId && open,
  });

  // Pre-select user if provided
  useEffect(() => {
    if (preSelectedUsuarioId && !contrato) {
      form.setValue("usuario_id", preSelectedUsuarioId);
    }
  }, [preSelectedUsuarioId, contrato, form]);

  const mutation = useMutation({
    mutationFn: async (data: ContratoFormData) => {
      const payload = {
        usuario_id: data.usuario_id,
        tipo_contrato: data.tipo_contrato as "mensal" | "trimestral" | "semestral" | "anual",
        valor_mensal: data.valor_mensal,
        dia_vencimento: data.dia_vencimento,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        descricao: data.descricao || null,
        observacoes: data.observacoes || null,
        valor_taxa_adesao: data.valor_taxa_adesao || 0,
        desconto_percentual: data.desconto_percentual || 0,
        beneficios: data.beneficios || [],
        arena_id: arenaId,
        status: "ativo" as const,
      };

      if (contrato) {
        const { error } = await supabase
          .from("contratos")
          .update(payload)
          .eq("id", contrato.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contratos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success(contrato ? "Contrato atualizado!" : "Contrato criado!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar contrato");
    },
  });

  const onSubmit = async (data: ContratoFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contrato ? "Editar" : "Novo"} Contrato</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="usuario_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usuarios?.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.nome_completo}
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
                name="tipo_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_mensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_taxa_adesao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Adesão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desconto_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" max="100" {...field} />
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
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
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
                {contrato ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
