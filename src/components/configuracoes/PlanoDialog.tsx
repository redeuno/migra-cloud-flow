import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const planoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  valor_mensal: z.coerce.number().min(0, "Valor deve ser maior ou igual a 0"),
  max_quadras: z.coerce.number().min(1, "Deve permitir pelo menos 1 quadra"),
  max_usuarios: z.coerce.number().min(1, "Deve permitir pelo menos 1 usuário"),
  status: z.enum(["ativo", "inativo"]),
});

type PlanoFormData = z.infer<typeof planoSchema>;

interface PlanoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: any;
}

export function PlanoDialog({ open, onOpenChange, plano }: PlanoDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlanoFormData>({
    resolver: zodResolver(planoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      valor_mensal: 0,
      max_quadras: 10,
      max_usuarios: 100,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (plano && open) {
      form.reset({
        nome: plano.nome,
        descricao: plano.descricao || "",
        valor_mensal: plano.valor_mensal,
        max_quadras: plano.max_quadras,
        max_usuarios: plano.max_usuarios,
        status: plano.status,
      });
    } else if (!plano && open) {
      form.reset({
        nome: "",
        descricao: "",
        valor_mensal: 0,
        max_quadras: 10,
        max_usuarios: 100,
        status: "ativo",
      });
    }
  }, [plano, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: PlanoFormData) => {
      const payload = {
        nome: data.nome,
        descricao: data.descricao || null,
        valor_mensal: data.valor_mensal,
        max_quadras: data.max_quadras,
        max_usuarios: data.max_usuarios,
        status: data.status,
        modulos_inclusos: [],
        recursos_extras: {},
      };

      if (plano) {
        const { error } = await supabase
          .from("planos_sistema")
          .update(payload)
          .eq("id", plano.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("planos_sistema").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-sistema-all"] });
      queryClient.invalidateQueries({ queryKey: ["planos-sistema"] });
      toast.success(plano ? "Plano atualizado!" : "Plano criado!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar plano");
    },
  });

  const onSubmit = async (data: PlanoFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plano ? "Editar" : "Novo"} Plano do Sistema</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Plano Premium" {...field} />
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
                    <Textarea placeholder="Descreva o plano..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                name="max_quadras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Quadras *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_usuarios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Usuários *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
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
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Apenas planos ativos podem ser selecionados ao criar novas assinaturas
                  </FormDescription>
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
                {plano ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
