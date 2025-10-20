import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function HistoricoAtividadesProfessor() {
  const { data: professorData } = useQuery({
    queryKey: ["professor-historico-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuário não encontrado");

      return usuario;
    },
  });

  const { data: atividades, isLoading } = useQuery({
    queryKey: ["historico-professor", professorData?.id],
    queryFn: async () => {
      if (!professorData?.id) return [];

      const { data, error } = await supabase
        .from("historico_atividades")
        .select("*")
        .eq("usuario_id", professorData.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    },
    enabled: !!professorData?.id,
  });

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case "aula_criada":
      case "aula_atualizada":
        return <BookOpen className="h-4 w-4" />;
      case "comissao_recebida":
        return <DollarSign className="h-4 w-4" />;
      case "aluno_vinculado":
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getVariantForTipo = (tipo: string) => {
    switch (tipo) {
      case "aula_criada":
        return "default";
      case "aula_atualizada":
        return "secondary";
      case "comissao_recebida":
        return "default";
      case "aluno_vinculado":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Atividades</CardTitle>
      </CardHeader>
      <CardContent>
        {!atividades || atividades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {atividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getIconForTipo(atividade.tipo_acao)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getVariantForTipo(atividade.tipo_acao)} className="text-xs">
                        {atividade.tipo_acao.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(atividade.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{atividade.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
