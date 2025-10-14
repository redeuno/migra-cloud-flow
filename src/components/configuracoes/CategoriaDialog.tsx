import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const categoriaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["receita", "despesa", "transferencia"]),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato #RRGGBB"),
  icone: z.string().min(1, "Selecione um ícone"),
  ordem: z.coerce.number().min(1, "Ordem deve ser maior que 0"),
  ativo: z.boolean(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

interface CategoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: any;
}

const iconesDisponiveis = [
  "DollarSign",
  "Calendar",
  "GraduationCap",
  "Trophy",
  "Users",
  "Wrench",
  "FileText",
  "CreditCard",
  "ShoppingCart",
  "Building",
  "Car",
  "Phone",
  "Zap",
  "Coffee",
  "Home",
];

export function CategoriaDialog({ open, onOpenChange, categoria }: CategoriaDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      tipo: "receita",
      cor: "#10b981",
      icone: "DollarSign",
      ordem: 1,
      ativo: true,
    },
  });

  useEffect(() => {
    if (categoria && open) {
      form.reset({
        nome: categoria.nome,
        tipo: categoria.tipo,
        cor: categoria.cor,
        icone: categoria.icone,
        ordem: categoria.ordem,
        ativo: categoria.ativo,
      });
    } else if (!categoria && open) {
      form.reset({
        nome: "",
        tipo: "receita",
        cor: "#10b981",
        icone: "DollarSign",
        ordem: 1,
        ativo: true,
      });
    }
  }, [categoria, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        cor: data.cor,
        icone: data.icone,
        ordem: data.ordem,
        ativo: data.ativo,
      };

      if (categoria) {
        const { error } = await supabase
          .from("categorias_financeiras")
          .update(payload)
          .eq("id", categoria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categorias_financeiras").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-financeiras-all"] });
      toast.success(categoria ? "Categoria atualizada!" : "Categoria criada!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar categoria");
    },
  });

  const onSubmit = async (data: CategoriaFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar" : "Nova"} Categoria Financeira</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidades" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {iconesDisponiveis.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
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
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor (Hex) *</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de exibição *</FormLabel>
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
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Categorias inativas não aparecem ao criar movimentações
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {categoria ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
