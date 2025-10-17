import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, DollarSign, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlertasWidgetProps {
  arenaId: string;
}

export function AlertasWidget({ arenaId }: AlertasWidgetProps) {
  const navigate = useNavigate();

  // Query para buscar alertas
  const { data: alertas, isLoading } = useQuery({
    queryKey: ["alertas-widget", arenaId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const alerts = [];

      // Pagamentos vencidos
      const { data: mensalidadesVencidas } = await supabase
        .from("mensalidades")
        .select(`
          id,
          data_vencimento,
          valor,
          contratos!inner(
            usuarios!inner(nome_completo),
            arena_id
          )
        `)
        .eq("contratos.arena_id", arenaId)
        .eq("status_pagamento", "pendente")
        .lt("data_vencimento", hoje);

      if (mensalidadesVencidas && mensalidadesVencidas.length > 0) {
        alerts.push({
          tipo: "pagamento_vencido",
          icon: DollarSign,
          cor: "text-destructive",
          mensagem: `${mensalidadesVencidas.length} pagamento${mensalidadesVencidas.length > 1 ? 's' : ''} vencido${mensalidadesVencidas.length > 1 ? 's' : ''}`,
          acao: () => navigate("/financeiro?tab=mensalidades"),
        });
      }

      // Agendamentos cancelados hoje
      const { data: agendamentosCancelados } = await supabase
        .from("agendamentos")
        .select("id")
        .eq("arena_id", arenaId)
        .eq("data_agendamento", hoje)
        .eq("status", "cancelado");

      if (agendamentosCancelados && agendamentosCancelados.length > 0) {
        alerts.push({
          tipo: "agendamento_cancelado",
          icon: AlertTriangle,
          cor: "text-orange-500",
          mensagem: `${agendamentosCancelados.length} agendamento${agendamentosCancelados.length > 1 ? 's' : ''} cancelado${agendamentosCancelados.length > 1 ? 's' : ''} hoje`,
          acao: () => navigate("/agendamentos"),
        });
      }

      // Torneios próximos (próximos 7 dias)
      const seteDiasFrente = new Date();
      seteDiasFrente.setDate(seteDiasFrente.getDate() + 7);
      
      const { data: torneiosProximos } = await supabase
        .from("torneios")
        .select("id, nome, data_inicio")
        .eq("arena_id", arenaId)
        .gte("data_inicio", hoje)
        .lte("data_inicio", seteDiasFrente.toISOString().split("T")[0]);

      if (torneiosProximos && torneiosProximos.length > 0) {
        torneiosProximos.forEach((torneio) => {
          const diasAte = differenceInDays(new Date(torneio.data_inicio), new Date());
          alerts.push({
            tipo: "torneio_proximo",
            icon: Calendar,
            cor: "text-blue-500",
            mensagem: `Torneio "${torneio.nome}" em ${diasAte} dia${diasAte > 1 ? 's' : ''}`,
            acao: () => navigate("/torneios"),
          });
        });
      }

      // Quadras em manutenção
      const { data: quadrasManutencao } = await supabase
        .from("quadras")
        .select("id, nome")
        .eq("arena_id", arenaId)
        .eq("status", "manutencao");

      if (quadrasManutencao && quadrasManutencao.length > 0) {
        alerts.push({
          tipo: "quadra_manutencao",
          icon: AlertTriangle,
          cor: "text-yellow-500",
          mensagem: `${quadrasManutencao.length} quadra${quadrasManutencao.length > 1 ? 's' : ''} em manutenção`,
          acao: () => navigate("/quadras"),
        });
      }

      return alerts.slice(0, 5); // Máximo 5 alertas
    },
    enabled: !!arenaId,
    refetchInterval: 60000, // Recarregar a cada 1 minuto
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas e Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!alertas || alertas.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Tudo em dia! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta, index) => {
              const Icon = alerta.icon;
              return (
                <button
                  key={index}
                  onClick={alerta.acao}
                  className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Icon className={`h-5 w-5 ${alerta.cor} flex-shrink-0 mt-0.5`} />
                  <span className="text-sm">{alerta.mensagem}</span>
                </button>
              );
            })}
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate("/notificacoes")}
        >
          Ver todas as notificações
        </Button>
      </CardContent>
    </Card>
  );
}
