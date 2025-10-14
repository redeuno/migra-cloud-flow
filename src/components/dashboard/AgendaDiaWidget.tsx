import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AgendaDiaWidgetProps {
  arenaId: string;
  className?: string;
}

export function AgendaDiaWidget({ arenaId, className }: AgendaDiaWidgetProps) {
  const navigate = useNavigate();
  const hoje = new Date().toISOString().split("T")[0];

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["agenda-dia", arenaId, hoje],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          id,
          hora_inicio,
          hora_fim,
          modalidade,
          status,
          checkin_realizado,
          quadras(nome, numero),
          usuarios:cliente_id(nome_completo)
        `)
        .eq("arena_id", arenaId)
        .eq("data_agendamento", hoje)
        .order("hora_inicio", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!arenaId,
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda de Hoje
        </CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !agendamentos || agendamentos.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nenhum agendamento hoje"
            description="A agenda está livre"
            className="py-4"
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {agendamentos.map((agendamento: any) => (
              <div
                key={agendamento.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate("/agendamentos")}
              >
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {agendamento.hora_inicio.slice(0, 5)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {agendamento.hora_fim.slice(0, 5)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {agendamento.quadras?.nome || `Quadra ${agendamento.quadras?.numero}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {agendamento.usuarios?.nome_completo || "Cliente"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {agendamento.modalidade}
                    </Badge>
                    {agendamento.checkin_realizado && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        Check-in ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
