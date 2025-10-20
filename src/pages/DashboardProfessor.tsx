import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, GraduationCap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinsProfessor } from "@/components/checkins/CheckinsProfessor";
import { MinhasAvaliacoes } from "@/components/professores/MinhasAvaliacoes";
import { HistoricoAtividadesProfessor } from "@/components/professores/HistoricoAtividadesProfessor";

export default function DashboardProfessor() {
  const { user, arenaId } = useAuth();
  const navigate = useNavigate();

  // Buscar ID do professor baseado no usuário logado
  const { data: professorData } = useQuery({
    queryKey: ["professor-id", user?.id],
    queryFn: async () => {
      const { data: userData } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", user?.id)
        .single();

      if (!userData) return null;

      const { data: professor } = await supabase
        .from("professores")
        .select("id")
        .eq("usuario_id", userData.id)
        .single();

      return professor;
    },
    enabled: !!user?.id,
  });

  const professorId = professorData?.id;

  // Estatísticas do professor
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["professor-stats", professorId, arenaId],
    queryFn: async () => {
      if (!professorId || !arenaId) return null;

      const hoje = new Date().toISOString().split("T")[0];
      const primeiroDiaDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Aulas do mês
      const { count: aulasDoMes } = await supabase
        .from("aulas")
        .select("*", { count: "exact", head: true })
        .eq("professor_id", professorId)
        .eq("arena_id", arenaId)
        .gte("data_aula", primeiroDiaDoMes);

      // Aulas de hoje
      const { count: aulasHoje } = await supabase
        .from("aulas")
        .select("*", { count: "exact", head: true })
        .eq("professor_id", professorId)
        .eq("arena_id", arenaId)
        .eq("data_aula", hoje);

      // Total de alunos únicos
      const { data: alunosData } = await supabase
        .from("aulas_alunos")
        .select("usuario_id, aulas!inner(professor_id)")
        .eq("aulas.professor_id", professorId);

      const alunosUnicos = new Set(alunosData?.map((a: any) => a.usuario_id) || []).size;

      // Comissões pendentes
      const { data: comissoes } = await supabase
        .from("comissoes_professores")
        .select("valor_comissao")
        .eq("professor_id", professorId)
        .eq("status", "pendente");

      const comissoesPendentes = comissoes?.reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;

      return {
        aulasDoMes: aulasDoMes || 0,
        aulasHoje: aulasHoje || 0,
        totalAlunos: alunosUnicos,
        comissoesPendentes,
      };
    },
    enabled: !!professorId && !!arenaId,
  });

  // Próximas aulas
  const { data: proximasAulas, isLoading: aulasLoading } = useQuery({
    queryKey: ["proximas-aulas", professorId, arenaId],
    queryFn: async () => {
      if (!professorId || !arenaId) return [];

      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("aulas")
        .select(`
          id,
          titulo,
          data_aula,
          hora_inicio,
          hora_fim,
          quadras(nome),
          tipo_aula
        `)
        .eq("professor_id", professorId)
        .eq("arena_id", arenaId)
        .gte("data_aula", hoje)
        .order("data_aula", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!professorId && !!arenaId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Meu Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Bem-vindo, professor! Aqui está o resumo das suas atividades.
        </p>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="avaliacoes">Minhas Avaliações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.aulasHoje || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.aulasHoje ? `${stats.aulasHoje} aula${stats.aulasHoje > 1 ? 's' : ''} agendada${stats.aulasHoje > 1 ? 's' : ''}` : "Nenhuma aula hoje"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/minhas-aulas-professor")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aulas do Mês</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.aulasDoMes || 0}</div>
                    <p className="text-xs text-muted-foreground">Total no mês atual</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalAlunos || 0}</div>
                    <p className="text-xs text-muted-foreground">Alunos únicos</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/comissoes")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {(stats?.comissoesPendentes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">A receber</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Aulas</CardTitle>
            </CardHeader>
            <CardContent>
              {aulasLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-3">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : !proximasAulas || proximasAulas.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="Nenhuma aula agendada"
                  description="Você não tem aulas agendadas no momento."
                  className="py-8"
                />
              ) : (
                <div className="space-y-4">
                  {proximasAulas.map((aula: any) => (
                    <div
                      key={aula.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded transition-colors"
                      onClick={() => navigate("/minhas-aulas-professor")}
                    >
                      <div>
                        <p className="font-medium">{aula.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(aula.data_aula), "dd/MMM", { locale: ptBR })} • {aula.hora_inicio.slice(0, 5)} -{" "}
                          {aula.hora_fim.slice(0, 5)}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">{aula.quadras?.nome || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-4">
          <CheckinsProfessor />
        </TabsContent>

        <TabsContent value="avaliacoes" className="space-y-4">
          <MinhasAvaliacoes />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <HistoricoAtividadesProfessor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
