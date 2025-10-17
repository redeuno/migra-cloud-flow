import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SquareActivity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OcupacaoQuadrasWidgetProps {
  arenaId: string;
}

export function OcupacaoQuadrasWidget({ arenaId }: OcupacaoQuadrasWidgetProps) {
  // Query para buscar ocupação semanal
  const { data: ocupacao, isLoading } = useQuery({
    queryKey: ["ocupacao-semanal", arenaId],
    queryFn: async () => {
      const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira
      const fimSemana = endOfWeek(new Date(), { weekStartsOn: 1 }); // Domingo
      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

      // Buscar agendamentos da semana
      const { data: agendamentos, error } = await supabase
        .from("agendamentos")
        .select("data_agendamento, hora_inicio, hora_fim, quadra_id")
        .eq("arena_id", arenaId)
        .gte("data_agendamento", format(inicioSemana, "yyyy-MM-dd"))
        .lte("data_agendamento", format(fimSemana, "yyyy-MM-dd"))
        .neq("status", "cancelado");

      if (error) throw error;

      // Buscar horário de funcionamento da arena
      const { data: arenaData } = await supabase
        .from("arenas")
        .select("horario_funcionamento")
        .eq("id", arenaId)
        .single();

      const horarioFuncionamento = arenaData?.horario_funcionamento as any;

      // Calcular ocupação por dia
      const ocupacaoPorDia = diasSemana.map((dia) => {
        const diaSemana = format(dia, "eeee", { locale: ptBR });
        const diaFormatado = format(dia, "EEE", { locale: ptBR });
        
        // Horário de funcionamento do dia
        const configDia = horarioFuncionamento?.[diaSemana.toLowerCase()];
        if (!configDia || !configDia.aberto) {
          return {
            dia: diaFormatado,
            ocupacao: 0,
            agendamentos: 0,
            horasDisponiveis: 0,
          };
        }

        const [horaInicio, minInicio] = configDia.abertura.split(":").map(Number);
        const [horaFim, minFim] = configDia.fechamento.split(":").map(Number);
        const horasDisponiveis = (horaFim * 60 + minFim - horaInicio * 60 - minInicio) / 60;

        // Contar agendamentos do dia
        const agendamentosDia = (agendamentos || []).filter((ag: any) =>
          isSameDay(new Date(ag.data_agendamento), dia)
        );

        // Calcular horas ocupadas
        const horasOcupadas = agendamentosDia.reduce((total: number, ag: any) => {
          const [hI, mI] = ag.hora_inicio.split(":").map(Number);
          const [hF, mF] = ag.hora_fim.split(":").map(Number);
          const duracao = (hF * 60 + mF - hI * 60 - mI) / 60;
          return total + duracao;
        }, 0);

        const ocupacaoPercent = horasDisponiveis > 0 
          ? Math.round((horasOcupadas / horasDisponiveis) * 100)
          : 0;

        return {
          dia: diaFormatado,
          ocupacao: Math.min(ocupacaoPercent, 100),
          agendamentos: agendamentosDia.length,
          horasDisponiveis,
        };
      });

      return ocupacaoPorDia;
    },
    enabled: !!arenaId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SquareActivity className="h-5 w-5" />
            Ocupação Semanal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SquareActivity className="h-5 w-5" />
          Ocupação Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ocupacao?.map((dia) => (
            <div key={dia.dia} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{dia.dia}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {dia.agendamentos} agendamento{dia.agendamentos !== 1 ? "s" : ""}
                  </span>
                  <span className="font-medium">{dia.ocupacao}%</span>
                </div>
              </div>
              <Progress value={dia.ocupacao} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
