import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CheckinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentoId: string;
}

export function CheckinDialog({
  open,
  onOpenChange,
  agendamentoId,
}: CheckinDialogProps) {
  const queryClient = useQueryClient();
  const [observacoes, setObservacoes] = useState("");

  const { data: agendamento, isLoading } = useQuery({
    queryKey: ["agendamento-checkin", agendamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          quadras(nome, numero),
          usuarios!agendamentos_cliente_id_fkey(nome_completo, email, telefone)
        `)
        .eq("id", agendamentoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agendamentoId && open,
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      // Atualizar agendamento
      const { error: agendamentoError } = await supabase
        .from("agendamentos")
        .update({
          checkin_realizado: true,
          data_checkin: new Date().toISOString(),
          status: "confirmado",
        })
        .eq("id", agendamentoId);

      if (agendamentoError) throw agendamentoError;

      // Registrar check-in na tabela de checkins
      const { error: checkinError } = await supabase.from("checkins").insert({
        agendamento_id: agendamentoId,
        usuario_id: agendamento?.cliente_id,
        tipo_checkin: "manual",
        observacoes: observacoes || null,
      });

      if (checkinError) throw checkinError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos-calendario"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos-tabela"] });
      toast.success("Check-in realizado com sucesso!");
      onOpenChange(false);
      setObservacoes("");
    },
    onError: (error) => {
      toast.error("Erro ao realizar check-in");
      console.error(error);
    },
  });

  const handleCheckin = () => {
    checkinMutation.mutate();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!agendamento) return null;

  const jaTemCheckin = agendamento.checkin_realizado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Check-in do Agendamento
          </DialogTitle>
          <DialogDescription>
            {jaTemCheckin
              ? "Este agendamento já teve check-in realizado"
              : "Confirme a presença do cliente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Agendamento */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data</span>
              <span className="font-medium">
                {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Horário</span>
              <span className="font-medium">
                {agendamento.hora_inicio.substring(0, 5)} -{" "}
                {agendamento.hora_fim.substring(0, 5)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quadra</span>
              <span className="font-medium">
                Quadra {agendamento.quadras?.numero} - {agendamento.quadras?.nome}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="font-medium">
                {agendamento.usuarios?.nome_completo || "Sem cliente"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Pagamento</span>
              <Badge
                variant={
                  agendamento.status_pagamento === "pago" ? "default" : "secondary"
                }
              >
                {agendamento.status_pagamento}
              </Badge>
            </div>
          </div>

          {jaTemCheckin ? (
            <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                Check-in realizado em{" "}
                {format(new Date(agendamento.data_checkin!), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: Cliente chegou 10 minutos atrasado"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCheckin}
                  disabled={checkinMutation.isPending}
                >
                  {checkinMutation.isPending ? "Confirmando..." : "Confirmar Check-in"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
