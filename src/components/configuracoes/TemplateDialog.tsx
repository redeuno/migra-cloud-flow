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
import { Loader2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const templateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tipo: z.enum(["whatsapp", "email", "sms"]),
  categoria: z.string().min(1, "Selecione uma categoria"),
  assunto: z.string().optional(),
  mensagem: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
  ativo: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
}

const variaveisDisponiveis = [
  "{{nome}}",
  "{{email}}",
  "{{telefone}}",
  "{{valor}}",
  "{{data_vencimento}}",
  "{{link_pagamento}}",
  "{{professor}}",
  "{{horario}}",
  "{{quadra}}",
  "{{data}}",
  "{{hora}}",
];

export function TemplateDialog({ open, onOpenChange, template }: TemplateDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: "",
      tipo: "whatsapp",
      categoria: "lembrete",
      assunto: "",
      mensagem: "",
      ativo: true,
    },
  });

  useEffect(() => {
    if (template && open) {
      form.reset({
        nome: template.nome,
        tipo: template.tipo,
        categoria: template.categoria,
        assunto: template.assunto || "",
        mensagem: template.mensagem,
        ativo: template.ativo,
      });
    } else if (!template && open) {
      form.reset({
        nome: "",
        tipo: "whatsapp",
        categoria: "lembrete",
        assunto: "",
        mensagem: "",
        ativo: true,
      });
    }
  }, [template, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      // Extrair variáveis da mensagem
      const variaveis = [...data.mensagem.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]);
      
      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        categoria: data.categoria,
        assunto: data.assunto || null,
        mensagem: data.mensagem,
        ativo: data.ativo,
        variaveis: JSON.stringify(variaveis),
      };

      if (template) {
        const { error } = await supabase
          .from("templates_notificacao")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("templates_notificacao").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates-notificacao-all"] });
      toast.success(template ? "Template atualizado!" : "Template criado!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar template");
    },
  });

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    await mutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  const insertVariable = (variable: string) => {
    const currentMessage = form.getValues("mensagem");
    form.setValue("mensagem", currentMessage + " " + variable);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar" : "Novo"} Template de Notificação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lembrete de Pagamento" {...field} />
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
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                        <SelectItem value="confirmacao">Confirmação</SelectItem>
                        <SelectItem value="lembrete">Lembrete</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("tipo") === "email" && (
              <FormField
                control={form.control}
                name="assunto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto do E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Sua mensalidade vence em breve" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="mensagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a mensagem do template..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use as variáveis abaixo para personalizar a mensagem
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Variáveis Disponíveis</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {variaveisDisponiveis.map((variavel) => (
                  <Badge
                    key={variavel}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => insertVariable(variavel)}
                  >
                    {variavel}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Clique em uma variável para adicionar à mensagem
              </p>
            </div>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Templates inativos não podem ser usados para envio
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
                {template ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
