import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Activity, Calendar, CreditCard, User, LogIn, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface HistoricoAtividadesProps {
  usuarioId?: string;
  arenaId?: string;
  limit?: number;
}

const ICONS_TIPO: Record<string, any> = {
  login: LogIn,
  agendamento_criado: Calendar,
  pagamento: CreditCard,
  checkin: Activity,
  cadastro: User,
  outro: FileText,
};

const CORES_TIPO: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  agendamento_criado: "bg-purple-100 text-purple-700",
  pagamento: "bg-green-100 text-green-700",
  checkin: "bg-orange-100 text-orange-700",
  cadastro: "bg-indigo-100 text-indigo-700",
  outro: "bg-gray-100 text-gray-700",
};

export function HistoricoAtividades({ usuarioId, arenaId, limit = 10 }: HistoricoAtividadesProps) {
  const { data: atividades, isLoading } = useQuery({
    queryKey: ["historico-atividades", usuarioId, arenaId, limit],
    queryFn: async () => {
      let query = supabase
        .from("historico_atividades")
        .select(`
          *,
          usuarios(nome_completo, email)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (usuarioId) {
        query = query.eq("usuario_id", usuarioId);
      }
      if (arenaId) {
        query = query.eq("arena_id", arenaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!(usuarioId || arenaId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
        <CardDescription>
          {usuarioId ? "Últimas ações do usuário" : "Atividades recentes da arena"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : !atividades || atividades.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Sem atividades"
            description="Nenhuma atividade registrada ainda"
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {atividades.map((atividade: any) => {
              const IconComponent = ICONS_TIPO[atividade.tipo_acao] || FileText;
              const corTipo = CORES_TIPO[atividade.tipo_acao] || CORES_TIPO.outro;

              return (
                <div 
                  key={atividade.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-accent/30 -mx-2 px-2 py-2 rounded transition-colors"
                >
                  <div className={`p-2 rounded-full ${corTipo}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {atividade.descricao}
                    </p>
                    {!usuarioId && atividade.usuarios && (
                      <p className="text-xs text-muted-foreground truncate">
                        {atividade.usuarios.nome_completo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(atividade.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    {atividade.tipo_acao.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
