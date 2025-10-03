import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quadraSchema, type QuadraFormData } from "@/lib/validations/quadra";

interface QuadraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quadra?: any;
}

export function QuadraDialog({ open, onOpenChange, quadra }: QuadraDialogProps) {
  const { arenaId } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuadraFormData>({
    resolver: zodResolver(quadraSchema),
    defaultValues: quadra || {
      nome: "",
      numero: 1,
      tipo_esporte: "padel",
      tipo_piso: "sintetico",
      valor_hora_normal: 0,
      valor_hora_pico: 0,
      cobertura: false,
      iluminacao: false,
      capacidade_jogadores: 4,
      status: "ativa",
      observacoes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: QuadraFormData) => {
      const quadraData = {
        nome: data.nome,
        numero: data.numero,
        tipo_esporte: data.tipo_esporte,
        tipo_piso: data.tipo_piso,
        valor_hora_normal: data.valor_hora_normal,
        valor_hora_pico: data.valor_hora_pico,
        cobertura: data.cobertura,
        iluminacao: data.iluminacao,
        capacidade_jogadores: data.capacidade_jogadores,
        status: data.status,
        observacoes: data.observacoes || null,
      };

      if (quadra) {
        const { error } = await supabase
          .from("quadras")
          .update(quadraData)
          .eq("id", quadra.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quadras")
          .insert([{ ...quadraData, arena_id: arenaId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quadras"] });
      toast.success(quadra ? "Quadra atualizada com sucesso!" : "Quadra criada com sucesso!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao salvar quadra: " + error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: QuadraFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quadra ? "Editar Quadra" : "Nova Quadra"}</DialogTitle>
          <DialogDescription>
            Preencha os dados da quadra abaixo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quadra Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_esporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esporte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="padel">Padel</SelectItem>
                        <SelectItem value="tenis">Tênis</SelectItem>
                        <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
                        <SelectItem value="futevolei">Futevôlei</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_piso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Piso</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sintetico">Sintético</SelectItem>
                        <SelectItem value="concreto">Concreto</SelectItem>
                        <SelectItem value="saibro">Saibro</SelectItem>
                        <SelectItem value="grama">Grama</SelectItem>
                        <SelectItem value="areia">Areia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor_hora_normal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor/Hora Normal</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_hora_pico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor/Hora Pico</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacidade_jogadores"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="cobertura"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Cobertura</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iluminacao"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Iluminação</FormLabel>
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
                    <Textarea placeholder="Observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
