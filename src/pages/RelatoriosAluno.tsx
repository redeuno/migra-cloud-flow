import { Layout } from "@/components/Layout";
import { PerfilAccessGuard } from "@/components/PerfilAccessGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Calendar, DollarSign, GraduationCap, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function RelatoriosAluno() {
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

  // Buscar dados do usuário
  const { data: usuario, isLoading: loadingUsuario } = useQuery({
    queryKey: ["usuario-dados"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_id", userData.user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar agendamentos do aluno
  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["aluno-agendamentos", usuario?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          quadras(nome, numero)
        `)
        .eq("cliente_id", usuario?.id)
        .gte("data_agendamento", format(inicio, "yyyy-MM-dd"))
        .lte("data_agendamento", format(fim, "yyyy-MM-dd"))
        .order("data_agendamento", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!usuario?.id,
  });

  // Buscar aulas do aluno
  const { data: aulas, isLoading: loadingAulas } = useQuery({
    queryKey: ["aluno-aulas", usuario?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_alunos")
        .select(`
          *,
          aulas(
            titulo,
            data_aula,
            hora_inicio,
            professores(
              usuarios(nome_completo)
            )
          )
        `)
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!usuario?.id,
  });

  // Buscar mensalidades do aluno
  const { data: mensalidades, isLoading: loadingMensalidades } = useQuery({
    queryKey: ["aluno-mensalidades", usuario?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensalidades")
        .select(`
          *,
          contratos!inner(usuario_id)
        `)
        .eq("contratos.usuario_id", usuario?.id)
        .gte("referencia", format(inicio, "yyyy-MM-dd"))
        .lte("referencia", format(fim, "yyyy-MM-dd"))
        .order("referencia", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!usuario?.id,
  });

  const isLoading = loadingUsuario || loadingAgendamentos || loadingAulas || loadingMensalidades;

  // Calcular métricas
  const totalAgendamentos = agendamentos?.length || 0;
  const agendamentosRealizados = agendamentos?.filter((a) => a.checkin_realizado).length || 0;
  const totalAulas = aulas?.length || 0;
  const aulasPresentes = aulas?.filter((a) => a.presenca).length || 0;
  const totalGasto = mensalidades?.filter((m) => m.status_pagamento === "pago").reduce((acc, m) => acc + Number(m.valor_final), 0) || 0;
  const pagamentosPendentes = mensalidades?.filter((m) => m.status_pagamento === "pendente").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-600">Pago</Badge>;
      case "pendente":
        return <Badge variant="outline">Pendente</Badge>;
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <PerfilAccessGuard allowedRoles={["aluno"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Meu Histórico
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Acompanhe seus agendamentos, aulas e pagamentos
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
                    <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAgendamentos}</div>
                    <p className="text-xs text-muted-foreground">
                      {agendamentosRealizados} realizados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aulas</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalAulas}</div>
                    <p className="text-xs text-muted-foreground">
                      {aulasPresentes} com presença
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalGasto)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      no período
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendências</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pagamentosPendentes}</div>
                    <p className="text-xs text-muted-foreground">
                      pagamentos pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Mensalidades */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>
                    Suas mensalidades e pagamentos no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mensalidades && mensalidades.length > 0 ? (
                    <div className="space-y-2">
                      {mensalidades.map((mensalidade: any) => (
                        <div
                          key={mensalidade.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {format(new Date(mensalidade.referencia), "MMMM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Vencimento: {format(new Date(mensalidade.data_vencimento), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(Number(mensalidade.valor_final))}
                            </span>
                            {getStatusBadge(mensalidade.status_pagamento)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={DollarSign}
                      title="Sem pagamentos"
                      description="Nenhum pagamento encontrado no período"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Aulas */}
              <Card>
                <CardHeader>
                  <CardTitle>Minhas Aulas</CardTitle>
                  <CardDescription>
                    Histórico de participação em aulas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aulas && aulas.length > 0 ? (
                    <div className="space-y-2">
                      {aulas.slice(0, 5).map((aula: any) => (
                        <div
                          key={aula.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{aula.aulas?.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(aula.aulas?.data_aula), "dd/MM/yyyy")} às{" "}
                              {aula.aulas?.hora_inicio}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Professor: {aula.aulas?.professores?.usuarios?.nome_completo}
                            </p>
                          </div>
                          <Badge variant={aula.presenca ? "default" : "outline"}>
                            {aula.presenca ? "Presente" : "Ausente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={GraduationCap}
                      title="Sem aulas"
                      description="Você ainda não participou de nenhuma aula"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PerfilAccessGuard>
    </Layout>
  );
}
