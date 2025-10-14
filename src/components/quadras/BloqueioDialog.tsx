import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const bloqueioSchema = z.object({
  quadra_id: z.string().min(1, "Selecione uma quadra"),
  tipo: z.enum(["manutencao", "bloqueio"]),
  data_inicio: z.date(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  data_fim: z.date(),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  motivo: z.string().min(3, "Descreva o motivo"),
});

type BloqueioFormData = z.infer<typeof bloqueioSchema>;

interface BloqueioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloqueioId?: string;
  defaultQuadraId?: string;
}

export function BloqueioDialog({
  open,
  onOpenChange,
  bloqueioId,
  defaultQuadraId,
}: BloqueioDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<BloqueioFormData>({
    resolver: zodResolver(bloqueioSchema),
    defaultValues: {
      tipo: "manutencao",
      quadra_id: defaultQuadraId || "",
      data_inicio: new Date(),
      hora_inicio: "08:00",
      data_fim: new Date(),
      hora_fim: "18:00",
    },
  });

  const { data: quadras } = useQuery({
    queryKey: ["quadras-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .order("numero");
      if (error) throw error;
      return data;
    },
  });

  const { data: bloqueio } = useQuery({
    queryKey: ["bloqueio", bloqueioId],
    queryFn: async () => {
      if (!bloqueioId) return null;
      const { data, error } = await supabase
        .from("bloqueios_quadra")
        .select("*")
        .eq("id", bloqueioId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bloqueioId,
  });

  useEffect(() => {
    if (bloqueio) {
      const dataInicio = new Date(bloqueio.data_inicio);
      const dataFim = new Date(bloqueio.data_fim);
      
      form.reset({
        quadra_id: bloqueio.quadra_id,
        tipo: bloqueio.tipo as any,
        data_inicio: dataInicio,
        hora_inicio: format(dataInicio, "HH:mm"),
        data_fim: dataFim,
        hora_fim: format(dataFim, "HH:mm"),
        motivo: bloqueio.motivo,
      });
    }
  }, [bloqueio, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: BloqueioFormData) => {
      const dataInicioISO = `${format(data.data_inicio, "yyyy-MM-dd")}T${data.hora_inicio}:00`;
      const dataFimISO = `${format(data.data_fim, "yyyy-MM-dd")}T${data.hora_fim}:00`;

      const payload = {
        quadra_id: data.quadra_id,
        tipo: data.tipo,
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        motivo: data.motivo,
      };

      if (bloqueioId) {
        const { error } = await supabase
          .from("bloqueios_quadra")
          .update(payload)
          .eq("id", bloqueioId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bloqueios_quadra").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bloqueios-quadra"] });
      toast.success(
        bloqueioId
          ? "Bloqueio atualizado com sucesso!"
          : "Bloqueio criado com sucesso!"
      );
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar bloqueio");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {bloqueioId ? "Editar Bloqueio" : "Novo Bloqueio/Manutenção"}
          </DialogTitle>
          <DialogDescription>
            Registre bloqueios ou manutenções programadas para quadras
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quadra_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadra *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quadras?.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            Quadra {q.numero} - {q.nome}
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
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="bloqueio">Bloqueio</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fim *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Descreva o motivo do bloqueio/manutenção" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
