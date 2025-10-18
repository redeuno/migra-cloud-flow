import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { DollarSign, GraduationCap, Star, TrendingUp, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function RelatoriosProfessor() {
  const { arenaId } = useAuth();
  const [periodo, setPeriodo] = useState("mes_atual");

  const getDateRange = () => {
    const hoje = new Date();
    switch (periodo) {
      case "mes_atual":
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
      case "mes_anterior":
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1);
        return { inicio: startOfMonth(mesPassado), fim: endOfMonth(mesPassado) };
      case "ultimos_3_meses":
        return { inicio: new Date(hoje.getFullYear(), hoje.getMonth() - 3), fim: hoje };
      case "ano_atual":
        return { inicio: new Date(hoje.getFullYear(), 0, 1), fim: hoje };
      default:
        return { inicio: startOfMonth(hoje), fim: endOfMonth(hoje) };
    }
  };

  const { inicio, fim } = getDateRange();

  // Buscar dados do professor
  const { data: professor, isLoading: loadingProfessor } = useQuery({
    queryKey: ["professor-dados", arenaId],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", userData.user.id)
        .single();

      const { data: prof, error } = await supabase
        .from("professores")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .eq("arena_id", arenaId)
        .single();

      if (error) throw error;
      return prof;
    },
    enabled: !!arenaId,
  });

  // Buscar aulas do professor no período
  const { data: aulas, isLoading: loadingAulas } = useQuery({
    queryKey: ["professor-aulas", professor?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select(`
          *,
          aulas_alunos(*)
        `)
        .eq("professor_id", professor?.id)
        .gte("data_aula", format(inicio, "yyyy-MM-dd"))
        .lte("data_aula", format(fim, "yyyy-MM-dd"));

      if (error) throw error;
      return data || [];
    },
    enabled: !!professor?.id,
  });

  // Buscar comissões do professor no período
  const { data: comissoes, isLoading: loadingComissoes } = useQuery({
    queryKey: ["professor-comissoes", professor?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comissoes_professores")
        .select("*")
        .eq("professor_id", professor?.id)
        .gte("referencia", format(inicio, "yyyy-MM-dd"))
        .lte("referencia", format(fim, "yyyy-MM-dd"))
        .order("referencia", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!professor?.id,
  });

  const isLoading = loadingProfessor || loadingAulas || loadingComissoes;

  // Calcular métricas
  const totalAulas = aulas?.length || 0;
  const aulasRealizadas = aulas?.filter((a) => a.realizada).length || 0;
  const totalAlunos = aulas?.reduce((acc, aula) => acc + (aula.aulas_alunos?.length || 0), 0) || 0;
  const comissoesPendentes = comissoes?.filter((c) => c.status === "pendente").reduce((acc, c) => acc + Number(c.valor_comissao), 0) || 0;
  const comissoesPagas = comissoes?.filter((c) => c.status === "pago").reduce((acc, c) => acc + Number(c.valor_comissao), 0) || 0;
  const avaliacaoMedia = professor?.avaliacao_media || 0;

  // Dados para gráfico de aulas por mês
  const aulasPorMes = aulas?.reduce((acc: any, aula) => {
    const mes = format(new Date(aula.data_aula), "MMM", { locale: ptBR });
    const existing = acc.find((item: any) => item.mes === mes);
    if (existing) {
      existing.quantidade++;
    } else {
      acc.push({ mes, quantidade: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["professor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Meus Relatórios
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Acompanhe seu desempenho e comissões
              </p>
            </div>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="ano_atual">Ano Atual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAulas}</div>
                    <p className="text-xs text-muted-foreground">
                      {aulasRealizadas} realizadas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAlunos}</div>
                    <p className="text-xs text-muted-foreground">
                      no período selecionado
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(comissoesPendentes)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      a receber
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avaliacaoMedia.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">
                      de 5 estrelas
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="aulas" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="aulas">Aulas</TabsTrigger>
                  <TabsTrigger value="comissoes">Comissões</TabsTrigger>
                </TabsList>

                <TabsContent value="aulas" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aulas por Mês</CardTitle>
                      <CardDescription>
                        Visualize a distribuição de aulas no período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aulasPorMes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={aulasPorMes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState
                          icon={GraduationCap}
                          title="Sem dados"
                          description="Nenhuma aula encontrada no período selecionado"
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comissoes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Comissões</CardTitle>
                      <CardDescription>
                        Suas comissões no período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {comissoes && comissoes.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between font-medium border-b pb-2">
                              <span className="text-sm">Referência</span>
                              <span className="text-sm">Valor</span>
                              <span className="text-sm">Status</span>
                            </div>
                            {comissoes.map((comissao: any) => (
                              <div key={comissao.id} className="flex items-center justify-between py-2">
                                <span className="text-sm">
                                  {format(new Date(comissao.referencia), "MMMM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="text-sm font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(Number(comissao.valor_comissao))}
                                </span>
                                <span className={`text-sm ${comissao.status === 'pago' ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {comissao.status === 'pago' ? 'Pago' : 'Pendente'}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-4 flex justify-between font-bold">
                            <span>Total Pago:</span>
                            <span className="text-green-600">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(comissoesPagas)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={DollarSign}
                          title="Sem comissões"
                          description="Nenhuma comissão encontrada no período selecionado"
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
