import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckinDialog } from "@/components/agendamentos/CheckinDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MeusCheckins() {
  const [selectedAgendamento, setSelectedAgendamento] = useState<string | null>(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);

  const { data: usuario } = useQuery({
    queryKey: ["usuario-atual"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome_completo, arena_id")
        .eq("auth_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["meus-agendamentos-checkin", usuario?.id],
    queryFn: async () => {
      if (!usuario?.id) return [];

      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      const trintaDiasDepois = new Date();
      trintaDiasDepois.setDate(hoje.getDate() + 30);

      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id,
          data_agendamento,
          hora_inicio,
          hora_fim,
          status,
          checkin_realizado,
          data_checkin,
          quadras (
            nome,
            numero
          ),
          arenas (
            nome,
            janela_checkin_minutos_antes,
            janela_checkin_minutos_depois
          )
        `)
        .eq("cliente_id", usuario.id)
        .gte("data_agendamento", trintaDiasAtras.toISOString().split("T")[0])
        .lte("data_agendamento", trintaDiasDepois.toISOString().split("T")[0])
        .order("data_agendamento", { ascending: true })
        .order("hora_inicio", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  const handleCheckin = (agendamentoId: string) => {
    setSelectedAgendamento(agendamentoId);
    setCheckinDialogOpen(true);
  };

  const podeCheckin = (agendamento: any) => {
    if (agendamento.checkin_realizado) return false;

    const agora = new Date();
    const dataAgendamento = new Date(agendamento.data_agendamento);
    const [horaInicio, minInicio] = agendamento.hora_inicio.split(":");
    const horarioAgendamento = new Date(dataAgendamento);
    horarioAgendamento.setHours(parseInt(horaInicio), parseInt(minInicio), 0);

    const minutosAntes = agendamento.arenas?.janela_checkin_minutos_antes || 30;
    const minutosDepois = agendamento.arenas?.janela_checkin_minutos_depois || 15;

    const inicioJanela = new Date(horarioAgendamento.getTime() - minutosAntes * 60000);
    const fimJanela = new Date(horarioAgendamento.getTime() + minutosDepois * 60000);

    return agora >= inicioJanela && agora <= fimJanela;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const agendamentosComCheckin = agendamentos?.filter((a) => a.checkin_realizado) || [];
  const agendamentosSemCheckin = agendamentos?.filter((a) => !a.checkin_realizado) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meus Check-ins</h2>
        <p className="text-muted-foreground">
          Gerencie seus check-ins de agendamentos
        </p>
      </div>

      {agendamentosSemCheckin.length === 0 && agendamentosComCheckin.length === 0 && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            Você não tem agendamentos nos próximos 30 dias.
          </AlertDescription>
        </Alert>
      )}

      {agendamentosSemCheckin.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pendentes de Check-in</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {agendamentosSemCheckin.map((agendamento) => (
              <Card key={agendamento.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>
                      Quadra {agendamento.quadras?.numero} - {agendamento.quadras?.nome}
                    </span>
                    <Badge variant={podeCheckin(agendamento) ? "default" : "secondary"}>
                      {podeCheckin(agendamento) ? "Disponível" : "Fora do horário"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {agendamento.hora_inicio.substring(0, 5)} -{" "}
                        {agendamento.hora_fim.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{agendamento.arenas?.nome}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCheckin(agendamento.id)}
                    disabled={!podeCheckin(agendamento)}
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fazer Check-in
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {agendamentosComCheckin.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Check-ins Realizados</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {agendamentosComCheckin.map((agendamento) => (
              <Card key={agendamento.id} className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>
                      Quadra {agendamento.quadras?.numero} - {agendamento.quadras?.nome}
                    </span>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Confirmado
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {agendamento.hora_inicio.substring(0, 5)} -{" "}
                      {agendamento.hora_fim.substring(0, 5)}
                    </span>
                  </div>
                  {agendamento.data_checkin && (
                    <div className="mt-2 pt-2 border-t text-xs text-green-700 dark:text-green-300">
                      Check-in realizado em{" "}
                      {format(new Date(agendamento.data_checkin), "dd/MM 'às' HH:mm")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedAgendamento && (
        <CheckinDialog
          open={checkinDialogOpen}
          onOpenChange={setCheckinDialogOpen}
          agendamentoId={selectedAgendamento}
        />
      )}
    </div>
  );
}
