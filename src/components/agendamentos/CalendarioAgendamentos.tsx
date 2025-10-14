import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckinStatusBadge } from "./CheckinStatusBadge";

interface CalendarioAgendamentosProps {
  onSelectSlot: (quadraId: string, data: Date, hora: string) => void;
  onSelectAgendamento: (agendamentoId: string) => void;
}

const HORARIOS = Array.from({ length: 15 }, (_, i) => {
  const hora = 7 + i;
  return `${hora.toString().padStart(2, "0")}:00`;
});

export function CalendarioAgendamentos({
  onSelectSlot,
  onSelectAgendamento,
}: CalendarioAgendamentosProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedQuadra, setSelectedQuadra] = useState<string>("all");
  const isMobile = useIsMobile();

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: quadras, isLoading: loadingQuadras } = useQuery({
    queryKey: ["quadras-calendario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quadras")
        .select("*")
        .eq("status", "ativa")
        .order("numero");
      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["agendamentos-calendario", weekStart],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 6);
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*, quadras(nome, numero), usuarios!agendamentos_cliente_id_fkey(nome_completo)")
        .gte("data_agendamento", format(weekStart, "yyyy-MM-dd"))
        .lte("data_agendamento", format(weekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelado")
        .order("hora_inicio");
      if (error) throw error;
      return data;
    },
  });

  const getAgendamentosForSlot = (quadraId: string, dia: Date, hora: string) => {
    if (!agendamentos) return [];
    return agendamentos.filter(
      (ag) =>
        ag.quadra_id === quadraId &&
        isSameDay(new Date(ag.data_agendamento), dia) &&
        ag.hora_inicio.substring(0, 5) === hora
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      confirmado: "bg-green-500/20 text-green-700 border-green-500/30",
      pendente: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      cancelado: "bg-red-500/20 text-red-700 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || "bg-muted";
  };

  if (loadingQuadras || loadingAgendamentos) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const quadrasFiltradas = selectedQuadra === "all" 
    ? quadras 
    : quadras?.filter(q => q.id === selectedQuadra);

  // Vista mobile: lista de agendamentos
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Controles Mobile */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center font-medium text-sm">
            {format(weekStart, "dd/MM/yyyy", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: ptBR })}
          </div>

          <select
            value={selectedQuadra}
            onChange={(e) => setSelectedQuadra(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas as quadras</option>
            {quadras?.map((q) => (
              <option key={q.id} value={q.id}>
                Quadra {q.numero} - {q.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de Agendamentos por Dia */}
        <div className="space-y-4">
          {weekDays.map((dia) => {
            const agendamentosDia = agendamentos?.filter(
              (ag) => isSameDay(new Date(ag.data_agendamento), dia)
            );

            return (
              <Card key={dia.toISOString()} className="overflow-hidden">
                <div className={cn(
                  "p-3 border-b font-medium",
                  isSameDay(dia, new Date()) && "bg-primary/10"
                )}>
                  <div className="text-sm">
                    {format(dia, "EEEE", { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(dia, "dd/MM/yyyy")}
                  </div>
                </div>
                
                <div className="p-3 space-y-2">
                  {agendamentosDia && agendamentosDia.length > 0 ? (
                    agendamentosDia.map((ag) => (
                      <div
                        key={ag.id}
                        onClick={() => onSelectAgendamento(ag.id)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                          getStatusColor(ag.status)
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">
                            {ag.hora_inicio.substring(0, 5)} - {ag.hora_fim.substring(0, 5)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {ag.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Quadra {ag.quadras?.numero} • {ag.usuarios?.nome_completo || "Cliente"}
                        </div>
                        <CheckinStatusBadge
                          checkinRealizado={ag.checkin_realizado}
                          dataCheckin={ag.data_checkin}
                          className="text-xs"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Nenhum agendamento
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista desktop: grid
  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addDays(currentDate, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date())}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addDays(currentDate, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-2 font-medium">
            {format(weekStart, "dd/MM/yyyy", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>

        <select
          value={selectedQuadra}
          onChange={(e) => setSelectedQuadra(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        >
          <option value="all">Todas as quadras</option>
          {quadras?.map((q) => (
            <option key={q.id} value={q.id}>
              Quadra {q.numero} - {q.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Grid do Calendário */}
      <div className="overflow-auto rounded-lg border">
        <div className="min-w-[1200px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-8 border-b bg-muted/50">
            <div className="p-2 font-medium">Horário</div>
            {weekDays.map((dia) => (
              <div
                key={dia.toISOString()}
                className={cn(
                  "p-2 text-center font-medium",
                  isSameDay(dia, new Date()) && "bg-primary/10"
                )}
              >
                <div>{format(dia, "EEE", { locale: ptBR })}</div>
                <div className="text-sm text-muted-foreground">
                  {format(dia, "dd/MM")}
                </div>
              </div>
            ))}
          </div>

          {/* Linhas de horários */}
          {quadrasFiltradas?.map((quadra) => (
            <div key={quadra.id} className="border-b">
              <div className="bg-muted/30 p-2 text-sm font-medium">
                Quadra {quadra.numero} - {quadra.nome}
              </div>
              {HORARIOS.map((hora) => (
                <div key={hora} className="grid grid-cols-8 border-t">
                  <div className="border-r p-2 text-sm text-muted-foreground">
                    {hora}
                  </div>
                  {weekDays.map((dia) => {
                    const agendamentosSlot = getAgendamentosForSlot(
                      quadra.id,
                      dia,
                      hora
                    );
                    const temAgendamento = agendamentosSlot.length > 0;

                    return (
                      <div
                        key={`${dia.toISOString()}-${hora}`}
                        className={cn(
                          "border-r p-1 min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors",
                          isSameDay(dia, new Date()) && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (temAgendamento) {
                            onSelectAgendamento(agendamentosSlot[0].id);
                          } else {
                            onSelectSlot(quadra.id, dia, hora);
                          }
                        }}
                      >
                        {temAgendamento ? (
                          <div className="space-y-1">
                            {agendamentosSlot.map((ag) => (
                              <div key={ag.id} className="space-y-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-xs",
                                    getStatusColor(ag.status)
                                  )}
                                >
                                  <span className="truncate">
                                    {ag.usuarios?.nome_completo || "Cliente"}
                                  </span>
                                </Badge>
                                {ag.checkin_realizado && (
                                  <CheckinStatusBadge
                                    checkinRealizado={ag.checkin_realizado}
                                    dataCheckin={ag.data_checkin}
                                    className="text-[10px] w-full"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center">
                            Disponível
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
