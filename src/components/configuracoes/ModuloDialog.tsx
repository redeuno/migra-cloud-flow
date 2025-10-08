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

const moduloSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.coerce.number().min(0, "Ordem deve ser maior ou igual a 0"),
  status: z.enum(["ativo", "inativo"]),
});

type ModuloFormData = z.infer<typeof moduloSchema>;

interface ModuloDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulo?: any;
}

export function ModuloDialog({ open, onOpenChange, modulo }: ModuloDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ModuloFormData>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      nome: "",
      slug: "",
      descricao: "",
      icone: "",
      ordem: 0,
      status: "ativo",
    },
  });

  useEffect(() => {
    if (modulo && open) {
      form.reset({
        nome: modulo.nome,
        slug: modulo.slug,
        descricao: modulo.descricao || "",
        icone: modulo.icone || "",
        ordem: modulo.ordem,
        status: modulo.status,
      });
    } else if (!modulo && open) {
      form.reset({
        nome: "",
        slug: "",
        descricao: "",
        icone: "",
        ordem: 0,
        status: "ativo",
      });
    }
  }, [modulo, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: ModuloFormData) => {
      const payload = {
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao || null,
        icone: data.icone || null,
        ordem: data.ordem,
        status: data.status,
        dependencias: [],
      };

      if (modulo) {
        const { error } = await supabase
          .from("modulos_sistema")
          .update(payload)
          .eq("id", modulo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("modulos_sistema").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modulos-sistema-all"] });
      toast.success(modulo ? "Módulo atualizado!" : "Módulo criado!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar módulo");
    },
  });

  const onSubmit = async (data: ModuloFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modulo ? "Editar" : "Novo"} Módulo do Sistema</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Módulo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Agendamentos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: agendamentos" {...field} />
                    </FormControl>
                    <FormDescription>
                      Apenas letras minúsculas, números e hífens
                    </FormDescription>
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
                    <Textarea placeholder="Descreva o módulo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="icone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Calendar" {...field} />
                    </FormControl>
                    <FormDescription>Nome do ícone Lucide</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {modulo ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
