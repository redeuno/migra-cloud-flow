import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, CheckCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckinDialog } from "@/components/agendamentos/CheckinDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CheckinsProfessor() {
  const [selectedAgendamento, setSelectedAgendamento] = useState<string | null>(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);

  const { data: professor } = useQuery({
    queryKey: ["professor-atual"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      const { data, error } = await supabase
        .from("professores")
        .select("id, arena_id")
        .eq("usuario_id", usuario.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: aulas, isLoading } = useQuery({
    queryKey: ["minhas-aulas-checkin", professor?.id],
    queryFn: async () => {
      if (!professor?.id) return [];

      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      const trintaDiasDepois = new Date();
      trintaDiasDepois.setDate(hoje.getDate() + 30);

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          id,
          titulo,
          data_aula,
          hora_inicio,
          hora_fim,
          tipo_aula,
          status,
          realizada,
          presencas,
          agendamento_id,
          max_alunos,
          quadras (
            nome,
            numero
          ),
          agendamentos (
            id,
            checkin_realizado,
            data_checkin,
            arenas (
              nome,
              janela_checkin_minutos_antes,
              janela_checkin_minutos_depois
            )
          )
        `)
        .eq("professor_id", professor.id)
        .gte("data_aula", trintaDiasAtras.toISOString().split("T")[0])
        .lte("data_aula", trintaDiasDepois.toISOString().split("T")[0])
        .order("data_aula", { ascending: true })
        .order("hora_inicio", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!professor?.id,
  });

  const handleCheckin = (agendamentoId: string) => {
    setSelectedAgendamento(agendamentoId);
    setCheckinDialogOpen(true);
  };

  const podeCheckin = (aula: any) => {
    if (!aula.agendamento_id || aula.agendamentos?.checkin_realizado) return false;

    const agora = new Date();
    const dataAula = new Date(aula.data_aula);
    const [horaInicio, minInicio] = aula.hora_inicio.split(":");
    const horarioAula = new Date(dataAula);
    horarioAula.setHours(parseInt(horaInicio), parseInt(minInicio), 0);

    const minutosAntes = aula.agendamentos?.arenas?.janela_checkin_minutos_antes || 30;
    const minutosDepois = aula.agendamentos?.arenas?.janela_checkin_minutos_depois || 15;

    const inicioJanela = new Date(horarioAula.getTime() - minutosAntes * 60000);
    const fimJanela = new Date(horarioAula.getTime() + minutosDepois * 60000);

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

  const aulasComCheckin = aulas?.filter((a) => a.agendamentos?.checkin_realizado) || [];
  const aulasSemCheckin = aulas?.filter((a) => a.agendamento_id && !a.agendamentos?.checkin_realizado) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Check-ins das Minhas Aulas</h2>
        <p className="text-muted-foreground">
          Gerencie os check-ins das suas aulas
        </p>
      </div>

      {aulasSemCheckin.length === 0 && aulasComCheckin.length === 0 && (
        <Alert>
          <BookOpen className="h-4 w-4" />
          <AlertDescription>
            Você não tem aulas agendadas nos próximos 30 dias.
          </AlertDescription>
        </Alert>
      )}

      {aulasSemCheckin.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pendentes de Check-in</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {aulasSemCheckin.map((aula) => {
              const presencas = (aula.presencas as any[]) || [];
              const totalAlunos = presencas.length;

              return (
                <Card key={aula.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{aula.titulo}</span>
                      <Badge variant={podeCheckin(aula) ? "default" : "secondary"}>
                        {podeCheckin(aula) ? "Disponível" : "Fora do horário"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(aula.data_aula), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {totalAlunos}/{aula.max_alunos} alunos
                        </span>
                      </div>
                      {aula.quadras && (
                        <div className="text-xs text-muted-foreground">
                          Quadra {aula.quadras.numero} - {aula.quadras.nome}
                        </div>
                      )}
                    </div>

                    {aula.agendamento_id && (
                      <Button
                        onClick={() => handleCheckin(aula.agendamento_id)}
                        disabled={!podeCheckin(aula)}
                        className="w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Fazer Check-in
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {aulasComCheckin.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Check-ins Realizados</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {aulasComCheckin.map((aula) => {
              const presencas = (aula.presencas as any[]) || [];
              const totalAlunos = presencas.length;

              return (
                <Card
                  key={aula.id}
                  className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{aula.titulo}</span>
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
                        {format(new Date(aula.data_aula), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {totalAlunos}/{aula.max_alunos} alunos
                      </span>
                    </div>
                    {aula.agendamentos?.data_checkin && (
                      <div className="mt-2 pt-2 border-t text-xs text-green-700 dark:text-green-300">
                        Check-in realizado em{" "}
                        {format(new Date(aula.agendamentos.data_checkin), "dd/MM 'às' HH:mm")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
