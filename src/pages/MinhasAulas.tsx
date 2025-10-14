import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function MinhasAulas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);

  // Buscar ID do usuário
  const { data: usuario } = useQuery({
    queryKey: ["usuario", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar aulas inscritas (próximas)
  const { data: proximasAulas, isLoading: loadingProximas } = useQuery({
    queryKey: ["minhas-aulas-proximas", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_alunos")
        .select(`
          *,
          aulas(
            id,
            titulo,
            data_aula,
            hora_inicio,
            hora_fim,
            tipo_aula,
            nivel,
            quadras(nome),
            professores:professor_id(
              usuarios(nome_completo)
            )
          )
        `)
        .eq("usuario_id", usuario?.id)
        .gte("aulas.data_aula", new Date().toISOString().split("T")[0])
        .order("aulas(data_aula)", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  // Buscar histórico de aulas
  const { data: historicoAulas, isLoading: loadingHistorico } = useQuery({
    queryKey: ["minhas-aulas-historico", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_alunos")
        .select(`
          *,
          aulas(
            id,
            titulo,
            data_aula,
            hora_inicio,
            hora_fim,
            tipo_aula,
            nivel,
            realizada,
            quadras(nome),
            professores:professor_id(
              usuarios(nome_completo)
            )
          )
        `)
        .eq("usuario_id", usuario?.id)
        .lt("aulas.data_aula", new Date().toISOString().split("T")[0])
        .order("aulas(data_aula)", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!usuario?.id,
  });

  const handleCheckin = async (inscricaoId: string) => {
    setCheckinLoading(inscricaoId);
    try {
      const { error } = await supabase
        .from("aulas_alunos")
        .update({
          presenca: true,
          data_checkin: new Date().toISOString(),
        })
        .eq("id", inscricaoId);

      if (error) throw error;

      toast.success("Check-in realizado com sucesso!", {
        description: "Sua presença foi registrada na aula.",
      });

      queryClient.invalidateQueries({ queryKey: ["minhas-aulas-proximas"] });
    } catch (error: any) {
      toast.error("Erro ao fazer check-in", {
        description: error.message,
      });
    } finally {
      setCheckinLoading(null);
    }
  };

  const renderAulaCard = (inscricao: any, showPresenca: boolean = false) => {
    const aula = inscricao?.aulas;
    if (!aula) return null;

    const professor = aula.professores?.usuarios?.nome_completo || "Professor não definido";
    const quadra = aula.quadras?.nome || "Quadra não definida";
    
    // Verificar se pode fazer check-in (30 min antes até hora da aula)
    const agora = new Date();
    const dataAula = new Date(aula.data_aula);
    const [horaInicio, minInicio] = aula.hora_inicio.split(':');
    const horarioAula = new Date(dataAula);
    horarioAula.setHours(parseInt(horaInicio), parseInt(minInicio), 0);
    const horarioCheckin = new Date(horarioAula.getTime() - 30 * 60000); // 30 min antes
    const podeCheckin = !showPresenca && agora >= horarioCheckin && agora <= horarioAula && !inscricao.presenca;

    return (
      <Card key={inscricao.id} className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{aula.titulo}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{aula.tipo_aula}</Badge>
                {aula.nivel && <Badge variant="secondary">{aula.nivel}</Badge>}
              </div>
            </div>
            {showPresenca && (
              <div className="flex items-center gap-2">
                {inscricao.presenca ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Presente</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500">Ausente</span>
                  </>
                )}
              </div>
            )}
            {podeCheckin && (
              <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                Check-in disponível
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(aula.data_aula), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{aula.hora_inicio.slice(0, 5)} - {aula.hora_fim.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{professor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{quadra}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            {inscricao.status_pagamento && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pagamento:</span>
                <Badge 
                  variant={
                    inscricao.status_pagamento === "pago" ? "default" :
                    inscricao.status_pagamento === "pendente" ? "secondary" :
                    "destructive"
                  }
                >
                  {inscricao.status_pagamento}
                </Badge>
              </div>
            )}
            
            {podeCheckin && (
              <Button
                className="w-full"
                onClick={() => handleCheckin(inscricao.id)}
                disabled={checkinLoading === inscricao.id}
              >
                {checkinLoading === inscricao.id ? "Fazendo check-in..." : "Fazer Check-in"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Minhas Aulas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe suas aulas e frequência
          </p>
        </div>

        <Tabs defaultValue="proximas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="proximas">Próximas Aulas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4">
            {loadingProximas ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : !proximasAulas || proximasAulas.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <EmptyState
                    icon={Calendar}
                    title="Nenhuma aula agendada"
                    description="Você não tem aulas agendadas no momento"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {proximasAulas.map((inscricao) => renderAulaCard(inscricao))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            {loadingHistorico ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : !historicoAulas || historicoAulas.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <EmptyState
                    icon={Calendar}
                    title="Sem histórico"
                    description="Você ainda não participou de nenhuma aula"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Presença</CardTitle>
                    <CardDescription>
                      Resumo da sua frequência nas aulas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{historicoAulas.length}</p>
                        <p className="text-sm text-muted-foreground">Total de Aulas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">
                          {historicoAulas.filter(a => a.presenca).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Presenças</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">
                          {historicoAulas.filter(a => !a.presenca).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Faltas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {historicoAulas.map((inscricao) => renderAulaCard(inscricao, true))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
