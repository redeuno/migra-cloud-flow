import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { agendamentoFormSchema, type AgendamentoFormData } from "@/lib/validations/agendamento";
import { AgendamentoRecorrenteConfig } from "./AgendamentoRecorrenteConfig";
import { addDays, addWeeks, addMonths } from "date-fns";
import { validarAgendamentoCompleto } from "@/lib/utils/validarConflitosAgendamento";

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentoId?: string;
  defaultValues?: Partial<AgendamentoFormData> & { 
    quadra_id?: string;
    data_agendamento?: Date;
    hora_inicio?: string;
  };
}

export function AgendamentoDialog({
  open,
  onOpenChange,
  agendamentoId,
  defaultValues,
}: AgendamentoDialogProps) {
  const queryClient = useQueryClient();
  const { arenaId, user, hasRole } = useAuth();

  const [recorrenciaConfig, setRecorrenciaConfig] = useState({
    ativo: false,
    frequencia: "semanal" as "semanal" | "quinzenal" | "mensal",
    dias_semana: [] as number[],
    total_ocorrencias: 4,
    data_fim: undefined as Date | undefined,
  });

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoFormSchema),
    defaultValues: {
      modalidade: "beach_tennis",
      tipo_agendamento: "avulso",
      max_participantes: 4,
      valor_total: 100,
      ...defaultValues,
    },
  });

  const { data: quadras } = useQuery({
    queryKey: ["quadras-select", arenaId],
    queryFn: async () => {
      if (!arenaId) return [];

      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .eq("arena_id", arenaId)
        .eq("status", "ativa")
        .order("numero");
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes-select", arenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo, email")
        .eq("arena_id", arenaId)
        .eq("status", "ativo")
        .eq("tipo_usuario", "aluno")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: !!arenaId,
  });

  const { data: agendamento } = useQuery({
    queryKey: ["agendamento", agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("id", agendamentoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agendamentoId,
  });

  useEffect(() => {
    if (agendamento) {
      form.reset({
        quadra_id: agendamento.quadra_id || undefined,
        cliente_id: agendamento.cliente_id || undefined,
        data_agendamento: new Date(agendamento.data_agendamento),
        hora_inicio: agendamento.hora_inicio.substring(0, 5),
        hora_fim: agendamento.hora_fim.substring(0, 5),
        modalidade: agendamento.modalidade as any,
        tipo_agendamento: agendamento.tipo_agendamento as any,
        valor_total: Number(agendamento.valor_total),
        max_participantes: agendamento.max_participantes,
        observacoes: agendamento.observacoes || undefined,
      });
    }
  }, [agendamento, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: AgendamentoFormData) => {
      // Validar conflitos antes de salvar
      const validacao = await validarAgendamentoCompleto(
        data.quadra_id,
        data.data_agendamento,
        data.hora_inicio,
        data.hora_fim,
        agendamentoId
      );

      if (validacao.temConflito) {
        throw new Error(validacao.mensagem);
      }

      // Garantir vinculação do aluno ao agendamento, quando aplicável
      let resolvedClienteId = data.cliente_id || null;
      if (!resolvedClienteId && hasRole && hasRole("aluno")) {
        try {
          const { data: me } = await supabase
            .from("usuarios")
            .select("id")
            .eq("auth_id", user?.id || "")
            .single();
          resolvedClienteId = me?.id || null;
        } catch {}
      }

      const basePayload = {
        arena_id: arenaId,
        quadra_id: data.quadra_id,
        cliente_id: resolvedClienteId,
        hora_inicio: data.hora_inicio,
        hora_fim: data.hora_fim,
        modalidade: data.modalidade,
        tipo_agendamento: data.tipo_agendamento,
        valor_total: data.valor_total,
        max_participantes: data.max_participantes,
        observacoes: data.observacoes || null,
        status: "pendente" as const,
        status_pagamento: "pendente" as const,
      };

      if (agendamentoId) {
        // Edição - não permite recorrência
        const { error } = await supabase
          .from("agendamentos")
          .update({
            ...basePayload,
            data_agendamento: format(data.data_agendamento, "yyyy-MM-dd"),
          })
          .eq("id", agendamentoId);
        if (error) throw error;
      } else {
        // Criação - suporta recorrência
        if (recorrenciaConfig.ativo && recorrenciaConfig.total_ocorrencias > 1) {
          // Criar múltiplos agendamentos
          const agendamentos = [];
          let dataAtual = data.data_agendamento;

          for (let i = 0; i < recorrenciaConfig.total_ocorrencias; i++) {
            agendamentos.push({
              ...basePayload,
              data_agendamento: format(dataAtual, "yyyy-MM-dd"),
              e_recorrente: true,
              recorrencia_config: recorrenciaConfig,
            });

            // Calcular próxima data baseado na frequência
            if (recorrenciaConfig.frequencia === "semanal") {
              dataAtual = addWeeks(dataAtual, 1);
            } else if (recorrenciaConfig.frequencia === "quinzenal") {
              dataAtual = addWeeks(dataAtual, 2);
            } else if (recorrenciaConfig.frequencia === "mensal") {
              dataAtual = addMonths(dataAtual, 1);
            }
          }

          const { error } = await supabase.from("agendamentos").insert(agendamentos);
          if (error) throw error;
        } else {
          // Agendamento único
          const { error } = await supabase.from("agendamentos").insert({
            ...basePayload,
            data_agendamento: format(data.data_agendamento, "yyyy-MM-dd"),
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos-calendario"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos-tabela"] });
      const mensagem = recorrenciaConfig.ativo && recorrenciaConfig.total_ocorrencias > 1
        ? `${recorrenciaConfig.total_ocorrencias} agendamentos criados com sucesso!`
        : agendamentoId
        ? "Agendamento atualizado com sucesso!"
        : "Agendamento criado com sucesso!";
      toast.success(mensagem);
      onOpenChange(false);
      form.reset();
      setRecorrenciaConfig({
        ativo: false,
        frequencia: "semanal",
        dias_semana: [],
        total_ocorrencias: 4,
        data_fim: undefined,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar agendamento");
      if (import.meta.env.DEV) console.error("Erro ao salvar agendamento:", error);
    },
  });

  const onSubmit = (data: AgendamentoFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agendamentoId ? "Editar Agendamento" : "Novo Agendamento"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do agendamento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <SelectValue placeholder="Selecione a quadra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quadras?.map((quadra) => (
                          <SelectItem key={quadra.id} value={quadra.id}>
                            Quadra {quadra.numero} - {quadra.nome}
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
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data_agendamento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="padel">Padel</SelectItem>
                        <SelectItem value="tenis">Tênis</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_agendamento"
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
                        <SelectItem value="avulso">Avulso</SelectItem>
                        <SelectItem value="mensalista">Mensalista</SelectItem>
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
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Participantes *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
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
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agendamento Recorrente - só aparece ao criar novo */}
            {!agendamentoId && (
              <AgendamentoRecorrenteConfig
                value={recorrenciaConfig}
                onChange={(config) => setRecorrenciaConfig({
                  ativo: config.ativo,
                  frequencia: config.frequencia,
                  dias_semana: config.dias_semana || [],
                  total_ocorrencias: config.total_ocorrencias || 4,
                  data_fim: config.data_fim
                })}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
